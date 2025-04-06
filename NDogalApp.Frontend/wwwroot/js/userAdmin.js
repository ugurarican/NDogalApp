import { API_BASE_URL, makeApiRequest } from './api.js';
import {
    getToken, isAdmin, UserTypeEnum, UserTypeText, escapeHtml,
    displayMessage, clearMessage, disableButtons, enableButtons, getUserInfo,
    showLoadingOverlay, hideLoadingOverlay, showButtonLoading, hideButtonLoading
} from './uiHelpers.js';

// --- DOM Elementleri ---
const adminUserSection = document.getElementById('admin-user-section');
const adminUserListContainer = document.getElementById('admin-user-list-container');
const adminUserTable = document.getElementById('admin-user-table');
const adminUserTableBody = adminUserTable?.querySelector('tbody');
const userListMessageDiv = document.getElementById('user-list-message');

// --- Modal Elementleri ---
const editUserModal = document.getElementById('editUserModal');
const editUserForm = document.getElementById('editUserForm');
const editUserIdInput = document.getElementById('editUserId');
const editUserEmailDisplay = document.getElementById('editUserEmailDisplay');
const editUserFirstNameInput = document.getElementById('editUserFirstName');
const editUserLastNameInput = document.getElementById('editUserLastName');
const editUserPhoneInput = document.getElementById('editUserPhone');
const editUserAddressInput = document.getElementById('editUserAddress');
const editUserTypeSelect = document.getElementById('editUserType');
const editUserFormMessage = document.getElementById('editUserFormMessage');
const editUserSubmitBtn = document.getElementById('editUserSubmitBtn');
const editUserCancelBtn = document.getElementById('editUserCancelBtn');
const closeModalBtns = document.querySelectorAll('#editUserModal .close-modal-btn');

// --- Callback ---
let _handleUnauthorizedCallback = () => { console.error("UserAdmin Module: Unauthorized callback not set."); };

// --- Dahili Fonksiyonlar ---

/**
 * API'den tüm kullanıcıları çeker (Admin yetkisiyle).
 * @returns {Promise<Array|null>} Kullanıcı listesi veya null.
 */
async function fetchUsersForAdminInternal() {
    console.log('[userAdmin.js] fetchUsersForAdminInternal - Starting fetch...');
    if (!adminUserListContainer) { console.error("fetchUsersForAdminInternal: adminUserListContainer not found!"); return null; }

    showLoadingOverlay(adminUserListContainer, 'Kullanıcılar Yükleniyor...');
    if (adminUserTable) adminUserTable.classList.add('hidden'); // Tabloyu gizle
    adminUserListContainer.innerHTML = ''; // Mevcut mesajları/içeriği temizle
    clearMessage(userListMessageDiv); // Hata mesajı alanını temizle

    let usersData = null;
    const token = getToken();
    if (!token || !isAdmin()) { // Yetki kontrolü
        hideLoadingOverlay(adminUserListContainer);
        adminUserListContainer.innerHTML = '<p style="color:red;">Kullanıcıları görüntüleme yetkiniz yok.</p>';
        _handleUnauthorizedCallback(); // Merkezi handler'ı çağır
        return null;
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/users`, 'GET', null, token); // API endpointini kontrol et
        console.log('[userAdmin.js] API Response from /api/users:', result);

        if (result.success && Array.isArray(result.data)) { // Veri dizi mi?
            usersData = result.data;
        } else if (result.status === 401 || result.status === 403) {
            _handleUnauthorizedCallback();
            adminUserListContainer.innerHTML = '<p style="color:red;">Yetki hatası veya oturum süresi doldu.</p>';
        } else {
            console.error(`Fetch Users Error: ${result.error || 'Unknown API error'}`);
            adminUserListContainer.innerHTML = `<p style="color:red;">Kullanıcılar yüklenemedi: ${escapeHtml(result.error || `Hata (${result.status})`)}</p>`;
        }
    } catch (error) {
        // Network veya JS hatası
        console.error("Fetch Users Catch Error:", error);
        adminUserListContainer.innerHTML = `<p style="color:red;">Kullanıcılar yüklenirken ağ hatası: ${escapeHtml(error.message)}</p>`;
    } finally {
        hideLoadingOverlay(adminUserListContainer); // Spinner'ı kaldır
        console.log("fetchUsersForAdminInternal finished. Data:", usersData);
        // Liste boşsa veya hata varsa displayAdminUsers mesaj gösterecek
    }
    return usersData; // null veya kullanıcı dizisi
}

/**
 * Alınan kullanıcı listesini yönetici tablosunda gösterir.
 * @param {Array|null} users Gösterilecek kullanıcılar veya null.
 */
function displayAdminUsers(users) {
    console.log('[userAdmin.js] Displaying Admin Users, received data:', users);
    if (!adminUserTableBody || !adminUserTable || !adminUserListContainer) {
        console.error("displayAdminUsers: Required table elements not found.");
        if (adminUserListContainer) adminUserListContainer.innerHTML = '<p style="color:red;">Kullanıcı tablosu elementleri bulunamadı.</p>';
        return;
    }
    adminUserTableBody.innerHTML = ''; // Önce tabloyu temizle

    // Kullanıcı yoksa veya veri null ise mesaj göster
    if (users === null || !Array.isArray(users) || users.length === 0) {
        console.log("displayAdminUsers: No users to display or data is null.");
        // Önemli: listContainer'ın içini burada temizlemiyoruz, çünkü fetch içinden hata mesajı gelmiş olabilir
        if (!adminUserListContainer.querySelector('p[style*="color:red"]')) { // Eğer hata mesajı yoksa "boş" mesajı ekle
            adminUserListContainer.innerHTML = '<p>Kayıtlı kullanıcı bulunmamaktadır.</p>';
        }
        adminUserTable.classList.add('hidden'); // Tabloyu gizle
        return;
    }

    // Kullanıcılar varsa tabloyu doldur
    console.log(`[userAdmin.js] Rendering ${users.length} users...`);
    const currentAdminId = getUserInfo()?.id; // Kendini sil/düzenle kontrolü için
    try {
        users.forEach(user => {
            if (!user || typeof user !== 'object' || user.id === undefined) {
                console.warn("[userAdmin.js] Skipping invalid user data:", user); return;
            }
            const row = adminUserTableBody.insertRow();
            row.dataset.userId = user.id;
            const userTypeString = UserTypeText[user.userType] || `Bilinmiyor (${user.userType})`;

            row.innerHTML = `
                <td data-label="ID">${user.id}</td>
                <td data-label="Ad Soyad">${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</td>
                <td data-label="Email">${escapeHtml(user.email || '-')}</td>
                <td data-label="Tip">${userTypeString}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-action="edit-user" data-id="${user.id}" title="Düzenle">✏️</button>
                    <button class="delete-btn" data-action="delete-user" data-id="${user.id}" title="Sil" ${user.id === currentAdminId ? 'disabled title="Kendinizi silemezsiniz"' : ''}>🗑️</button>
                </td>`;
        });

        // Mesajları temizle (varsa) ve tabloyu ekle/göster
        if (!adminUserListContainer.contains(adminUserTable)) {
            adminUserListContainer.innerHTML = ''; // Önceki mesajları temizle
            adminUserListContainer.appendChild(adminUserTable);
        }
        adminUserTable.classList.remove('hidden');
        clearMessage(userListMessageDiv); // Başarılı listeleme sonrası genel list mesajını temizle

    } catch (error) {
        console.error("[userAdmin.js] Error rendering admin users table:", error);
        adminUserListContainer.innerHTML = '<p style="color:red;">Kullanıcı tablosu oluşturulurken hata oluştu.</p>';
        adminUserTable.classList.add('hidden');
    }
}

/**
 * Yönetici kullanıcı listesini yeniler.
 */
async function refreshAdminUserList() {
    console.log("[userAdmin.js] refreshAdminUserList called.");
    if (!adminUserListContainer) return;
    const users = await fetchUsersForAdminInternal(); // fetch; overlay, hata yönetimi yapar
    displayAdminUsers(users); // display; null, boş, tablo/mesaj gösterimini yapar
}

// --- Modal Fonksiyonları ---
function closeEditUserModal() {
    if (editUserModal) editUserModal.classList.add('hidden');
}

function resetEditForm() {
    if (editUserForm) editUserForm.reset();
    if (editUserIdInput) editUserIdInput.value = '';
    if (editUserEmailDisplay) editUserEmailDisplay.textContent = '-';
    if (editUserTypeSelect) editUserTypeSelect.selectedIndex = 0;
    if (editUserFormMessage) clearMessage(editUserFormMessage);
    // Butonları resetle
    if (editUserSubmitBtn) enableButtons([editUserSubmitBtn]);
    if (editUserCancelBtn) enableButtons([editUserCancelBtn]);
}

function populateUserTypeSelect() {
    if (!editUserTypeSelect || editUserTypeSelect.options.length > 1) return; // Zaten doluysa tekrar doldurma
    editUserTypeSelect.innerHTML = '<option value="">--Rol Seçiniz--</option>'; // Default
    for (const typeId in UserTypeEnum) {
        const value = UserTypeEnum[typeId];
        const text = UserTypeText[value];
        if (text) { // Sadece metni olanları ekle
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            editUserTypeSelect.appendChild(option);
        }
    }
}

/**
 * Kullanıcı düzenleme modalını açar ve ilgili kullanıcının verilerini yükler.
 * @param {number|string} userId Düzenlenecek kullanıcının ID'si.
 */
async function startEditUser(userId) {
    console.log(`[userAdmin.js] startEditUser called for ID: ${userId}`);
    if (!editUserModal || !editUserForm) { console.error("Edit user modal or form not found!"); return; }
    resetEditForm(); // Formu temizle
    populateUserTypeSelect(); // Rol dropdown'ını doldur
    const modalBody = editUserModal.querySelector('.modal-body');
    if (modalBody) showLoadingOverlay(modalBody, 'Kullanıcı bilgileri yükleniyor...');

    const token = getToken();
    if (!token || !isAdmin()) {
        _handleUnauthorizedCallback();
        if (modalBody) hideLoadingOverlay(modalBody);
        return;
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/users/${userId}`, 'GET', null, token); // Kullanıcı detay endpoint'i
        console.log(`[userAdmin.js] Get user details response for ID ${userId}:`, result);

        if (result.success && result.data) {
            const user = result.data;
            // Formu doldur
            if (editUserIdInput) editUserIdInput.value = user.id;
            if (editUserEmailDisplay) editUserEmailDisplay.textContent = escapeHtml(user.email || '-');
            if (editUserFirstNameInput) editUserFirstNameInput.value = user.firstName || '';
            if (editUserLastNameInput) editUserLastNameInput.value = user.lastName || '';
            if (editUserPhoneInput) editUserPhoneInput.value = user.phoneNumber || '';
            if (editUserAddressInput) editUserAddressInput.value = user.address || '';
            if (editUserTypeSelect) editUserTypeSelect.value = user.userType;

            // Modalı göster
            editUserModal.classList.remove('hidden');
        } else {
            if (result.status === 401 || result.status === 403) {
                _handleUnauthorizedCallback();
                closeEditUserModal(); // Modalı kapat
            } else {
                // Genel liste mesajında hatayı göster
                if (userListMessageDiv) displayMessage(userListMessageDiv, `Kullanıcı detayı yüklenemedi: ${escapeHtml(result.error || 'Hata')}`, true, 0);
            }
        }
    } catch (error) {
        console.error(`[userAdmin.js] Error fetching user details for edit:`, error);
        if (userListMessageDiv) displayMessage(userListMessageDiv, `Kullanıcı bilgileri alınırken ağ hatası: ${escapeHtml(error.message)}`, true, 0);
    } finally {
        if (modalBody) hideLoadingOverlay(modalBody); // Spinner'ı kaldır
    }
}

/**
 * Kullanıcı düzenleme formunu submit eder.
 * @param {Event} event Form submit olayı.
 */
async function handleEditUserFormSubmit(event) {
    event.preventDefault();
    console.log("[userAdmin.js] handleEditUserFormSubmit called.");
    if (!isAdmin() || !editUserForm) return;
    if (editUserFormMessage) clearMessage(editUserFormMessage);

    const userId = editUserIdInput?.value;
    if (!userId) { if (editUserFormMessage) displayMessage(editUserFormMessage, 'Kullanıcı ID bulunamadı.', true); return; }

    // Değerleri al ve validate et
    const updatedData = {
        firstName: editUserFirstNameInput?.value.trim() ?? '',
        lastName: editUserLastNameInput?.value.trim() ?? '',
        phoneNumber: editUserPhoneInput?.value.trim() || null,
        address: editUserAddressInput?.value.trim() || null,
        userType: parseInt(editUserTypeSelect?.value || '0', 10)
    };

    let errors = [];
    if (!updatedData.firstName) errors.push("Ad zorunludur.");
    if (!updatedData.lastName) errors.push("Soyad zorunludur.");
    if (!updatedData.userType || !(updatedData.userType in UserTypeText)) errors.push("Geçerli bir kullanıcı tipi seçin.");
    // Kendi rolünü düşürme kontrolü
    const currentAdminId = getUserInfo()?.id;
    if (currentAdminId && userId == currentAdminId && updatedData.userType === UserTypeEnum.Customer) {
        errors.push("Yönetici kendi rolünü müşteri yapamaz.");
    }

    if (errors.length > 0) {
        if (editUserFormMessage) displayMessage(editUserFormMessage, errors.join('\n'), true, 0);
        return;
    }

    const token = getToken();
    if (!token) { _handleUnauthorizedCallback(); return; }

    const buttons = [editUserSubmitBtn, editUserCancelBtn];
    showButtonLoading(editUserSubmitBtn, 'Kaydediliyor...');
    disableButtons(buttons);

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/users/${userId}`, 'PUT', updatedData, token);
        console.log(`[userAdmin.js] PUT /api/users/${userId} response:`, result);

        if (result.success) {
            if (editUserFormMessage) displayMessage(editUserFormMessage, result.data?.message || 'Başarıyla güncellendi!', false, 3000);
            // Güncelleme başarılı, modalı kapat ve listeyi yenile
            setTimeout(async () => {
                closeEditUserModal();
                await refreshAdminUserList();
            }, 1500); // Mesajın görünmesi için kısa bir süre bekle
        } else {
            if (result.status === 401 || result.status === 403) {
                _handleUnauthorizedCallback();
                closeEditUserModal(); // Yetki hatasında da modalı kapat
            } else {
                // Diğer API hataları
                if (editUserFormMessage) displayMessage(editUserFormMessage, `Güncelleme hatası: ${escapeHtml(result.error || 'Bilinmeyen')}`, true, 0);
                enableButtons(buttons); // Hata durumunda butonları tekrar aktif et
            }
        }
    } catch (error) {
        console.error("[userAdmin.js] Error submitting user edit form:", error);
        if (editUserFormMessage) displayMessage(editUserFormMessage, `Ağ/istemci hatası: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(buttons); // Ağ hatasında butonları aktif et
    }
}


/**
 * Belirtilen ID'li kullanıcıyı siler.
 * @param {HTMLButtonElement} deleteButton Sil butonuna referans.
 */
async function deleteUser(deleteButton) {
    const userId = deleteButton?.dataset?.id;
    if (!userId) { console.error("Delete button missing user ID."); return; }

    const row = deleteButton.closest('tr');
    const userName = row?.querySelector('td[data-label="Ad Soyad"]')?.textContent || `ID: ${userId}`;
    const currentUserId = getUserInfo()?.id;

    if (userId == currentUserId) {
        alert("Yönetici kendi hesabını silemez.");
        return;
    }

    if (!confirm(`'${userName}' kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
        return;
    }

    if (userListMessageDiv) clearMessage(userListMessageDiv);
    const token = getToken();
    if (!token || !isAdmin()) { _handleUnauthorizedCallback(); return; }

    const actionButtons = row?.querySelectorAll('.actions-cell button');
    showButtonLoading(deleteButton, '...');
    disableButtons(Array.from(actionButtons || []).filter(b => b !== deleteButton));

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/users/${userId}`, 'DELETE', null, token);
        console.log(`[userAdmin.js] DELETE /api/users/${userId} response:`, result);

        if (result.success) {
            if (userListMessageDiv) displayMessage(userListMessageDiv, result.data?.message || "Kullanıcı silindi.", false, 4000);
            await refreshAdminUserList(); // Listeyi yenile
            // Modal açıksa ve silinen kullanıcı düzenleniyorsa modalı kapat/resetle
            if (editUserModal && !editUserModal.classList.contains('hidden') && editUserIdInput?.value === userId) {
                closeEditUserModal();
            }
        } else {
            if (result.status === 401 || result.status === 403) {
                _handleUnauthorizedCallback();
            } else {
                if (userListMessageDiv) displayMessage(userListMessageDiv, `Silinemedi: ${escapeHtml(result.error || 'Hata')}`, true, 0);
                // Hata durumunda butonları tekrar etkinleştir
                hideButtonLoading(deleteButton); // Spinner'ı kaldır
                enableButtons(Array.from(actionButtons || []));
            }
        }
    } catch (error) {
        console.error("[userAdmin.js] Error deleting user:", error);
        if (userListMessageDiv) displayMessage(userListMessageDiv, `Kullanıcı silinirken ağ hatası: ${escapeHtml(error.message)}`, true, 0);
        // Ağ hatasında butonları tekrar etkinleştir
        hideButtonLoading(deleteButton);
        enableButtons(Array.from(actionButtons || []));
    }
    // `finally` bloğuna gerek yok, `hideButtonLoading` veya `refreshAdminUserList` durumu yönetiyor.
}


/**
 * Admin kullanıcı listesindeki aksiyon butonu tıklamalarını yönetir.
 * @param {Event} event Tıklama olayı.
 */
function handleAdminUserAction(event) {
    const button = event.target.closest('button[data-action][data-id]');
    if (!button) return;

    const action = button.dataset.action;
    const userId = button.dataset.id;

    if (action === 'edit-user') {
        startEditUser(userId);
    } else if (action === 'delete-user') {
        deleteUser(button);
    } else {
        console.warn(`[userAdmin.js] Unknown user action: ${action}`);
    }
}


// --- Modül Başlatma ---
export function initializeUserAdmin(unauthorizedCb) {
    console.log("Initializing User Admin Module...");
    if (typeof unauthorizedCb === 'function') {
        _handleUnauthorizedCallback = unauthorizedCb;
    } else { console.error("User Admin Init Error: unauthorizedCb is not a function!"); }

    // Olay dinleyicileri
    if (adminUserTableBody) {
        adminUserTableBody.addEventListener('click', handleAdminUserAction); // Tablo aksiyonları için delegasyon
        console.log("Admin user table action listener added.");
    } else { console.warn("Admin user table body (#admin-user-table tbody) not found! User actions will not work."); }

    // Modal olayları
    if (editUserModal && editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserFormSubmit);
        // Kapatma butonları (X ve İptal)
        closeModalBtns.forEach(btn => btn.addEventListener('click', closeEditUserModal));
        if (editUserCancelBtn) editUserCancelBtn.addEventListener('click', closeEditUserModal);
        // Modal dışına tıklayınca kapatma (opsiyonel)
        editUserModal.addEventListener('click', (event) => {
            if (event.target === editUserModal) { // Sadece modalın dış arka planına tıklanırsa
                closeEditUserModal();
            }
        });
        console.log("Edit user modal listeners added.");
    } else { console.warn("Edit User Modal or Form not found! Edit functionality disabled."); }

    console.log("User Admin Module Initialized.");

    /**
     * Admin kullanıcı yönetimi bölümünü gösterir ve listeyi yükler.
     */
    async function showAdminUserSection() {
        console.log("[userAdmin.js] showAdminUserSection called.");
        if (!adminUserSection) { console.error("Admin user section element (#admin-user-section) not found"); return; }
        if (!isAdmin()) {
            alert("Bu bölümü görüntüleme yetkiniz yok.");
            _handleUnauthorizedCallback();
            return;
        }

        // ---> Bölümü Göster <---
        if (window.hideOtherSections) {
            window.hideOtherSections(adminUserSection);
        } else {
            adminUserSection.classList.remove('hidden'); // Fallback
        }

        clearMessage(userListMessageDiv); // Önceki mesajları temizle
        await refreshAdminUserList(); // Kullanıcıları çek ve göster (spinner, hata yönetimi içerir)
    }

    // Dışarı açılan fonksiyonlar
    return {
        showAdminUserSection
    };
}