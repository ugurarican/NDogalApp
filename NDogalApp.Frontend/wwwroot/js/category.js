import { API_BASE_URL, makeApiRequest } from './api.js';
import {
    getToken, isAdmin, displayMessage, clearMessage,
    disableButtons, enableButtons, escapeHtml, showLoadingOverlay,
    hideLoadingOverlay, showButtonLoading, hideButtonLoading
} from './uiHelpers.js';

// --- DOM Elementleri ---
const contentListContainer = document.getElementById('content-list');
const mainContentTitle = document.getElementById('main-content-title');
const adminCategorySection = document.getElementById('admin-category-section');
const categoryForm = document.getElementById('admin-category-form');
const categoryFormTitle = document.getElementById('category-form-title');
const categoryIdInput = document.getElementById('admin-category-id');
const categoryNameInput = document.getElementById('admin-category-name');
const categoryDescriptionInput = document.getElementById('admin-category-description');
const categoryFormMessageDiv = document.getElementById('category-form-message');
const categorySubmitBtn = document.getElementById('admin-category-submit-btn');
const categoryFormCancelBtn = document.getElementById('admin-category-form-cancel-btn');
const adminCategoryListContainer = document.getElementById('admin-category-list-container');
const adminCategoryTable = document.getElementById('admin-category-table');
const adminCategoryTableBody = adminCategoryTable?.querySelector('tbody');
const categoryListMessageDiv = document.getElementById('category-list-message');

// --- Edit Modal DOM Elementleri ---
const editCategoryModal = document.getElementById('editCategoryModal'); // Yeni eklendi, HTML'e de eklenmeli
const editCategoryForm = document.getElementById('editCategoryForm');     // Yeni eklendi
const editCategoryIdInput = document.getElementById('editCategoryId'); // Yeni eklendi
const editCategoryNameInput = document.getElementById('editCategoryName'); // Yeni eklendi
const editCategoryDescriptionInput = document.getElementById('editCategoryDescription'); // Yeni eklendi
const editCategoryFormMessage = document.getElementById('editCategoryFormMessage'); // Yeni eklendi
const editCategorySubmitBtn = document.getElementById('editCategorySubmitBtn'); // Yeni eklendi
const editCategoryCancelBtn = document.getElementById('editCategoryCancelBtn'); // Yeni eklendi
const editCategoryCloseModalBtns = document.querySelectorAll('#editCategoryModal .close-modal-btn'); // Yeni eklendi


// --- Callbacks ---
let _handleUnauthorizedCallback = () => { console.error("Category Module: Unauthorized callback not set.") };
let _fetchProductsForCategoryCallback = (categoryId, categoryName) => { console.warn("Category Module: Fetch products callback not set.") };
let _populateProductCategoryDropdownCallback = (categories) => { console.warn("Category Module: Populate product dropdown callback not set.") };

// --- Dahili Fonksiyonlar ---

/**
 * API'den kategorileri çeker, spinner gösterir ve temel hata durumlarını yönetir.
 * @param {HTMLElement} showSpinnerOn Spinner'ın gösterileceği konteyner.
 * @returns {Promise<Array|null>} Kategori dizisi veya hata durumunda null.
 */
async function fetchCategoriesInternal(showSpinnerOn) {
    const listContainer = showSpinnerOn || contentListContainer; // Varsayılan konteyner
    if (!listContainer) { console.error("[category.js] fetchCategoriesInternal: Cannot determine list container."); return null; }

    console.log(`[category.js] fetchCategoriesInternal: Fetching. Spinner on ${listContainer.id}.`);
    const originalContent = listContainer.innerHTML;
    showLoadingOverlay(listContainer, 'Kategoriler Yükleniyor...');
    if (listContainer === adminCategoryListContainer && adminCategoryTable) {
        adminCategoryTable.classList.add('hidden');
    }

    let categories = null; // Başlangıçta null
    try {
        // API isteği public, token gerekmez.
        const result = await makeApiRequest(`${API_BASE_URL}/api/categories`, 'GET', null, false);
        console.log("[category.js] /api/categories Response:", result);

        if (result.success && Array.isArray(result.data)) {
            categories = result.data;
            if (listContainer === adminCategoryListContainer && categoryListMessageDiv) {
                clearMessage(categoryListMessageDiv);
            }
        } else {
            // API veya sunucu hatası
            const errorMsg = `Kategoriler yüklenemedi: ${escapeHtml(result.error || `API Hatası (${result.status})`)}`;
            if (listContainer === adminCategoryListContainer && categoryListMessageDiv) {
                displayMessage(categoryListMessageDiv, errorMsg, true, 0); // Genel mesaj alanına yaz
                listContainer.innerHTML = ''; // Sadece mesaj kalsın
                if (adminCategoryTable) adminCategoryTable.classList.add('hidden'); // Tabloyu gizle
            } else {
                listContainer.innerHTML = `<p style="color:red;">${errorMsg}</p>`; // Ana içerik alanına yaz
            }
            console.error("Error fetching categories:", errorMsg);
        }
    } catch (error) {
        // Ağ hatası veya JS hatası
        const errorMsg = `Kategoriler alınırken hata: ${escapeHtml(error.message)}`;
        if (listContainer === adminCategoryListContainer && categoryListMessageDiv) {
            displayMessage(categoryListMessageDiv, errorMsg, true, 0);
            listContainer.innerHTML = ''; // Sadece mesaj kalsın
            if (adminCategoryTable) adminCategoryTable.classList.add('hidden'); // Tabloyu gizle
        } else {
            listContainer.innerHTML = `<p style="color:red;">${errorMsg}</p>`;
        }
        console.error("Catch error fetching categories:", error);
    } finally {
        hideLoadingOverlay(listContainer);
        console.log(`[category.js] fetchCategoriesInternal finished. ${categories?.length ?? 'No'} categories returned.`);
    }
    return categories; // null veya kategori dizisi
}

export async function fetchCategories() {
    const result = await makeApiRequest(`${API_BASE_URL}/api/categories`, 'GET', null, null);
    return (result.success && Array.isArray(result.data)) ? result.data : [];
}

// --- Public Gösterim (Ana Sayfa) ---

export async function displayCategoriesForHome() {
    if (!contentListContainer || !mainContentTitle) return;
    console.log("[category.js] displayCategoriesForHome called.");
    if (mainContentTitle) mainContentTitle.textContent = "Kategoriler";
    // ---> DÜZELTME: Fetch sonucuna göre display çağır <---
    const categories = await fetchCategoriesInternal(contentListContainer); // Fetch handles spinner/fetch errors
    if (categories !== null) { // Sadece başarılı fetch durumunda display çağır
        displayCategoryCards(categories);
    }
}

function displayCategoryCards(categories) {
    if (!contentListContainer) return;
    if (!Array.isArray(categories) || categories.length === 0) {
        if (!contentListContainer.querySelector('p')) { // Eğer fetchten gelen hata yoksa "boş" mesajı ekle
            contentListContainer.innerHTML = '<p>Gösterilecek kategori yok.</p>';
        }
        contentListContainer.className = 'content-container'; // Grid classını kaldır
        return;
    }
    // Başarılıysa eski içeriği temizle ve kartları oluştur
    contentListContainer.innerHTML = '';
    contentListContainer.className = 'content-container category-grid';

    try {
        categories.forEach(cat => {
            if (!cat || typeof cat.id !== 'number') { console.warn("Invalid category data skipped:", cat); return; }
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <h3>${escapeHtml(cat.name || '')}</h3>
                <p>${escapeHtml(cat.description || '')}</p>
                <button data-category-id="${cat.id}">Ürünleri Gör</button>
            `;
            const btn = card.querySelector('button');
            if (btn) {
                btn.addEventListener('click', () => {
                    // Kategoriye tıklayınca ilgili ürünleri yükle
                    if (typeof _fetchProductsForCategoryCallback === 'function') {
                        _fetchProductsForCategoryCallback(cat.id, cat.name);
                    } else {
                        console.error("Fetch products callback not registered!");
                    }
                });
            }
            contentListContainer.appendChild(card);
        });
    } catch (error) {
        console.error("[category.js] Error rendering category cards:", error);
        contentListContainer.innerHTML = '<p style="color:red">Kategori kartları oluşturulurken hata.</p>';
        contentListContainer.className = 'content-container';
    }
}

// --- Admin Yönetimi Fonksiyonları ---

function resetCategoryForm() {
    if (!categoryForm) return;
    categoryForm.reset();
    if (categoryIdInput) categoryIdInput.value = ''; // Hidden ID'yi temizle
    if (categoryFormTitle) categoryFormTitle.textContent = 'Yeni Kategori Ekle';
    if (categorySubmitBtn) categorySubmitBtn.textContent = 'Kategoriyi Ekle';
    if (categoryFormCancelBtn) categoryFormCancelBtn.classList.add('hidden');
    if (categoryFormMessageDiv) clearMessage(categoryFormMessageDiv);
}

/**
 * Admin panelindeki kategori tablosunu doldurur.
 * @param {Array|null} categories Gösterilecek kategoriler veya fetch hatası durumunda null.
 */
function displayAdminCategories(categories) {
    console.log(`[category.js] Displaying ${categories?.length ?? 0} admin categories.`);
    if (!adminCategoryTableBody || !adminCategoryTable || !adminCategoryListContainer) {
        console.error("displayAdminCategories: Required table/container elements missing.");
        if (adminCategoryListContainer) adminCategoryListContainer.innerHTML = '<p style="color:red">Tablo hatası.</p>';
        return;
    }
    adminCategoryTableBody.innerHTML = ''; // Tablo içini her zaman temizle

    // Veri null ise (fetch hatası) veya boş dizi ise
    if (categories === null || categories.length === 0) {
        // Eğer konteynerde fetch'ten gelen hata mesajı yoksa "boş" mesajını göster.
        if (!adminCategoryListContainer.querySelector('p[style*="color:red"]')) {
            adminCategoryListContainer.innerHTML = '<p>Kayıtlı kategori bulunmamaktadır.</p>';
        }
        adminCategoryTable.classList.add('hidden'); // Tabloyu gizle
        return;
    }

    // Veri varsa, tabloyu doldur
    try {
        categories.forEach(cat => {
            if (!cat || typeof cat.id !== 'number') { console.warn("Skipping invalid category in admin list:", cat); return; }
            const row = adminCategoryTableBody.insertRow();
            row.dataset.categoryId = cat.id; // ID'yi sakla
            // --- DÜZELTME: Butonlara data-action ve data-id eklendi ---
            row.innerHTML = `
                <td data-label="ID">${cat.id}</td>
                <td data-label="Ad">${escapeHtml(cat.name || '')}</td>
                <td data-label="Açıklama">${escapeHtml(cat.description || '-')}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-action="edit-category" data-id="${cat.id}" title="Düzenle">✏️</button>
                    <button class="delete-btn" data-action="delete-category" data-id="${cat.id}" title="Sil">🗑️</button>
                </td>`;
        });

        // Hata/boş mesajı varsa temizle ve tabloyu göster/ekle
        if (adminCategoryListContainer.querySelector('p')) {
            adminCategoryListContainer.innerHTML = ''; // Mesajı temizle
        }
        if (!adminCategoryListContainer.contains(adminCategoryTable)) {
            adminCategoryListContainer.appendChild(adminCategoryTable);
        }
        adminCategoryTable.classList.remove('hidden'); // Tabloyu göster
        clearMessage(categoryListMessageDiv); // Genel liste mesajını temizle (başarılı olduğu için)

    } catch (error) {
        console.error("[category.js] Error rendering admin categories table:", error);
        adminCategoryListContainer.innerHTML = '<p style="color:red">Kategori tablosu oluşturulurken hata.</p>';
        adminCategoryTable.classList.add('hidden'); // Hata durumunda tabloyu gizle
    }
}

async function refreshAdminCategoryList() {
    console.log("[category.js] Refreshing admin category list...");
    if (!adminCategoryListContainer) return;
    clearMessage(categoryListMessageDiv);
    const categories = await fetchCategoriesInternal(adminCategoryListContainer); // Spinner/hata burada yönetilir
    // Sadece fetch başarılı ise (null değilse) display çağır
    if (categories !== null) {
        displayAdminCategories(categories);
    }
}

async function handleCategoryFormSubmit(event) {
    event.preventDefault();
    if (!isAdmin() || !categoryForm) { alert("Yetkiniz yok veya form bulunamadı."); return; }

    clearMessage(categoryFormMessageDiv);
    clearMessage(categoryListMessageDiv);

    const categoryId = categoryIdInput?.value ? parseInt(categoryIdInput.value, 10) : 0;
    const categoryData = {
        name: categoryNameInput?.value.trim() ?? '',
        description: categoryDescriptionInput?.value.trim() || null
    };

    if (!categoryData.name) {
        displayMessage(categoryFormMessageDiv, "Kategori adı zorunludur.", true);
        return;
    }

    const token = getToken();
    if (!token) { _handleUnauthorizedCallback(); return; }

    const buttonsToDisable = [categorySubmitBtn, categoryFormCancelBtn].filter(btn => btn && !btn.classList.contains('hidden'));
    showButtonLoading(categorySubmitBtn, "Kaydediliyor...");
    disableButtons(buttonsToDisable);

    let result;
    let method = categoryId > 0 ? 'PUT' : 'POST';
    let url = `${API_BASE_URL}/api/categories` + (categoryId > 0 ? `/${categoryId}` : '');

    try {
        result = await makeApiRequest(url, method, categoryData, token);

        if (result.success) {
            displayMessage(categoryFormMessageDiv, result.data?.message || (categoryId > 0 ? "Kategori başarıyla güncellendi!" : "Kategori başarıyla eklendi!"), false, 3000);
            resetCategoryForm();
            await refreshAdminCategoryList(); // Listeyi yenile
            // Ürün yönetimi dropdown'ını da güncelle
            const latestCategories = await fetchCategories(); // Yeni listeyi çek
            if (typeof _populateProductCategoryDropdownCallback === 'function') {
                _populateProductCategoryDropdownCallback(latestCategories);
            }
        } else {
            // API Hatası
            displayMessage(categoryFormMessageDiv, `Hata: ${escapeHtml(result.error || 'İşlem başarısız.')}`, true, 0);
            enableButtons(buttonsToDisable); // Hata durumunda butonları etkinleştir
        }
    } catch (error) {
        // Ağ veya JS Hatası
        console.error(`Error during category ${categoryId > 0 ? 'update' : 'add'}:`, error);
        displayMessage(categoryFormMessageDiv, `Beklenmedik Hata: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(buttonsToDisable); // Hata durumunda butonları etkinleştir
    }
}

/**
 * Admin Kategori Düzenleme Modalını açar ve verileri yükler.
 * @param {string|number} categoryId Düzenlenecek kategori ID'si.
 */
async function startEditCategoryForm(categoryId) {
    console.log(`[category.js] Editing category ID: ${categoryId}`);
    if (!editCategoryModal || !editCategoryForm) {
        console.error("Edit category modal or form elements not found!");
        return;
    }

    // Önce formu sıfırla ve mesajları temizle
    editCategoryForm.reset();
    clearMessage(editCategoryFormMessage);
    if (editCategoryIdInput) editCategoryIdInput.value = '';

    const modalBody = editCategoryModal.querySelector('.modal-body');
    showLoadingOverlay(modalBody, 'Yükleniyor...');
    editCategoryModal.classList.remove('hidden'); // Modalı GÖSTER

    const token = getToken();
    if (!token || !isAdmin()) {
        _handleUnauthorizedCallback();
        hideLoadingOverlay(modalBody);
        closeEditCategoryModal(); // Modalı kapat
        return;
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/categories/${categoryId}`, 'GET', null, false); // Public endpoint

        if (result.success && result.data) {
            const category = result.data;
            // Modalı doldur
            if (editCategoryIdInput) editCategoryIdInput.value = category.id;
            if (editCategoryNameInput) editCategoryNameInput.value = category.name || '';
            if (editCategoryDescriptionInput) editCategoryDescriptionInput.value = category.description || '';
        } else {
            console.error(`Failed to fetch category ${categoryId} for editing: ${result.error}`);
            // Hata mesajını ana liste üzerinde göster (modalı değil)
            if (categoryListMessageDiv) displayMessage(categoryListMessageDiv, `Kategori yüklenemedi: ${escapeHtml(result.error || 'Bilinmeyen hata')}`, true, 0);
            closeEditCategoryModal(); // Hata olursa modalı kapat
        }
    } catch (error) {
        console.error("Error fetching category details:", error);
        if (categoryListMessageDiv) displayMessage(categoryListMessageDiv, `Ağ hatası: ${escapeHtml(error.message)}`, true, 0);
        closeEditCategoryModal();
    } finally {
        hideLoadingOverlay(modalBody); // Spinner'ı kaldır
    }
}


/**
 * Yönetici panelindeki kategori tablosunda bir aksiyon (düzenle/sil) gerçekleştiğinde tetiklenir.
 * @param {Event} event Tıklama olayı.
 */
function handleAdminCategoryAction(event) {
    const button = event.target.closest('button[data-action][data-id]');
    if (!button) return; // Geçerli bir aksiyon butonu değilse çık

    const action = button.dataset.action;
    const categoryId = button.dataset.id;

    if (!categoryId) {
        console.warn("Action button missing data-id attribute.");
        return;
    }

    if (action === 'edit-category') {
        // startEditCategoryForm'u çağırmalı (Modal açacak)
        startEditCategoryForm(categoryId); // <--- DÜZELTME
    } else if (action === 'delete-category') {
        deleteCategory(button);
    } else {
        console.warn(`Unknown category action: ${action}`);
    }
}


/**
 * Admin kategori silme işlemini gerçekleştirir.
 * @param {HTMLButtonElement} deleteButton Sil butonuna referans.
 */
async function deleteCategory(deleteButton) {
    const row = deleteButton.closest('tr');
    if (!row) return;

    const categoryId = deleteButton.dataset.id; // ID'yi butondan al
    const categoryName = row.cells[1]?.textContent || `ID: ${categoryId}`; // Satırdan ismi al

    if (!confirm(`'${escapeHtml(categoryName)}' kategorisini silmek istediğinizden emin misiniz?\n(Bu kategoriye bağlı ürünler varsa silinemez!)`)) {
        return; // Kullanıcı iptal etti
    }

    clearMessage(categoryListMessageDiv); // Mesajları temizle
    clearMessage(categoryFormMessageDiv);

    const token = getToken();
    if (!token || !isAdmin()) {
        _handleUnauthorizedCallback();
        return;
    }

    // İşlem yapılacak satırdaki tüm butonları disable et
    const actionButtonsInRow = row.querySelectorAll('.actions-cell button');
    showButtonLoading(deleteButton, '...'); // Sil butonuna spinner
    disableButtons(Array.from(actionButtonsInRow).filter(b => b !== deleteButton));

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/categories/${categoryId}`, 'DELETE', null, token);

        if (result.success) {
            displayMessage(categoryListMessageDiv, result.data?.message || "Kategori başarıyla silindi.", false, 4000);
            await refreshAdminCategoryList(); // Listeyi yenile
            // Eğer ekleme/düzenleme formunda silinen kategori seçiliyse formu resetle
            if (categoryIdInput?.value === categoryId) {
                resetCategoryForm();
            }
            // Ürün yönetimi dropdown'ını da güncelle
            const latestCategories = await fetchCategories();
            if (typeof _populateProductCategoryDropdownCallback === 'function') {
                _populateProductCategoryDropdownCallback(latestCategories);
            }
        } else {
            // API Hatası
            if (result.status === 401 || result.status === 403) {
                // Unauthorized zaten handle edildi, burada ekstra bir şey yapmaya gerek yok
            } else {
                displayMessage(categoryListMessageDiv, `Kategori silinemedi: ${escapeHtml(result.error || 'Bilinmeyen hata')}`, true, 0);
                enableButtons(Array.from(actionButtonsInRow)); // Hata durumunda butonları tekrar aktif et
            }
        }
    } catch (error) {
        // Ağ veya JS Hatası
        console.error("Error deleting category:", error);
        displayMessage(categoryListMessageDiv, `Kategori silinirken ağ hatası: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(Array.from(actionButtonsInRow)); // Hata durumunda butonları aktif et
    }
}

// --- Edit Modal Fonksiyonları ---
function closeEditCategoryModal() {
    if (editCategoryModal) {
        editCategoryModal.classList.add('hidden');
    }
    // Formu resetlemeye gerek yok, açılırken resetleniyor.
}

async function handleEditCategoryFormSubmit(event) {
    event.preventDefault();
    console.log("[category.js] handleEditCategoryFormSubmit called.");
    if (!isAdmin() || !editCategoryForm || !editCategoryModal) return;

    clearMessage(editCategoryFormMessage);

    const categoryId = editCategoryIdInput?.value;
    if (!categoryId) {
        displayMessage(editCategoryFormMessage, "Düzenlenecek kategori ID'si bulunamadı.", true);
        return;
    }

    const categoryData = {
        id: parseInt(categoryId), // DTO'nun ID'ye ihtiyacı olabilir (kontrol et)
        name: editCategoryNameInput?.value.trim() ?? '',
        description: editCategoryDescriptionInput?.value.trim() || null
    };

    // Validasyon
    if (!categoryData.name) {
        displayMessage(editCategoryFormMessage, "Kategori adı zorunludur.", true);
        return;
    }

    const token = getToken();
    if (!token) { _handleUnauthorizedCallback(); return; }

    const buttons = [editCategorySubmitBtn, editCategoryCancelBtn].filter(b => b);
    showButtonLoading(editCategorySubmitBtn, 'Güncelleniyor...');
    disableButtons(buttons);

    try {
        // API isteği: PUT /api/categories/{id}
        const result = await makeApiRequest(`${API_BASE_URL}/api/categories/${categoryId}`, 'PUT', categoryData, token);
        console.log(`[category.js] PUT /api/categories/${categoryId} response:`, result);

        if (result.success) {
            displayMessage(editCategoryFormMessage, result.data?.message || 'Kategori başarıyla güncellendi!', false, 2500);
            // Başarılı olunca: Modalı kapat, listeyi yenile
            setTimeout(async () => {
                closeEditCategoryModal();
                await refreshAdminCategoryList();
                // Ana formu (ekleme) da resetle (eğer düzenlenmekte olanla aynıysa)
                if (categoryIdInput?.value === categoryId) {
                    resetCategoryForm();
                }
                // Ürün yönetimi dropdown'ını da güncelle
                const latestCategories = await fetchCategories();
                if (typeof _populateProductCategoryDropdownCallback === 'function') {
                    _populateProductCategoryDropdownCallback(latestCategories);
                }
            }, 1500); // Mesajın görünmesi için bekle

        } else {
            // Hata
            displayMessage(editCategoryFormMessage, `Güncelleme Hatası: ${escapeHtml(result.error || 'Bilinmeyen')}`, true, 0);
            enableButtons(buttons); // Butonları tekrar aktif et
            if (result.status === 401 || result.status === 403) {
                closeEditCategoryModal(); // Yetki hatasıysa modalı kapat
            }
        }
    } catch (error) {
        console.error("[category.js] Error submitting category edit:", error);
        displayMessage(editCategoryFormMessage, `Ağ/İstemci Hatası: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(buttons); // Butonları aktif et
    }
}


// --- Modül Başlatma ---
export function initializeCategoryAdmin(unauthorizedCb, populateProdCatCb) {
    console.log("Initializing Category Admin Module...");
    if (typeof unauthorizedCb === 'function') _handleUnauthorizedCallback = unauthorizedCb;
    else console.error("Category Admin Init Error: unauthorizedCb is not a function!");
    if (typeof populateProdCatCb === 'function') _populateProductCategoryDropdownCallback = populateProdCatCb;
    else console.error("Category Admin Init Error: populateProdCatCb is not a function!");

    // Olay Dinleyicileri
    if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    else console.warn("Admin category add/edit form (#admin-category-form) not found!");

    if (categoryFormCancelBtn) categoryFormCancelBtn.addEventListener('click', resetCategoryForm);
    else console.warn("Admin category cancel button (#admin-category-form-cancel-btn) not found!");

    if (adminCategoryTableBody) {
        adminCategoryTableBody.addEventListener('click', handleAdminCategoryAction);
        console.log("Admin category table action listener added.");
    } else {
        console.warn("Admin category table body (#admin-category-table tbody) not found! Actions will not work.");
    }

    // Modal olayları
    if (editCategoryModal && editCategoryForm) {
        editCategoryForm.addEventListener('submit', handleEditCategoryFormSubmit);
        editCategoryCloseModalBtns.forEach(btn => btn?.addEventListener('click', closeEditCategoryModal));
        if (editCategoryCancelBtn) editCategoryCancelBtn.addEventListener('click', closeEditCategoryModal);
        // Modal dışına tıklayınca kapat
        editCategoryModal.addEventListener('click', (event) => {
            if (event.target === editCategoryModal) {
                closeEditCategoryModal();
            }
        });
        console.log("Edit category modal listeners added.");
    } else {
        console.warn("Edit Category Modal elements (#editCategoryModal, #editCategoryForm) not found. Edit functionality disabled.");
    }

    console.log("Category Admin Module Initialized.");

    // Admin bölümünü gösterme fonksiyonu
    async function showAdminCategorySection() {
        console.log("[category.js] showAdminCategorySection called.");
        if (!adminCategorySection) { console.error("Admin category section not found."); return; }
        if (!isAdmin()) {
            // Giriş yapmamış veya admin değilse ana sayfaya yönlendir.
            alert("Bu alanı görüntüleme yetkiniz yok.");
            // Eğer handleUnauthorized callback login ekranını gösteriyorsa, onu çağıralım.
            _handleUnauthorizedCallback();
            return;
        }
        // Admin ise:
        if (window.hideOtherSections) { // app.js'den gelen global fonksiyon
            window.hideOtherSections(adminCategorySection);
        } else {
            adminCategorySection.classList.remove('hidden'); // Fallback
        }
        resetCategoryForm(); // Bölüm açıldığında ekleme formunu sıfırla
        clearMessage(categoryListMessageDiv); // Genel liste mesajını temizle
        await refreshAdminCategoryList(); // Listeyi yükle/yenile
    }

    return { showAdminCategorySection };
}

export function setFetchProductsCallback(callback) {
    if (typeof callback === 'function') {
        _fetchProductsForCategoryCallback = callback;
        console.log("[category.js] Fetch products callback registered.");
    } else {
        console.error("[category.js] Invalid callback function provided for fetching products.");
    }
}

console.log("Category Module Loaded.");