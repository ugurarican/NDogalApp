document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Referansları ---
    const contentListContainer = document.getElementById('content-list');
    const mainContentTitle = document.getElementById('main-content-title');
    const authNav = document.getElementById('auth-nav');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const userInfoDiv = document.getElementById('user-info');
    const userWelcomeMessageSpan = document.getElementById('user-welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const authFormsSection = document.getElementById('auth-forms');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessageDiv = document.getElementById('auth-message');
    const switchToRegisterLink = document.getElementById('switch-to-register');
    const switchToLoginLink = document.getElementById('switch-to-login');
    const mainContent = document.getElementById('main-content');
    // Profil
    const showProfileBtn = document.getElementById('show-profile-btn');
    const profileSection = document.getElementById('profile-section');
    const profileInfoDiv = profileSection?.querySelector('.profile-info');
    const profileMessageDiv = document.getElementById('profile-message');
    // Sepet
    const basketSection = document.getElementById('basket-section');
    const showBasketBtn = document.getElementById('show-basket-btn');
    const basketItemCountSpan = document.getElementById('basket-item-count');
    const basketItemsContainer = document.getElementById('basket-items-container');
    const basketSummaryDiv = document.getElementById('basket-summary');
    const basketTotalPriceSpan = document.getElementById('basket-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearBasketBtn = document.getElementById('clear-basket-btn');
    // Sipariş Geçmişi
    const orderHistorySection = document.getElementById('order-history-section');
    const orderHistoryListDiv = document.getElementById('order-history-list');
    // Admin - Genel
    const showMyOrdersBtn = document.getElementById('show-my-orders-btn');
    const showAdminOrdersBtn = document.getElementById('show-admin-orders-btn');
    const showProductMgmtBtn = document.getElementById('show-product-mgmt-btn');
    const showCategoryMgmtBtn = document.getElementById('show-category-mgmt-btn');
    const showUserMgmtBtn = document.getElementById('show-user-mgmt-btn');
    // Admin - Sipariş Yönetimi
    const adminOrdersSection = document.getElementById('admin-orders-section');
    const adminOrderListDiv = document.getElementById('admin-order-list');
    const adminOrderStatusFilter = document.getElementById('admin-order-status-filter');
    const adminFilterOrdersBtn = document.getElementById('admin-filter-orders-btn');
    // Admin - Ürün Yönetimi
    const adminProductSection = document.getElementById('admin-product-section');
    const productForm = document.getElementById('admin-product-form');
    const productFormTitle = document.getElementById('product-form-title');
    const productIdInput = document.getElementById('admin-product-id');
    const productNameInput = document.getElementById('admin-product-name');
    const productDescriptionInput = document.getElementById('admin-product-description');
    const productPriceInput = document.getElementById('admin-product-price');
    const productStockInput = document.getElementById('admin-product-stock');
    const productCategorySelect = document.getElementById('admin-product-category');
    const productImageUrlInput = document.getElementById('admin-product-imageurl');
    const productFormMessageDiv = document.getElementById('product-form-message');
    const productSubmitBtn = document.getElementById('admin-product-submit-btn');
    const productFormCancelBtn = document.getElementById('admin-product-form-cancel-btn');
    const adminProductListContainer = document.getElementById('admin-product-list-container');
    const adminProductTable = document.getElementById('admin-product-table');
    const adminProductTableBody = adminProductTable?.querySelector('tbody');
    const productListMessageDiv = document.getElementById('product-list-message');
    // Admin - Kategori Yönetimi
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
    // Admin - Kullanıcı Yönetimi
    const adminUserSection = document.getElementById('admin-user-section');
    const adminUserListContainer = document.getElementById('admin-user-list-container');
    const adminUserTable = document.getElementById('admin-user-table');
    const adminUserTableBody = adminUserTable?.querySelector('tbody');
    const userListMessageDiv = document.getElementById('user-list-message');
    // Geri Dönüş Linkleri
    const backToHomeLinks = document.querySelectorAll('.back-to-home');
    const homeLink = document.getElementById('home-link');


    // --- API Adresi ---
    const API_BASE_URL = 'https://localhost:7113'; // Backend HTTPS portu

    // --- Enum Benzeri Yapı ---
    const OrderStatusEnum = { PendingApproval: 1, Approved: 2, Shipped: 3, Delivered: 4, CancelledByCustomer: 5, CancelledByAdmin: 6, PartiallyShipped: 7, Completed: 8 };
    const OrderStatusText = { 1: "Onay Bekliyor", 2: "Onaylandı", 3: "Kargolandı", 4: "Teslim Edildi", 5: "Müşteri İptal Etti", 6: "Yönetici İptal Etti", 7: "Kısmen Kargolandı", 8: "Tamamlandı" };
    const UserTypeText = { 1: "Müşteri", 2: "Admin" };
    const AdminAvailableActions = {
        [OrderStatusEnum.PendingApproval]: { [OrderStatusEnum.Approved]: "Onayla", [OrderStatusEnum.CancelledByAdmin]: "Reddet / İptal Et" },
        [OrderStatusEnum.Approved]: { [OrderStatusEnum.CancelledByAdmin]: "İptal Et" },
        [OrderStatusEnum.PartiallyShipped]: { [OrderStatusEnum.Delivered]: "Teslim Edildi İşaretle", [OrderStatusEnum.Completed]: "Tamamlandı İşaretle", [OrderStatusEnum.CancelledByAdmin]: "İptal Et" },
        [OrderStatusEnum.Shipped]: { [OrderStatusEnum.Delivered]: "Teslim Edildi İşaretle", [OrderStatusEnum.Completed]: "Tamamlandı İşaretle", [OrderStatusEnum.CancelledByAdmin]: "İptal Et" },
        [OrderStatusEnum.Delivered]: { [OrderStatusEnum.Completed]: "Tamamlandı İşaretle" }
    };

    // --- Helper Fonksiyonlar ---
    function getToken() { return localStorage.getItem('authToken'); }
    function saveToken(token) { if (token) localStorage.setItem('authToken', token); else console.error("saveToken: Invalid token"); }
    function removeToken() { localStorage.removeItem('authToken'); localStorage.removeItem('userInfo'); }
    function saveUserInfo(user) { if (user && typeof user === 'object') localStorage.setItem('userInfo', JSON.stringify(user)); else console.error("saveUserInfo: Invalid user info"); }
    function getUserInfo() { const i = localStorage.getItem('userInfo'); if (!i) return null; try { const p = JSON.parse(i); return p; } catch (e) { localStorage.removeItem('userInfo'); return null; } }
    function isAdmin() { return getUserInfo()?.userType === 2; }
    function displayMessage(el, msg, isErr = false, duration = 5000) { if (!el) { console.warn("displayMessage: Element not found for message:", msg); return; } el.textContent = msg; el.className = `message - area ${ isErr ? 'error' : 'success' } `; el.classList.remove('hidden'); if (duration > 0) setTimeout(() => clearMessage(el), duration); }
    function clearMessage(el) { if (el) { el.textContent = ''; el.classList.add('hidden'); /* el.className = 'message-area hidden'; */ } }
    function displayAuthMessage(msg, isErr = false, duration = 5000) { displayMessage(authMessageDiv, msg, isErr, duration); }
    function clearAuthMessage() { clearMessage(authMessageDiv); }
    function disableButtons(elements, text = '...') { elements.forEach(el => { if (el instanceof HTMLElement && el.tagName === 'BUTTON') { el.disabled = true; el.dataset.originalText = el.textContent; el.textContent = text; } else if (el instanceof HTMLElement) { el.disabled = true; } }); }
    function enableButtons(elements) {
        elements.forEach(el => {
            if (el instanceof HTMLElement) {
                el.disabled = false;
                if (el.tagName === 'BUTTON' && el.dataset.originalText) {
                    el.textContent = el.dataset.originalText; delete el.dataset.originalText;
                } else if (el.tagName === 'BUTTON' && el.textContent === '...') {
                    const originalText = el.getAttribute('title') ||
                        (el.classList.contains('edit-btn') ? '✏️' :
                         el.classList.contains('delete-btn') ? '🗑️' :
                         el.classList.contains('save-btn') ? 'Kaydet' :
                         el.classList.contains('cancel-btn') ? 'İptal' :
                         el.classList.contains('admin-update-status-btn') ? 'Uygula' :
                         el.classList.contains('admin-partial-ship-btn') ? 'Kısmi G.' :
                         el.classList.contains('admin-ship-remaining-btn') ? 'Kalanı G.' :
                         el.classList.contains('admin-full-ship-btn') ? 'Tümünü G.' :
                         el.id === 'checkout-btn' ? 'Siparişi Tamamla' :
                         el.id === 'clear-basket-btn' ? 'Sepeti Boşalt' :
                         el.id === 'admin-filter-orders-btn' ? 'Filtrele' :
                         el.id === 'show-login-btn' ? 'Giriş Yap' :
                         el.id === 'show-register-btn' ? 'Kayıt Ol' :
                         el.id === 'logout-btn' ? '🚪 Çıkış' :
                         el.type === 'submit' ? (el.id.includes('category-submit') ? (el.textContent.includes('Güncelle')? 'Güncelle' : 'Kategoriyi Ekle') : (el.id.includes('product-submit') ? (el.textContent.includes('Güncelle')? 'Güncelle' : 'Ürünü Ekle') : (el.closest('form')?.id === 'login-form' ? 'Giriş Yap' : (el.closest('form')?.id === 'register-form' ? 'Kayıt Ol' : 'Gönder')))) :
                         'Buton');
                    el.textContent = originalText;
                }
            }
        });
    }
    function escapeHtml(unsafe) { if (unsafe === null || typeof unsafe === 'undefined') return ''; const div = document.createElement('div'); div.textContent = unsafe.toString(); return div.innerHTML; }

    // --- UI Güncelleme ---
    function updateUI() {
        const token = getToken(); const userInfo = getUserInfo(); const userIsAdmin = isAdmin();
        const elements = [showLoginBtn, showRegisterBtn, userInfoDiv, showBasketBtn, showMyOrdersBtn, showAdminOrdersBtn, showProductMgmtBtn, showCategoryMgmtBtn, showUserMgmtBtn, userWelcomeMessageSpan, basketItemCountSpan, showProfileBtn];
        if (elements.some(el => !el)) { console.error("UI Update Error: One or more required navigation/user elements missing!"); return; }

        if (token && userInfo && userInfo.firstName) { // Login olmuşsa
            showLoginBtn.classList.add('hidden'); showRegisterBtn.classList.add('hidden');
            userInfoDiv.classList.remove('hidden'); showProfileBtn.classList.remove('hidden');
            authFormsSection?.classList.add('hidden');
            userWelcomeMessageSpan.innerHTML = `Hoş Geldin, ${ escapeHtml(userInfo.firstName) } ! <span class="user-role">${userIsAdmin ? '(Admin)' : ''}</span>`;
            showBasketBtn.classList.remove('hidden');
            showMyOrdersBtn.classList[userIsAdmin ? 'add' : 'remove']('hidden');
            showAdminOrdersBtn.classList[userIsAdmin ? 'remove' : 'add']('hidden');
            showProductMgmtBtn.classList[userIsAdmin ? 'remove' : 'add']('hidden');
            showCategoryMgmtBtn.classList[userIsAdmin ? 'remove' : 'add']('hidden');
            showUserMgmtBtn.classList[userIsAdmin ? 'remove' : 'add']('hidden');
            updateBasketCount();
        } else { // Login olmamışsa
            showLoginBtn.classList.remove('hidden'); showRegisterBtn.classList.remove('hidden');
            userInfoDiv.classList.add('hidden'); showProfileBtn.classList.add('hidden');
            showBasketBtn.classList.add('hidden');
            showMyOrdersBtn.classList.add('hidden'); showAdminOrdersBtn.classList.add('hidden');
            showProductMgmtBtn.classList.add('hidden'); showCategoryMgmtBtn.classList.add('hidden');
            showUserMgmtBtn.classList.add('hidden');
            userWelcomeMessageSpan.innerHTML = ''; basketItemCountSpan.textContent = '0';
            const sections = [basketSection, profileSection, orderHistorySection, adminOrdersSection, adminProductSection, adminCategorySection, adminUserSection];
            sections.forEach(s => s?.classList.add('hidden'));
            if (mainContent && authFormsSection?.classList.contains('hidden')) { mainContent.classList.remove('hidden'); }
            else if (mainContent && !authFormsSection?.classList.contains('hidden')) { mainContent.classList.add('hidden'); }
        }
        clearAuthMessage();
    }

    // --- API İstekleri ---
    async function makeApiRequest(url, method = 'GET', body = null, requireAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (requireAuth) { if (!token) { handleUnauthorized(); return { success: false, status: 401, error: "Giriş yapmanız gerekli." }; } headers['Authorization'] = `Bearer ${ token } `; }
        try {
            const options = { method, headers }; if (body) options.body = JSON.stringify(body);
            const response = await fetch(url, options);
            let data = {}; const responseBody = await response.text();
            try { if (responseBody) data = JSON.parse(responseBody); } catch (e) { data = { parseError: true, raw: responseBody }; }

            if (response.ok) { return { success: true, status: response.status, data: data }; }
            else {
                if (response.status === 401 && requireAuth) { handleUnauthorized(); return { success: false, status: 401, error: "Oturum süresi doldu veya yetki yok." }; }
                if (response.status === 403) return { success: false, status: 403, error: "Bu işlem için yetkiniz bulunmuyor." };

                let errorMessage = "Bir hata oluştu.";
                if (data?.message) errorMessage = data.message;
                else if (data?.title) errorMessage = data.title;
                else if (data?.error) errorMessage = data.error;
                else if (data?.parseError) errorMessage = `API yanıtı okunamadı(${ response.status })`;
                else if (typeof data === 'string' && data.length > 0 && data.length < 200) errorMessage = data;
                else errorMessage = response.statusText || `HTTP Hatası: ${ response.status } `;
                if (data?.errors && typeof data.errors === 'object') { const validationErrors = Object.entries(data.errors).map(([key, value]) => `${ key }: ${ Array.isArray(value) ? value.join(', ') : value } `).join('\n'); errorMessage = `Doğrulama Hatası: \n${ validationErrors } `; }
                console.error(`API Request FAILED(${ method } ${ url }) - Status ${ response.status }: `, errorMessage, data);
                return { success: false, status: response.status, error: errorMessage.trim(), data: data };
            }
        } catch (error) { console.error(`API Request Fetch Error(${ method } ${ url }): `, error); return { success: false, status: 0, error: `Ağ bağlantı hatası: ${ error.message } ` }; }
    }

    // --- Sepet İşlemleri ---
    async function fetchBasket() { const res = await makeApiRequest(`${ API_BASE_URL } /api/basket`); return (res.success && res.data) ? res.data : null; }
    function displayBasket(basket) {
        if (!basketItemsContainer || !basketSummaryDiv) return; basketItemsContainer.innerHTML = '';
        if (!basket || !basket.items || basket.items.length === 0) { basketItemsContainer.innerHTML = '<p>Sepetiniz boş.</p>'; basketSummaryDiv.classList.add('hidden'); if (basketItemCountSpan) basketItemCountSpan.textContent = '0'; return; }
        basket.items.forEach(item => { const d = document.createElement('div'); d.className = 'basket-item'; d.dataset.itemId = item.id; d.innerHTML = `< img src = "${item.productImageUrl || 'https://via.placeholder.com/80x80.png?text=...'}" alt = "${escapeHtml(item.productName)}" ><div class="item-details"><h4>${escapeHtml(item.productName)}</h4><p class="item-price">${item.unitPrice.toFixed(2)} TL/adet</p></div><div class="item-quantity"><button data-action="decrease" ${item.quantity <= 1 ? 'disabled' : ''}>-</button><span data-current-quantity="${item.quantity}">${item.quantity}</span><button data-action="increase">+</button></div><p class="item-total-price">${item.totalPrice.toFixed(2)} TL</p><button class="remove-item-btn" data-action="remove" title="Sepetten Kaldır">🗑️</button>`; d.querySelector('img').onerror = function () { this.src = 'https://via.placeholder.com/80x80.png?text=H'; }; basketItemsContainer.appendChild(d); }); basketSummaryDiv.classList.remove('hidden'); basketTotalPriceSpan.textContent = basket.totalBasketPrice.toFixed(2); if (basketItemCountSpan) basketItemCountSpan.textContent = basket.totalItemsCount || '0';
    }
    async function updateBasketCount() { if (!basketItemCountSpan || !getToken()) { if(basketItemCountSpan) basketItemCountSpan.textContent = '0'; return; } const b = await fetchBasket(); basketItemCountSpan.textContent = b?.totalItemsCount || '0'; }
    async function handleBasketAction(event) {
        const btn = event.target.closest('button[data-action]'); if (!btn) return;
        const itemDiv = btn.closest('.basket-item'); if (!itemDiv) return;
        const itemId = itemDiv.dataset.itemId; const action = btn.dataset.action;
        const qtySpan = itemDiv.querySelector('.item-quantity span'); const curQty = qtySpan ? parseInt(qtySpan.dataset.currentQuantity || '1') : 1;
        const productName = itemDiv.querySelector('h4')?.textContent || 'Ürün';
        const btnsInItem = itemDiv.querySelectorAll('button'); disableButtons(Array.from(btnsInItem)); let result; let confirmAct = true; try { if (action === 'increase') { result = await makeApiRequest(`${ API_BASE_URL } /api/basket / items / ${ itemId } `, 'PUT', { newQuantity: curQty + 1 }); } else if (action === 'decrease') { if (curQty > 1) { result = await makeApiRequest(`${ API_BASE_URL } /api/basket / items / ${ itemId } `, 'PUT', { newQuantity: curQty - 1 }); } else { confirmAct = confirm(`'${productName}' ürününü sepetten kaldırmak istediğinizden emin misiniz ? `); if (confirmAct) result = await makeApiRequest(`${ API_BASE_URL } /api/basket / items / ${ itemId } `, 'DELETE'); } } else if (action === 'remove') { confirmAct = confirm(`'${productName}' ürününü sepetten kaldırmak istediğinizden emin misiniz ? `); if (confirmAct) result = await makeApiRequest(`${ API_BASE_URL } /api/basket / items / ${ itemId } `, 'DELETE'); } if (!confirmAct) { enableButtons(Array.from(btnsInItem)); return; } if (result?.success) { const b = await fetchBasket(); displayBasket(b); } else { alert(`Sepet güncellenemedi: ${ result?.error || 'Bilinmeyen hata' } `); enableButtons(Array.from(btnsInItem)); } } catch (e) { alert(`Ağ hatası: ${ e.message } `); enableButtons(Array.from(btnsInItem)); }
    }
    async function clearBasket() { if (!confirm("Sepetinizdeki tüm ürünleri kaldırmak istediğinizden emin misiniz?")) return; disableButtons([clearBasketBtn]); const result = await makeApiRequest(`${ API_BASE_URL } /api/basket`, 'DELETE'); if (!result.success && result.status !== 401) alert(`Sepet boşaltılamadı: ${ result.error } `); displayBasket(null); updateBasketCount(); enableButtons([clearBasketBtn]); }
    async function checkout() { const b = await fetchBasket(); if (!b?.items?.length) { alert("Sipariş oluşturmak için sepetinizde ürün bulunmalıdır."); return; } if (!confirm("Sepetinizdeki ürünlerle sipariş oluşturmak istediğinizden emin misiniz?\nMevcut ürün fiyatları ve stok durumu kontrol edilecektir.")) return; disableButtons([checkoutBtn], "Oluşturuluyor..."); const result = await makeApiRequest(`${ API_BASE_URL } /api/orders`, 'POST', {}); if (result.success && result.data?.id) { alert(`Siparişiniz başarıyla oluşturuldu! Sipariş Numaranız: ${ result.data.id } `); await updateBasketCount(); showHomeSection(); } else { alert(`Sipariş oluşturulamadı: ${ result.error || 'Bilinmeyen bir hata oluştu.' } `); } enableButtons([checkoutBtn]); }

    // --- Ana İçerik (Kategori/Ürün) ---
    async function fetchCategoriesForHome() {
        if (!contentListContainer) return;
        contentListContainer.innerHTML = '<p>Kategoriler yükleniyor...</p>';
        if(mainContentTitle) mainContentTitle.textContent = "Kategoriler";

        const result = await makeApiRequest(`${ API_BASE_URL } /api/categories`, 'GET', null, false);
        if (result.success && Array.isArray(result.data)) { displayCategoryCards(result.data); }
        else { contentListContainer.innerHTML = `< p style = "color:red;" > Kategoriler yüklenemedi: ${ result.error || 'Bilinmeyen hata' }</p > `; }
    }
    function displayCategoryCards(categories) {
        if (!contentListContainer) return; contentListContainer.innerHTML = '';
        if (!Array.isArray(categories) || categories.length === 0) { contentListContainer.innerHTML = '<p>Gösterilecek kategori bulunamadı.</p>'; return; }
        contentListContainer.className = 'content-container category-grid';
        categories.forEach(cat => {
            const card = document.createElement('div'); card.className = 'category-card';
            card.innerHTML = `< h3 > ${ escapeHtml(cat.name) }</h3 ><p>${escapeHtml(cat.description || '')}</p><button data-category-id="${cat.id}">Ürünleri Gör</button>`;
            card.querySelector('button').addEventListener('click', () => fetchProductsForCategory(cat.id, cat.name));
            contentListContainer.appendChild(card);
        });
    }
    async function fetchProductsForCategory(categoryId, categoryName) {
        if (!contentListContainer) return;
        contentListContainer.innerHTML = `< p > '${escapeHtml(categoryName)}' kategorisi ürünleri yükleniyor...</p > `;
        if(mainContentTitle) mainContentTitle.textContent = `${ escapeHtml(categoryName) } Ürünleri`;

        const result = await makeApiRequest(`${ API_BASE_URL } /api/products ? categoryId = ${ categoryId } `, 'GET', null, false);
        if (result.success && Array.isArray(result.data)) { displayProducts(result.data); }
        else { contentListContainer.innerHTML = `< p style = "color:red;" > Ürünler yüklenemedi: ${ result.error || 'Bilinmeyen hata' }</p > `; }
    }
    function displayProducts(products) {
        if (!contentListContainer) return; contentListContainer.innerHTML = '';
        if (!Array.isArray(products) || !products.length) { contentListContainer.innerHTML = '<p>Bu kategoride ürün bulunamadı.</p>'; return; }
        contentListContainer.className = 'content-container product-container';
        products.forEach(p => {
            const c = document.createElement('div'); c.className = 'product-card';
            c.innerHTML = `
    < img src = "${p.imageUrl || 'https://via.placeholder.com/300x220.png?text=...'}" alt = "${escapeHtml(p.name || '-')}" >
        <div class="card-content">
            <h3>${escapeHtml(p.name || '-')}</h3>
            <p class="description">${escapeHtml(p.description || '')}</p>
            <p class="category">Kategori: ${escapeHtml(p.categoryName || '-')}</p>
            <p class="price">${(p.price && !isNaN(p.price) ? p.price.toFixed(2) : '0.00')} TL</p>
            ${p.id && getToken() ? `<button data-product-id="${p.id}">Sepete Ekle ➕</button>` : ''}
            <div class="add-to-basket-message message-area hidden"></div>
        </div>`;
            c.querySelector('img').onerror = function () { this.src = 'https://via.placeholder.com/300x220.png?text=H'; };
            const addToBasketButton = c.querySelector('button[data-product-id]');
            if (addToBasketButton) { addToBasketButton.addEventListener('click', addToBasketHandler); }
            contentListContainer.appendChild(c);
        });
    }
    async function addToBasketHandler(event) { // Düzeltilmiş Sepete Ekle
        const pid = event.target.dataset.productId; const btn = event.target;
        const cardContent = btn.closest('.card-content'); const messageDiv = cardContent?.querySelector('.add-to-basket-message');
        if (!messageDiv) { console.error("Mesaj alanı bulunamadı (addToBasketHandler)."); return; }
        if (!getToken()) { showLoginForm(); return; }

        disableButtons([btn], '...'); clearMessage(messageDiv);
        const result = await makeApiRequest(`${ API_BASE_URL } /api/basket / items`, 'POST', { productId: parseInt(pid), quantity: 1 });
        if (result.success) { await updateBasketCount(); displayMessage(messageDiv, result.data?.message || 'Eklendi!', false, 3000); }
        else { displayMessage(messageDiv, `Hata: ${ result.error || 'Eklenemedi' } `, true, 5000); }
        enableButtons([btn]);
    }

    // --- Profil Yönetimi ---
    function showProfileSection() {
        if (!profileSection || !profileInfoDiv) return;
        const userInfo = getUserInfo(); if (!userInfo) { handleUnauthorized(); return; }
        hideOtherSections(profileSection); clearMessage(profileMessageDiv);

        profileInfoDiv.querySelector('#profile-id').textContent = userInfo.id || '-';
        profileInfoDiv.querySelector('#profile-firstname').textContent = escapeHtml(userInfo.firstName) || '-';
        profileInfoDiv.querySelector('#profile-lastname').textContent = escapeHtml(userInfo.lastName) || '-';
        profileInfoDiv.querySelector('#profile-email').textContent = escapeHtml(userInfo.email) || '-';
        profileInfoDiv.querySelector('#profile-phone').textContent = escapeHtml(userInfo.phoneNumber) || 'Belirtilmemiş';
        profileInfoDiv.querySelector('#profile-address').textContent = escapeHtml(userInfo.address) || 'Belirtilmemiş';
        profileInfoDiv.querySelector('#profile-usertype').textContent = UserTypeText[userInfo.userType] || 'Bilinmiyor';
    }

    // --- Form Gösterme/Gizleme ---
    function showLoginForm() { if (!authFormsSection) return; clearAuthMessage(); hideOtherSections(authFormsSection); loginFormContainer?.classList.remove('hidden'); registerFormContainer?.classList.add('hidden'); loginForm?.reset(); }
    function showRegisterForm() { if (!authFormsSection) return; clearAuthMessage(); hideOtherSections(authFormsSection); loginFormContainer?.classList.add('hidden'); registerFormContainer?.classList.remove('hidden'); registerForm?.reset(); }

    // --- Yetkisiz Durum Yönetimi ---
    function handleUnauthorized() { console.warn("Unauthorized access or expired token."); removeToken(); updateUI(); hideOtherSections(authFormsSection); loginFormContainer?.classList.remove('hidden'); registerFormContainer?.classList.add('hidden'); displayAuthMessage("Oturumunuz sonlanmış veya geçersiz. Lütfen tekrar giriş yapın.", true, 0); }

    // --- Müşteri Sipariş Geçmişi ---
    async function fetchMyOrders() { if (!orderHistoryListDiv) return null; orderHistoryListDiv.innerHTML = '<p>Sipariş geçmişiniz yükleniyor...</p>'; const result = await makeApiRequest(`${ API_BASE_URL } /api/orders / my`); if (result.success && Array.isArray(result.data)) return result.data; else { if (result.status !== 401) orderHistoryListDiv.innerHTML = ` < p style = "color:red;" > Siparişler yüklenemedi: ${ result.error || 'Bilinmeyen hata' }</p > `; return null; } }
    function displayOrderHistory(orders) {
        if (!orderHistoryListDiv) return; orderHistoryListDiv.innerHTML = '';
        if (!Array.isArray(orders) || !orders.length) { orderHistoryListDiv.innerHTML = '<p>Henüz siparişiniz bulunmamaktadır.</p>'; return; }
        const orderList = document.createElement('ul'); orderList.classList.add('order-history-items');
        orders.forEach(order => {
            const listItem = document.createElement('li'); listItem.classList.add('order-history-item'); listItem.dataset.orderId = order.id;
            const currentStatusText = OrderStatusText[order.status] || `Bilinmeyen(${ order.status })`;
            listItem.dataset.status = currentStatusText;
            const summaryDiv = document.createElement('div'); summaryDiv.classList.add('order-summary');
            summaryDiv.innerHTML = `< p > <strong>No:</strong> ${ order.id }</p > <p><strong>Tarih:</strong> ${new Date(order.orderDate).toLocaleString('tr-TR')}</p> <p><strong>Tutar:</strong> ${order.totalAmount.toFixed(2)} TL</p> <p><strong>Durum:</strong> ${currentStatusText}</p> <button class="toggle-details-btn">Detay</button>`;
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('order-details', 'hidden');
            if (order.items && order.items.length > 0) {
                const itemsList = document.createElement('ul');
                order.items.forEach(item => {
                    const itemLi = document.createElement('li'); itemLi.classList.add('order-detail-item');
                    let quantityInfo = '';
                    const pendingQty = item.pendingQuantity ?? (item.quantity - item.shippedQuantity);
                    if (item.shippedQuantity > 0 || pendingQty > 0) { quantityInfo = pendingQty > 0 ? ` < span class="shipment-info" > (${ item.shippedQuantity } G, ${ pendingQty }B)</span > ` : ` < span class="shipment-info-ok" > (${ item.shippedQuantity }G)</span > `; }
                    itemLi.innerHTML = `< img src = "${item.productImageUrl || 'https://via.placeholder.com/50x50.png?text=...'}" alt = "${escapeHtml(item.productName)}" > <span>${item.quantity}x ${escapeHtml(item.productName)} (${item.price.toFixed(2)}TL)${quantityInfo} = <strong>${(item.price * item.quantity).toFixed(2)}TL</strong></span>`;
                    itemLi.querySelector('img').onerror = function () { this.src = 'https://via.placeholder.com/50x50.png?text=H'; }; itemsList.appendChild(itemLi);
                }); detailsDiv.appendChild(itemsList);
            } else { detailsDiv.innerHTML = '<p>Bu siparişe ait ürün detayı bulunamadı.</p>'; }
            if (order.shippingAddress || order.notes) {
                const extraInfoDiv = document.createElement('div'); extraInfoDiv.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px dotted #ccc; font-size: 0.9em; color: #555; word-break: break-word;';
                if (order.shippingAddress) extraInfoDiv.innerHTML += `< p > <strong>Adres:</strong> ${ escapeHtml(order.shippingAddress) }</p > `;
                if (order.notes) { const notesP = document.createElement('p'); notesP.innerHTML = '<strong>Notlar:</strong> '; notesP.appendChild(document.createTextNode(order.notes)); extraInfoDiv.appendChild(notesP); }
                detailsDiv.appendChild(extraInfoDiv);
            } listItem.appendChild(summaryDiv); listItem.appendChild(detailsDiv); orderList.appendChild(listItem);
            const toggleBtn = listItem.querySelector('.toggle-details-btn');
            toggleBtn?.addEventListener('click', () => { detailsDiv.classList.toggle('hidden'); toggleBtn.textContent = detailsDiv.classList.contains('hidden') ? 'Detay' : 'Gizle'; });
        }); orderHistoryListDiv.appendChild(orderList);
    }
    async function showOrderHistorySection() { if (!orderHistorySection) return; const t = getToken(); if (!t) { handleUnauthorized(); return; } hideOtherSections(orderHistorySection); const o = await fetchMyOrders(); if (o !== null) displayOrderHistory(o); }

    // --- Admin İşlemleri ---

    // Kategori Yönetimi
    async function fetchCategories() { const r = await makeApiRequest(`${ API_BASE_URL } /api/categories`, 'GET', null, false); if (r.success && Array.isArray(r.data)) return r.data; else { displayMessage(categoryFormMessageDiv, `Kategoriler yüklenemedi: ${ r.error || 'Bilinmeyen hata' } `, true); displayMessage(categoryListMessageDiv, `Kategoriler yüklenemedi: ${ r.error || 'Bilinmeyen hata' } `, true); return []; } }
    function populateCategoryDropdown(selectEl, cats, selectedValue = "") { if (!selectEl || !Array.isArray(cats)) return; const currentValue = selectEl.value; selectEl.innerHTML = '<option value="">Seçin...</option>'; cats.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = escapeHtml(c.name); if (selectedValue ? (c.id.toString() === selectedValue.toString()) : (c.id.toString() === currentValue)) { o.selected = true; } selectEl.appendChild(o); }); }
    function resetCategoryForm() { categoryForm?.reset(); categoryIdInput.value = ''; if (categoryFormTitle) categoryFormTitle.textContent = 'Yeni Kategori Ekle'; if (categorySubmitBtn) categorySubmitBtn.textContent = 'Kategoriyi Ekle'; categoryFormCancelBtn?.classList.add('hidden'); clearMessage(categoryFormMessageDiv); }
    async function handleCategoryFormSubmit(event) { event.preventDefault(); if (!isAdmin()) { alert("Yetkiniz yok."); return; } clearMessage(categoryFormMessageDiv); clearMessage(categoryListMessageDiv); const categoryId = categoryIdInput.value ? parseInt(categoryIdInput.value, 10) : 0; const categoryData = { name: categoryNameInput.value.trim(), description: categoryDescriptionInput.value.trim() || null }; if (!categoryData.name) { displayMessage(categoryFormMessageDiv, "Kategori adı zorunludur.", true); return; } const btns = [categorySubmitBtn, categoryFormCancelBtn].filter(b => b && !b.classList.contains('hidden')); disableButtons(btns, "Kaydediliyor..."); let result; if (categoryId > 0) { result = await makeApiRequest(`${ API_BASE_URL } /api/categories / ${ categoryId } `, 'PUT', categoryData); } else { result = await makeApiRequest(`${ API_BASE_URL } /api/categories`, 'POST', categoryData); } if (result.success) { displayMessage(categoryFormMessageDiv, result.data?.message || (categoryId > 0 ? "Güncellendi!" : "Eklendi!"), false, 3000); resetCategoryForm(); await refreshAdminCategoryList(); const latestCategories = await fetchCategories(); populateCategoryDropdown(productCategorySelect, latestCategories); } else { displayMessage(categoryFormMessageDiv, `Hata: ${ result.error || 'İşlem başarısız.' } `, true, 0); } enableButtons(btns); }
    async function startEditCategoryForm(categoryId) { resetCategoryForm(); clearMessage(categoryListMessageDiv); displayMessage(categoryFormMessageDiv, "Yükleniyor...", false, -1); const result = await makeApiRequest(`${ API_BASE_URL } /api/categories / ${ categoryId } `); clearMessage(categoryFormMessageDiv); if (result.success && result.data) { const cat = result.data; categoryIdInput.value = cat.id; categoryNameInput.value = cat.name; categoryDescriptionInput.value = cat.description || ''; if (categoryFormTitle) categoryFormTitle.textContent = 'Kategori Düzenle'; if (categorySubmitBtn) categorySubmitBtn.textContent = 'Güncelle'; categoryFormCancelBtn?.classList.remove('hidden'); categoryNameInput.focus(); categoryForm?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else { displayMessage(categoryListMessageDiv, `Kategori yüklenemedi: ${ result.error || 'Bilinmeyen hata' } `, true); } }
    async function deleteCategory(button) { const row = button.closest('tr'); if (!row) return; const categoryId = row.dataset.categoryId; const categoryName = row.cells[1]?.textContent || `ID: ${ categoryId } `; if (!confirm(`'${categoryName}' kategorisini silmek istediğinizden emin misiniz ?\nBu kategoriye bağlı ürünler varsa silinemeyebilir.`)) return; clearMessage(categoryListMessageDiv); clearMessage(categoryFormMessageDiv); const actionButtons = row.querySelectorAll('.actions-cell button'); disableButtons(Array.from(actionButtons), "Siliniyor..."); const result = await makeApiRequest(`${ API_BASE_URL } /api/categories / ${ categoryId } `, 'DELETE'); if (result.success) { displayMessage(categoryListMessageDiv, result.data?.message || "Kategori silindi.", false, 4000); await refreshAdminCategoryList(); if (categoryIdInput.value === categoryId) { resetCategoryForm(); } const latestCategories = await fetchCategories(); populateCategoryDropdown(productCategorySelect, latestCategories); } else { displayMessage(categoryListMessageDiv, `Silinemedi: ${ result.error || 'Bilinmeyen hata' } `, true, 0); enableButtons(Array.from(actionButtons)); } }
    function displayAdminCategories(categories) { if (!adminCategoryTableBody || !adminCategoryTable) { console.error("Admin kategori tablosu bulunamadı."); if (adminCategoryListContainer) adminCategoryListContainer.innerHTML = '<p style="color:red;">Tablo elemanı bulunamadı.</p>'; return; } adminCategoryListContainer.innerHTML = ''; if (!Array.isArray(categories) || categories.length === 0) { adminCategoryListContainer.innerHTML = '<p>Gösterilecek kategori bulunamadı.</p>'; adminCategoryTable.classList.add('hidden'); return; } adminCategoryTableBody.innerHTML = ''; categories.forEach(cat => { const row = adminCategoryTableBody.insertRow(); row.dataset.categoryId = cat.id; row.innerHTML = `< td data - label="ID" > ${ cat.id }</td > <td data-label="Ad">${escapeHtml(cat.name)}</td> <td data-label="Açıklama">${escapeHtml(cat.description || '-')}</td> <td class="actions-cell"> <button class="edit-btn" data-action="edit" data-id="${cat.id}" title="Düzenle">✏️</button> <button class="delete-btn" data-action="delete" data-id="${cat.id}" title="Sil">🗑️</button> </td> `; }); adminCategoryTable.classList.remove('hidden'); adminCategoryListContainer.appendChild(adminCategoryTable); }
    async function refreshAdminCategoryList() { if (!adminCategoryListContainer) return; adminCategoryListContainer.innerHTML = '<p>Kategoriler yükleniyor...</p>'; adminCategoryTable?.classList.add('hidden'); const categories = await fetchCategories(); displayAdminCategories(categories); }
    async function showAdminCategorySection() { if (!adminCategorySection) return; if (!isAdmin()) { showHomeSection(); return; } hideOtherSections(adminCategorySection); resetCategoryForm(); clearMessage(categoryListMessageDiv); await refreshAdminCategoryList(); }

    // Ürün Yönetimi (Admin)
    async function fetchAllProductsForAdmin() { const result = await makeApiRequest(`${ API_BASE_URL } /api/products`); if (result.success && Array.isArray(result.data)) { return result.data; } else { displayMessage(productFormMessageDiv, `Ürünler yüklenemedi: ${ result.error || 'Bilinmeyen hata' } `, true); displayMessage(productListMessageDiv, `Ürünler yüklenemedi: ${ result.error || 'Bilinmeyen hata' } `, true); return []; } }
    function displayAdminProducts(products) { if (!adminProductTableBody || !adminProductTable) { console.error("Admin ürün tablosu bulunamadı."); if (adminProductListContainer) adminProductListContainer.innerHTML = '<p style="color:red;">Tablo elemanı bulunamadı.</p>'; return; } adminProductListContainer.innerHTML = ''; if (!Array.isArray(products) || products.length === 0) { adminProductListContainer.innerHTML = '<p>Gösterilecek ürün bulunamadı.</p>'; adminProductTable.classList.add('hidden'); return; } adminProductTableBody.innerHTML = ''; products.forEach(p => { const row = adminProductTableBody.insertRow(); row.dataset.productId = p.id; row.innerHTML = `< td data - label="ID" > ${ p.id }</td > <td data-label="Ad">${escapeHtml(p.name)}</td> <td data-label="Fiyat">${p.price.toFixed(2)}</td> <td data-label="Stok">${p.stockQuantity}</td> <td data-label="Kategori">${escapeHtml(p.categoryName || '-')}</td> <td class="actions-cell"> <button class="edit-btn" data-action="edit" data-id="${p.id}" title="Düzenle">✏️</button> <button class="delete-btn" data-action="delete" data-id="${p.id}" title="Sil">🗑️</button> </td>`; }); adminProductTable.classList.remove('hidden'); adminProductListContainer.appendChild(adminProductTable); }
    function resetProductForm() { productForm?.reset(); productIdInput.value = ''; if (productFormTitle) productFormTitle.textContent = 'Yeni Ürün Ekle'; if (productSubmitBtn) productSubmitBtn.textContent = 'Ürünü Ekle'; productFormCancelBtn?.classList.add('hidden'); clearMessage(productFormMessageDiv); }
    async function handleProductFormSubmit(event) { event.preventDefault(); if (!isAdmin()) { alert("Yetkiniz yok."); return; } clearMessage(productFormMessageDiv); clearMessage(productListMessageDiv); const productId = productIdInput.value ? parseInt(productIdInput.value, 10) : 0; const productData = { name: productNameInput.value.trim(), description: productDescriptionInput.value.trim() || null, price: parseFloat(productPriceInput.value), stockQuantity: parseInt(productStockInput.value, 10), categoryId: parseInt(productCategorySelect.value, 10), imageUrl: productImageUrlInput.value.trim() || null }; let errMsg = ""; if (!productData.name) errMsg += "Ürün adı gerekli.\n"; if (isNaN(productData.price) || productData.price <= 0) errMsg += "Geçerli fiyat girin.\n"; if (isNaN(productData.stockQuantity) || productData.stockQuantity < 0) errMsg += "Geçerli stok girin.\n"; if (isNaN(productData.categoryId) || productData.categoryId <= 0) errMsg += "Kategori seçin.\n"; if (productData.imageUrl && !/^(http|https):\/\/[^ "]+$/.test(productData.imageUrl)) errMsg += "Geçerli URL girin (http/https).\n"; if (errMsg) { displayMessage(productFormMessageDiv, errMsg.trim(), true, 0); return; } const btns = [productSubmitBtn, productFormCancelBtn].filter(b => b && !b.classList.contains('hidden')); disableButtons(btns, "Kaydediliyor..."); let result; if (productId > 0) { result = await makeApiRequest(`${ API_BASE_URL } /api/products / ${ productId } `, 'PUT', productData); } else { result = await makeApiRequest(`${ API_BASE_URL } /api/products`, 'POST', productData); } if (result.success) { displayMessage(productFormMessageDiv, result.data?.message || (productId > 0 ? "Güncellendi!" : "Eklendi!"), false, 3000); resetProductForm(); await refreshAdminProductList(); } else { displayMessage(productFormMessageDiv, `Hata: ${ result.error || 'İşlem başarısız.' } `, true, 0); } enableButtons(btns); }
    async function startEditProductForm(productId) { resetProductForm(); clearMessage(productListMessageDiv); displayMessage(productFormMessageDiv, "Yükleniyor...", false, -1); const categories = await fetchCategories(); populateCategoryDropdown(productCategorySelect, categories); const result = await makeApiRequest(`${ API_BASE_URL } /api/products / ${ productId } `); clearMessage(productFormMessageDiv); if (result.success && result.data) { const p = result.data; productIdInput.value = p.id; productNameInput.value = p.name; productDescriptionInput.value = p.description || ''; productPriceInput.value = p.price.toFixed(2); productStockInput.value = p.stockQuantity; productImageUrlInput.value = p.imageUrl || ''; if (p.categoryId) productCategorySelect.value = p.categoryId; if (productFormTitle) productFormTitle.textContent = 'Ürün Düzenle'; if (productSubmitBtn) productSubmitBtn.textContent = 'Güncelle'; productFormCancelBtn?.classList.remove('hidden'); productNameInput.focus(); productForm?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else { displayMessage(productListMessageDiv, `Ürün yüklenemedi: ${ result.error || 'Bilinmeyen hata' } `, true); } }
    async function deleteProduct(button) { const row = button.closest('tr'); if (!row) return; const productId = row.dataset.productId; const productName = row.cells[1]?.textContent || `ID: ${ productId } `; if (!confirm(`'${productName}' ürününü silmek istediğinizden emin misiniz ? Bu işlem geri alınamaz.`)) return; clearMessage(productListMessageDiv); clearMessage(productFormMessageDiv); const actionButtons = row.querySelectorAll('.actions-cell button'); disableButtons(Array.from(actionButtons), "Siliniyor..."); const result = await makeApiRequest(`${ API_BASE_URL } /api/products / ${ productId } `, 'DELETE'); if (result.success) { displayMessage(productListMessageDiv, result.data?.message || "Ürün silindi.", false, 4000); await refreshAdminProductList(); if (productIdInput.value === productId) { resetProductForm(); } } else { displayMessage(productListMessageDiv, `Silinemedi: ${ result.error || 'Bilinmeyen hata' } `, true, 0); enableButtons(Array.from(actionButtons)); } }
    async function refreshAdminProductList() { if (!adminProductListContainer) return; adminProductListContainer.innerHTML = '<p>Ürünler yükleniyor...</p>'; adminProductTable?.classList.add('hidden'); const products = await fetchAllProductsForAdmin(); displayAdminProducts(products); }
    async function showAdminProductSection() { if (!adminProductSection) return; if (!isAdmin()) { showHomeSection(); return; } hideOtherSections(adminProductSection); resetProductForm(); clearMessage(productListMessageDiv); const categories = await fetchCategories(); populateCategoryDropdown(productCategorySelect, categories); await refreshAdminProductList(); }

    // Sipariş Yönetimi (Admin)
    async function fetchAllOrders(statusFilter = '') { if (!adminOrderListDiv) return null; adminOrderListDiv.innerHTML = '<p>Siparişler yükleniyor...</p>'; let url = `${ API_BASE_URL } /api/orders`; if (statusFilter) url += ` ? status = ${ statusFilter } `; const result = await makeApiRequest(url); if (result.success && Array.isArray(result.data)) return result.data; else { if (result.status !== 401 && result.status !== 403) adminOrderListDiv.innerHTML = ` < p style = "color:red;" > Siparişler yüklenemedi: ${ result.error || 'Bilinmeyen hata' }</p > `; return null; } }
    function displayAdminOrders(orders) { if (!adminOrderListDiv) return; adminOrderListDiv.innerHTML = ''; if (!Array.isArray(orders) || !orders.length) { adminOrderListDiv.innerHTML = '<p>Filtreye uygun sipariş bulunamadı.</p>'; return; } const table = document.createElement('table'); table.className = 'admin-order-table'; table.innerHTML = `< thead > <tr><th>Sip.No</th><th>Müşteri</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>Detay</th><th>Aksiyonlar</th></tr></thead > <tbody></tbody>`; const tbody = table.querySelector('tbody'); orders.forEach(order => { const row = tbody.insertRow(); row.dataset.orderId = order.id; const currentStatusTextAdmin = OrderStatusText[order.status] || `Bilinmeyen(${ order.status })`; row.innerHTML = ` < td data - label="Sip.No" > ${ order.id }</td > <td data-label="Müşteri">${escapeHtml(order.userFullName || order.userEmail || `-`)}</td> <td data-label="Tarih">${new Date(order.orderDate).toLocaleString('tr-TR')}</td> <td data-label="Tutar">${order.totalAmount.toFixed(2)} TL</td> <td data-label="Durum" class="order-status-cell">${currentStatusTextAdmin}</td> <td data-label="Detay"><button class="admin-toggle-details-btn" title="Detay Görüntüle">👁️</button></td> <td class="admin-actions-cell" data-label="Aksiyonlar"></td>`; populateAdminActionCell(row.querySelector('.admin-actions-cell'), order); const detailRow = tbody.insertRow(); detailRow.className = 'admin-order-details-row hidden'; const detailCell = detailRow.insertCell(); detailCell.colSpan = 7; populateAdminOrderDetailRow(detailCell, order); const toggleBtn = row.querySelector('.admin-toggle-details-btn'); toggleBtn?.addEventListener('click', () => { detailRow.classList.toggle('hidden'); toggleBtn.textContent = detailRow.classList.contains('hidden') ? '👁️' : '🔼'; }); }); adminOrderListDiv.appendChild(table); }
    function populateAdminActionCell(cellEl, order) { cellEl.innerHTML = ''; const currentStatus = order.status; let added = false; const wrapStyle = 'display:inline-flex;flex-wrap:wrap;gap:5px;margin-bottom:5px;margin-right:5px;align-items:center;'; const terminal = [OrderStatusEnum.CancelledByAdmin, OrderStatusEnum.CancelledByCustomer, OrderStatusEnum.Completed]; if (terminal.includes(currentStatus)) { cellEl.textContent = "-"; return; } const availableGeneralActions = AdminAvailableActions[currentStatus]; if (availableGeneralActions && Object.keys(availableGeneralActions).length > 0) { const sw = document.createElement('div'); sw.style.cssText = wrapStyle; const sel = document.createElement('select'); sel.className = 'admin-status-select form-control form-control-sm'; sel.dataset.orderid = order.id; sel.innerHTML = '<option value="">Durum Seç...</option>'; for (const statusCode in availableGeneralActions) { const o = document.createElement('option'); o.value = statusCode; o.textContent = availableGeneralActions[statusCode]; sel.appendChild(o); } sw.appendChild(sel); const btn = document.createElement('button'); btn.className = 'admin-update-status-btn'; btn.dataset.orderid = order.id; btn.textContent = 'Uygula'; sw.appendChild(btn); cellEl.appendChild(sw); added = true; } const hasPendingItems = order.items?.some(i => (i.pendingQuantity ?? (i.quantity - i.shippedQuantity)) > 0); if ((currentStatus === OrderStatusEnum.Approved || currentStatus === OrderStatusEnum.PartiallyShipped)) { const shipW = document.createElement('div'); shipW.style.cssText = wrapStyle; let hasShipAct = false; if (currentStatus === OrderStatusEnum.Approved && hasPendingItems) { const pBtn = document.createElement('button'); pBtn.textContent = 'Kısmi G.'; pBtn.className = 'admin-partial-ship-btn'; pBtn.dataset.orderid = order.id; pBtn.title = "Kısmi Gönderim"; shipW.appendChild(pBtn); hasShipAct = true; const fBtn = document.createElement('button'); fBtn.textContent = 'Tümünü G.'; fBtn.className = 'admin-full-ship-btn'; fBtn.dataset.orderid = order.id; fBtn.title = "Tümünü Gönderildi İşaretle"; shipW.appendChild(fBtn); hasShipAct = true; } if (currentStatus === OrderStatusEnum.PartiallyShipped && hasPendingItems) { const rBtn = document.createElement('button'); rBtn.textContent = 'Kalanı G.'; rBtn.className = 'admin-ship-remaining-btn'; rBtn.dataset.orderid = order.id; rBtn.title = "Kalan Ürünleri Gönderildi İşaretle"; shipW.appendChild(rBtn); hasShipAct = true; } if (hasShipAct) { cellEl.appendChild(shipW); added = true; } } if (!added && cellEl.childElementCount === 0) cellEl.textContent = "-"; }
    function populateAdminOrderDetailRow(cellEl, order) { cellEl.innerHTML = ''; const container = document.createElement('div'); container.className = 'admin-order-detail-content'; if (order.items && order.items.length) { const ul = document.createElement('ul'); ul.style.listStyle = 'none'; ul.style.paddingLeft = '0'; order.items.forEach(item => { const li = document.createElement('li'); li.className = 'order-detail-item'; let qtyInfo = ''; const pending = item.pendingQuantity ?? (item.quantity - item.shippedQuantity); if (item.shippedQuantity > 0 || pending > 0) { qtyInfo = pending > 0 ? ` < span class="shipment-info" > (${ item.shippedQuantity } G, ${ pending }B)</span > ` : ` < span class="shipment-info-ok" > (${ item.shippedQuantity }G)</span > `; } li.innerHTML = ` < img src = "${item.productImageUrl || 'https://via.placeholder.com/40x40.png?text=...'}" alt = "${escapeHtml(item.productName)}" style = "width:40px; height:40px; object-fit:cover; border-radius:3px; vertical-align:middle; margin-right:8px;" > <span style="vertical-align:middle;">${item.quantity}x ${escapeHtml(item.productName)} (${item.price.toFixed(2)} TL)${qtyInfo} = <strong>${(item.price * item.quantity).toFixed(2)} TL</strong></span>`; li.querySelector('img').onerror = function () { this.src = 'https://via.placeholder.com/40x40.png?text=H'; }; ul.appendChild(li); }); container.appendChild(ul); } else { container.innerHTML = '<p>Bu siparişte ürün bulunmuyor.</p>'; } if (order.shippingAddress || order.notes) { const extra = document.createElement('div'); extra.style.cssText = 'margin-top:10px;padding-top:10px;border-top:1px dotted #ccc;font-size:0.9em;color:#555; word-break: break-word;'; if (order.shippingAddress) extra.innerHTML += ` < p > <strong>Adres:</strong> ${ escapeHtml(order.shippingAddress) }</p > `; if (order.notes) { const p = document.createElement('p'); p.innerHTML = '<strong>Not:</strong> '; p.appendChild(document.createTextNode(order.notes)); extra.appendChild(p); } container.appendChild(extra); } cellEl.appendChild(container); }
    async function updateOrderStatusByAdmin(orderId, newStatus) { const numStat = parseInt(newStatus, 10); if (isNaN(numStat) || [OrderStatusEnum.Shipped, OrderStatusEnum.PartiallyShipped].includes(numStat)) { alert("Geçersiz durum veya işlem. Kargo işlemleri için ilgili butonları kullanın."); return false; } const notes = prompt(`Sipariş ${ orderId } durumunu '${OrderStatusText[numStat]}' olarak güncellemek için yönetici notu(isteğe bağlı): `, ""); const result = await makeApiRequest(`${ API_BASE_URL } /api/orders / ${ orderId } /status`, 'PUT', { newStatus: numStat, adminNotes: notes }); if (!result.success) alert(`Durum güncellenemedi: ${result.error || 'Bilinmeyen hata'}`); return result.success; }
async function markOrderPartiallyShipped(orderId) { const token = getToken(); if (!token) { handleUnauthorized(); return false; } const rO = await makeApiRequest(`${API_BASE_URL}/api/orders/${orderId}`); if (!rO.success || !rO.data) { alert(`Sipariş detayı alınamadı: ${rO.error}`); return false; } const oD = rO.data; const pendingItems = oD.items?.filter(i => (i.pendingQuantity ?? (i.quantity - i.shippedQuantity)) > 0); if (!pendingItems || pendingItems.length === 0) { alert("Bu siparişte gönderilmeyi bekleyen ürün bulunmuyor."); return false; } alert("Geliştirme Notu: Kısmi gönderim için daha iyi bir UI gereklidir. Şimdilik prompt kullanılacaktır."); const shippedData = []; let invalidInput = false; for (const item of pendingItems) { const pending = item.pendingQuantity ?? (item.quantity - item.shippedQuantity); const qtyInput = prompt(`${item.productName} (Bekleyen: ${pending}, Kalem ID: ${item.id})\nBu gönderimde kaç adet gönderilecek? (Max: ${pending})`, "0"); if (qtyInput === null) { invalidInput = true; break; } const qty = parseInt(qtyInput, 10); if (isNaN(qty) || qty < 0 || qty > pending) { alert(`Geçersiz miktar: "${qtyInput}". İzin verilen: 0-${pending}.`); invalidInput = true; break; } if (qty > 0) { shippedData.push({ orderItemId: item.id, quantityToShip: qty }); } } if (invalidInput) { alert("İşlem iptal edildi."); return false; } if (shippedData.length === 0) { alert("Gönderilecek miktar girilmedi."); return false; } const notes = prompt("Yönetici Notu (isteğe bağlı):", "Kısmi gönderim yapıldı (UI)."); const result = await makeApiRequest(`${API_BASE_URL}/api/orders/${orderId}/partially-ship`, 'POST', { shippedItems: shippedData, adminNotes: notes }); if (!result.success) alert(`Hata: ${result.error || 'İşlem başarısız.'}`); else alert(result.data?.message || "İşlem başarılı."); return result.success; }
async function shipRemainingOrderItems(orderId) { if (!confirm(`Sipariş ${orderId} için kalan tüm ürünleri 'Kargolandı' olarak işaretlemek istediğinizden emin misiniz?`)) return false; const notes = prompt("Yönetici Notu (isteğe bağlı):", "Kalan ürünler kargolandı (UI)."); const result = await makeApiRequest(`${API_BASE_URL}/api/orders/${orderId}/ship-remaining`, 'POST', { adminNotes: notes }); if (!result.success) alert(`Hata: ${result.error || 'İşlem başarısız.'}`); else alert(result.data?.message || "İşlem başarılı."); return result.success; }
async function shipAllOrderItems(orderId) { if (!confirm(`Sipariş ${orderId} için TÜM bekleyen ürünleri 'Kargolandı' olarak işaretlemek istediğinizden emin misiniz?`)) return false; const rO = await makeApiRequest(`${API_BASE_URL}/api/orders/${orderId}`); if (!rO.success || !rO.data) { alert(`Sipariş detayı alınamadı: ${rO.error}`); return false; } const oD = rO.data; const itemsToShip = oD.items?.filter(i => (i.pendingQuantity ?? (i.quantity - i.shippedQuantity)) > 0).map(item => ({ orderItemId: item.id, quantityToShip: item.pendingQuantity ?? (item.quantity - item.shippedQuantity) })); if (!itemsToShip || itemsToShip.length === 0) { alert("Bu siparişte gönderilmeyi bekleyen ürün bulunmuyor."); return false; } const notes = prompt("Yönetici Notu (isteğe bağlı):", "Tüm ürünler kargolandı (UI)."); const result = await makeApiRequest(`${API_BASE_URL}/api/orders/${orderId}/partially-ship`, 'POST', { shippedItems: itemsToShip, adminNotes: notes }); if (!result.success) alert(`Hata: ${result.error || 'İşlem başarısız.'}`); else alert(result.data?.message || "Tüm ürünler gönderildi olarak işaretlendi."); return result.success; }
async function handleAdminOrderAction(event) { const button = event.target.closest('button'); if (!button) return; const orderId = button.dataset.orderid || button.closest('tr')?.dataset.orderId; if (!orderId) return; let success = false; let shouldRefresh = false; const actionCell = button.closest('.admin-actions-cell'); const allElementsInRow = button.closest('tr')?.querySelectorAll('button, select'); const elementsToDisable = actionCell ? Array.from(actionCell.querySelectorAll('button, select')) : (allElementsInRow ? Array.from(allElementsInRow) : []); disableButtons(elementsToDisable, '...'); try { if (button.classList.contains('admin-update-status-btn')) { const selectElement = actionCell?.querySelector('.admin-status-select'); const newStatus = selectElement?.value; if (newStatus && newStatus !== "") { success = await updateOrderStatusByAdmin(orderId, newStatus); shouldRefresh = success; } else { alert("Lütfen bir durum seçin."); success = false; } } else if (button.classList.contains('admin-partial-ship-btn')) { success = await markOrderPartiallyShipped(orderId); shouldRefresh = success; } else if (button.classList.contains('admin-ship-remaining-btn')) { success = await shipRemainingOrderItems(orderId); shouldRefresh = success; } else if (button.classList.contains('admin-full-ship-btn')) { success = await shipAllOrderItems(orderId); shouldRefresh = success; } } catch (err) { console.error("Admin action error:", err); alert("Beklenmedik bir hata oluştu."); success = false; } finally { if (shouldRefresh) { const currentFilter = adminOrderStatusFilter?.value || ''; if (adminOrderListDiv) adminOrderListDiv.innerHTML = '<p>Liste yenileniyor...</p>'; const orders = await fetchAllOrders(currentFilter); if (orders !== null) displayAdminOrders(orders); } else { enableButtons(elementsToDisable); } } }
async function showAdminOrdersSection() { if (!adminOrdersSection) return; if (!isAdmin()) { showHomeSection(); return; } hideOtherSections(adminOrdersSection); populateStatusFilterDropdown(); const filter = adminOrderStatusFilter?.value || ''; if (adminOrderListDiv) adminOrderListDiv.innerHTML = '<p>Siparişler yükleniyor...</p>'; const orders = await fetchAllOrders(filter); if (orders !== null) displayAdminOrders(orders); else if (adminOrderListDiv) adminOrderListDiv.innerHTML = '<p style="color:red;">Siparişler yüklenemedi.</p>'; }
function populateStatusFilterDropdown() { if (!adminOrderStatusFilter || adminOrderStatusFilter.options.length > 1) return; adminOrderStatusFilter.innerHTML = '<option value="">Tümü</option>'; for (const statusCode in OrderStatusText) { const o = document.createElement('option'); o.value = statusCode; o.textContent = OrderStatusText[statusCode]; adminOrderStatusFilter.appendChild(o); } }

// Admin Kullanıcı Yönetimi
async function fetchUsersForAdmin() {
    const result = await makeApiRequest(`${API_BASE_URL}/api/users`);
    if (result.success && Array.isArray(result.data)) { return result.data; }
    else { displayMessage(userListMessageDiv, `Kullanıcılar yüklenemedi: ${result.error || 'Bilinmeyen hata'}`, true, 0); return []; }
}
function displayAdminUsers(users) {
    if (!adminUserTableBody || !adminUserTable) { console.error("Admin kullanıcı tablosu bulunamadı."); if (adminUserListContainer) adminUserListContainer.innerHTML = '<p style="color:red;">Tablo elemanı bulunamadı.</p>'; return; }
    adminUserListContainer.innerHTML = '';
    if (!Array.isArray(users) || users.length === 0) { adminUserListContainer.innerHTML = '<p>Gösterilecek kullanıcı bulunamadı.</p>'; adminUserTable.classList.add('hidden'); return; }
    adminUserTableBody.innerHTML = '';
    users.forEach(user => {
        const row = adminUserTableBody.insertRow(); row.dataset.userId = user.id;
        row.innerHTML = `
                <td data-label="ID">${user.id}</td>
                <td data-label="Ad Soyad">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</td>
                <td data-label="Email">${escapeHtml(user.email)}</td>
                <td data-label="Tip">${UserTypeText[user.userType] || 'Bilinmiyor'}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-action="edit-user" data-id="${user.id}" title="Düzenle (TODO)">✏️</button>
                    <button class="delete-btn" data-action="delete-user" data-id="${user.id}" title="Sil (TODO)">🗑️</button>
                </td>`;
    });
    adminUserTable.classList.remove('hidden'); adminUserListContainer.appendChild(adminUserTable);
}
async function refreshAdminUserList() {
    if (!adminUserListContainer) return;
    adminUserListContainer.innerHTML = '<p>Kullanıcılar yükleniyor...</p>';
    adminUserTable?.classList.add('hidden');
    const users = await fetchUsersForAdmin();
    displayAdminUsers(users);
}
async function showAdminUserSection() {
    if (!adminUserSection) return; if (!isAdmin()) { showHomeSection(); return; }
    hideOtherSections(adminUserSection); clearMessage(userListMessageDiv);
    await refreshAdminUserList();
}
function handleAdminUserAction(event) { 
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const action = button.dataset.action; const userId = button.dataset.id;
    if (action === 'edit-user') { alert(`Kullanıcı ${userId} düzenleme işlemi henüz eklenmedi.`);  }
    else if (action === 'delete-user') { alert(`Kullanıcı ${userId} silme işlemi henüz eklenmedi.`);  }
}

// --- UI Navigasyon ---
function hideOtherSections(activeSectionElement) {
    const sections = [mainContent, basketSection, authFormsSection, orderHistorySection, adminOrdersSection, adminProductSection, adminCategorySection, profileSection, adminUserSection];
    sections.forEach(s => { if (s && s !== activeSectionElement) s.classList.add('hidden'); else if (s === activeSectionElement) s.classList.remove('hidden'); });
    if (activeSectionElement !== authFormsSection) { authFormsSection?.classList.add('hidden'); }
}
function showHomeSection() { // Ana Sayfa (Kategorileri Gösterir)
    hideOtherSections(mainContent);
    clearAuthMessage();
    fetchCategoriesForHome(); // Kategorileri yükle
}
function showBasketSection() { const t = getToken(); if (!t) { handleUnauthorized(); return; } hideOtherSections(basketSection); basketItemsContainer.innerHTML = '<p>Sepet yükleniyor...</p>'; fetchBasket().then(b => displayBasket(b)); }

// --- Olay Dinleyicileri ---
if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginForm);
if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegisterForm);
if (logoutBtn) logoutBtn.addEventListener('click', () => { removeToken(); updateUI(); showHomeSection(); });
if (switchToRegisterLink) switchToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
if (switchToLoginLink) switchToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
if (showProfileBtn) showProfileBtn.addEventListener('click', showProfileSection);
if (showBasketBtn) showBasketBtn.addEventListener('click', showBasketSection);
if (homeLink) homeLink.addEventListener('click', (e) => { e.preventDefault(); showHomeSection(); });
if (showMyOrdersBtn) showMyOrdersBtn.addEventListener('click', showOrderHistorySection);
if (showAdminOrdersBtn) showAdminOrdersBtn.addEventListener('click', showAdminOrdersSection);
if (showProductMgmtBtn) showProductMgmtBtn.addEventListener('click', showAdminProductSection);
if (showCategoryMgmtBtn) showCategoryMgmtBtn.addEventListener('click', showAdminCategorySection);
if (showUserMgmtBtn) showUserMgmtBtn.addEventListener('click', showAdminUserSection);
// Geri Dönüş Linkleri
backToHomeLinks.forEach(link => { link?.addEventListener('click', (e) => { e.preventDefault(); showHomeSection(); }); });
// Sepet Butonları (Delegasyon)
if (basketItemsContainer) basketItemsContainer.addEventListener('click', handleBasketAction);
if (clearBasketBtn) clearBasketBtn.addEventListener('click', clearBasket);
if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
// Admin Sipariş Filtreleme
if (adminFilterOrdersBtn) { adminFilterOrdersBtn.addEventListener('click', async () => { const s = adminOrderStatusFilter.value; disableButtons([adminFilterOrdersBtn], 'Filtreleniyor...'); const o = await fetchAllOrders(s); if (o !== null) displayAdminOrders(o); enableButtons([adminFilterOrdersBtn]); }); }
// Admin Sipariş Tablo Aksiyonları (Delegasyon)
if (adminOrderListDiv) { adminOrderListDiv.addEventListener('click', handleAdminOrderAction); }
// Admin Kategori Formu ve Tablo Aksiyonları
if (categoryForm) { categoryForm.addEventListener('submit', handleCategoryFormSubmit); }
if (categoryFormCancelBtn) { categoryFormCancelBtn.addEventListener('click', resetCategoryForm); }
if (adminCategoryTableBody) { adminCategoryTableBody.addEventListener('click', (event) => { const button = event.target.closest('button[data-action]'); if (!button) return; const action = button.dataset.action; const categoryId = button.dataset.id; if (action === 'edit') { startEditCategoryForm(categoryId); } else if (action === 'delete') { deleteCategory(button); } }); }
// Admin Ürün Formu ve Tablo Aksiyonları
if (productForm) { productForm.addEventListener('submit', handleProductFormSubmit); }
if (productFormCancelBtn) { productFormCancelBtn.addEventListener('click', resetProductForm); }
if (adminProductTableBody) { adminProductTableBody.addEventListener('click', (event) => { const button = event.target.closest('button[data-action]'); if (!button) return; const action = button.dataset.action; const productId = button.dataset.id; if (action === 'edit') { startEditProductForm(productId); } else if (action === 'delete') { deleteProduct(button); } }); }
// Admin Kullanıcı Tablo Aksiyonları
if (adminUserTableBody) { adminUserTableBody.addEventListener('click', handleAdminUserAction); }

// --- Form Gönderimleri (Login/Register) ---
if (loginForm) { loginForm.addEventListener('submit', async (e) => { e.preventDefault(); clearAuthMessage(); const email = loginForm.querySelector('#login-email')?.value, password = loginForm.querySelector('#login-password')?.value; if (!email || !password) { displayAuthMessage("E-posta ve şifre gerekli.", true); return; } const btn = e.target.querySelector('button[type="submit"]'); disableButtons([btn], "Giriş Yapılıyor..."); try { const result = await makeApiRequest(`${API_BASE_URL}/api/auth/login`, 'POST', { email, password }, false); if (result.success && result.data?.token && result.data?.user) { saveToken(result.data.token); saveUserInfo(result.data.user); updateUI(); showHomeSection(); loginForm.reset(); } else { displayAuthMessage(result.error || 'Giriş başarısız.', true, 0); removeToken();  } } catch (er) { displayAuthMessage('Ağ hatası: ' + er.message, true); removeToken(); } finally { enableButtons([btn]); } }); }
if (registerForm) { registerForm.addEventListener('submit', async (e) => { e.preventDefault(); clearAuthMessage(); const d = { firstName: registerForm.querySelector('#register-firstname')?.value.trim(), lastName: registerForm.querySelector('#register-lastname')?.value.trim(), email: registerForm.querySelector('#register-email')?.value.trim(), password: registerForm.querySelector('#register-password')?.value, phoneNumber: registerForm.querySelector('#register-phone')?.value.trim() || null, address: registerForm.querySelector('#register-address')?.value.trim() || null }; let regError = ""; if (!d.firstName) regError += "Ad?\n"; if (!d.lastName) regError += "Soyad?\n"; if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) regError += "Email?\n"; if (!d.password || d.password.length < 6) regError += "Şifre (min 6)?\n"; if (regError) { displayAuthMessage(regError.trim(), true, 0); return; } const btn = e.target.querySelector('button[type="submit"]'); disableButtons([btn], "Kaydediliyor..."); try { const result = await makeApiRequest(`${API_BASE_URL}/api/auth/register`, 'POST', d, false); if (result.success) { displayAuthMessage(result.data?.message || 'Kayıt başarılı. Giriş yapabilirsiniz.', false, 8000); showLoginForm(); registerForm.reset(); } else { displayAuthMessage(`Kayıt hatası: ${result.error || 'Bilinmeyen'}`, true, 0); } } catch (er) { displayAuthMessage('Ağ hatası: ' + er.message, true); } finally { enableButtons([btn]); } }); }

// --- Başlangıç ---
console.log("DOM Loaded. Initializing UI...");
updateUI();
if (!authFormsSection?.classList.contains('hidden')) { mainContent?.classList.add('hidden'); }
else { showHomeSection(); }
});