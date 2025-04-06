import { API_BASE_URL, makeApiRequest } from './api.js';
import {
    getToken, isAdmin, displayMessage, clearMessage,
    disableButtons, enableButtons, escapeHtml, showLoadingOverlay,
    hideLoadingOverlay, showButtonLoading, hideButtonLoading
} from './uiHelpers.js';
import { addItemToBasket } from './basket.js'; // Sepete eklemek için

// --- DOM Element Referansları ---
const contentListContainer = document.getElementById('content-list');
const mainContentTitle = document.getElementById('main-content-title');
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

// --- Callback Fonksiyon Değişkenleri ---
let _handleUnauthorizedCallback = () => { console.error("Product Module: handleUnauthorizedCallback not set!"); };
let _showLoginFormCallback = () => { console.error("Product Module: showLoginFormCallback not set!"); };
let _fetchCategoriesCallback = async () => { console.error("Product Module: fetchCategoriesCallback not set!"); return []; };

// ======================================================
// ====       PUBLIC ÜRÜN GÖSTERİM FONKSİYONLARI     ====
// ======================================================

/**
 * Belirtilen kategoriye ait ürünleri çeker ve gösterir.
 * @param {number|string} categoryId Kategori ID'si.
 * @param {string} categoryName Kategori adı (başlık için).
 */
export async function fetchProductsForCategory(categoryId, categoryName) {
    if (!contentListContainer || !mainContentTitle) {
        console.error("fetchProductsForCategory: Missing main content elements.");
        return;
    }
    mainContentTitle.textContent = `${escapeHtml(categoryName)} Ürünleri`;
    showLoadingOverlay(contentListContainer, 'Ürünler Yükleniyor...');
    contentListContainer.innerHTML = ''; // Mevcut içeriği temizle

    let products = [];
    try {
        const url = `${API_BASE_URL}/api/products${categoryId ? `?categoryId=${categoryId}` : ''}`; // CategoryId varsa ekle
        const result = await makeApiRequest(url, 'GET', null, false); // Public endpoint
        if (result.success && Array.isArray(result.data)) {
            products = result.data;
        } else {
            console.error(`Failed to fetch products for category ${categoryId}: ${result.error}`);
            contentListContainer.innerHTML = `<p style="color:red;">Ürünler yüklenemedi: ${escapeHtml(result.error || 'Bilinmeyen API hatası')}</p>`;
        }
    } catch (error) {
        console.error(`Network error fetching products for category ${categoryId}:`, error);
        contentListContainer.innerHTML = `<p style="color:red;">Ürünler yüklenirken ağ hatası oluştu: ${escapeHtml(error.message)}</p>`;
    } finally {
        hideLoadingOverlay(contentListContainer); // Spinner'ı her durumda kaldır
    }

    if (products.length > 0) {
        displayProducts(products); // Sadece ürün varsa display çağır
    } else if (!contentListContainer.querySelector('p[style*="color:red"]')) { // Hata mesajı yoksa ve ürün yoksa "boş" mesajı
        contentListContainer.innerHTML = '<p>Bu kategoride gösterilecek ürün bulunamadı.</p>';
    }
    // Hata mesajı varsa, zaten fetch sırasında gösterilmiştir.
}

/**
 * Verilen ürün listesini ürün kartları olarak gösterir.
 */
function displayProducts(products) {
    console.log(`[product.js] displayProducts called with ${products?.length ?? 0} products.`);
    if (!contentListContainer) { console.error("displayProducts: contentListContainer missing!"); return; }
    contentListContainer.innerHTML = ''; // Temizle (Eğer fetch hatası mesajı varsa silinecek)

    if (!Array.isArray(products) || products.length === 0) {
        contentListContainer.innerHTML = '<p>Bu kategoride ürün bulunamadı.</p>'; // Hata yoksa boş mesajı göster
        contentListContainer.className = 'content-container';
        return;
    }

    contentListContainer.className = 'content-container product-container'; // Grid yapısı

    try {
        products.forEach(product => {
            if (!product || typeof product.id !== 'number') { console.warn("Invalid product data skipped:", product); return; }
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.productId = product.id;

            // --- Değişken Tanımlama ve HTML İçeriği (önemli kontrol) ---
            const name = escapeHtml(product.name || '?');
            const description = escapeHtml(product.description || '');
            const categoryName = escapeHtml(product.categoryName || '?');
            const price = (typeof product.price === 'number' && !isNaN(product.price)) ? product.price.toFixed(2) : 'N/A';
            const stock = typeof product.stockQuantity === 'number' && !isNaN(product.stockQuantity) ? product.stockQuantity : 0;
            const isAvailable = stock > 0;
            const stockClass = isAvailable ? 'in-stock' : 'out-of-stock';
            const stockText = isAvailable ? `Stok: ${stock}` : 'Stokta Yok';
            const imageUrl = product.imageUrl || 'https://via.placeholder.com/300x200.png?text=RsmYok';
            const isLoggedIn = !!getToken(); // Token var mı kontrol et
            // Buton Gösterimi: Token VARSA VE ürün ID'si geçerliyse
            const canShowAddToCart = isLoggedIn && product.id > 0;
            const btnDisabled = !isAvailable ? 'disabled' : '';
            const btnClass = `add-to-basket-btn ${!isAvailable ? 'disabled-stock' : ''}`;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${name}" loading="lazy">
                <div class="card-content">
                    <h3>${name}</h3>
                    <p class="description" title="${description || 'Açıklama yok.'}">${description || 'Açıklama yok.'}</p>
                    <p class="category">Kategori: ${categoryName}</p>
                    <div class="price-stock">
                        <p class="price">${price} TL</p>
                        <p class="stock ${stockClass}">${stockText}</p>
                    </div>
                    ${canShowAddToCart // --- Koşullu Buton Render ---
                    ? `<button data-product-id="${product.id}" title="Sepete Ekle" ${btnDisabled} class="${btnClass}">🛒 Sepete Ekle</button>`
                    : '' // Token yoksa veya ID geçersizse butonu hiç render etme
                }
                    <div class="add-to-basket-message message-area hidden"></div>
                </div>
            `;

            const imgElement = card.querySelector('img');
            if (imgElement) imgElement.onerror = function () { this.onerror = null; this.src = 'https://via.placeholder.com/300x200.png?text=Hata'; };

            // Sepete ekle butonu varsa olay dinleyici ekle
            const addBtn = card.querySelector('button[data-product-id]');
            if (addBtn) {
                addBtn.addEventListener('click', handleAddToBasketClick);
            }

            contentListContainer.appendChild(card);
        }); // forEach sonu
    } catch (error) {
        console.error("[product.js] Error rendering product cards:", error);
        contentListContainer.innerHTML = '<p style="color:red;">Ürün kartları oluşturulamadı.</p>';
        contentListContainer.className = 'content-container';
    }
}

async function handleAddToBasketClick(event) {
    const button = event.target.closest('button[data-product-id]');
    if (!button || button.disabled) return; // Buton yoksa veya pasifse çık

    const productId = button.dataset.productId;
    if (!productId) return; // Product ID yoksa çık

    if (!getToken()) {
        // Kullanıcı giriş yapmamışsa, login formunu göster
        alert("Sepete ürün eklemek için lütfen giriş yapınız.");
        if (typeof _showLoginFormCallback === 'function') {
            _showLoginFormCallback();
        }
        return;
    }

    const cardContent = button.closest('.card-content');
    const messageDiv = cardContent?.querySelector('.add-to-basket-message');
    if (messageDiv) clearMessage(messageDiv);

    const originalContent = button.innerHTML; // HTML içeriğini al (emoji dahil)
    showButtonLoading(button); // Spinner gösterir ve butonu disable eder

    try {
        const result = await addItemToBasket(productId); // basket.js'den gelen fonksiyon

        if (result.success) {
            if (messageDiv) displayMessage(messageDiv, result.message || 'Sepete eklendi!', false, 3000);
            // Başarılı ekleme sonrası başka UI güncellemesi burada gerekebilir (isteğe bağlı)
        } else {
            // addItemToBasket içinde yetki hatası (401) zaten handle edilmiş olmalı
            if (result.status !== 401 && messageDiv) {
                displayMessage(messageDiv, `Hata: ${escapeHtml(result.error || 'Eklenemedi')}`, true, 5000);
            }
        }
    } catch (e) {
        // Ağ hatası vs.
        console.error("Add to basket handler catch error:", e);
        if (messageDiv) displayMessage(messageDiv, `Beklenmedik Hata: ${escapeHtml(e.message)}`, true, 5000);
    } finally {
        // Spinner'ı kaldırır ve butonu etkinleştirir, orijinal içeriği geri yükler
        hideButtonLoading(button, originalContent);
    }
}

// ======================================================
// ====       ADMİN ÜRÜN YÖNETİMİ FONKSİYONLARI       ====
// ======================================================

/**
 * Ürün formu için kategori dropdown'ını doldurur.
 * @param {Array|null} categories Kategori listesi.
 * @param {string|number} [selectedValue=""] Varsa seçili olacak değer.
 */
export function populateProductCategoryDropdown(categories, selectedValue = "") {
    if (!productCategorySelect) { console.error("Product category select element not found."); return; }
    const currentValue = productCategorySelect.value; // Form sıfırlanırsa değer korunmaz, yine de yedek.
    productCategorySelect.innerHTML = '<option value="">-- Kategori Seçiniz --</option>'; // Default

    if (!Array.isArray(categories)) {
        console.warn("populateProductCategoryDropdown: categories is not an array.");
        return; // Kategori yoksa veya dizi değilse çık
    }

    categories.forEach(cat => {
        if (cat && typeof cat.id === 'number' && typeof cat.name === 'string') {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = escapeHtml(cat.name);
            // Değeri string olarak karşılaştır (selectedValue string veya number olabilir)
            if (selectedValue !== "" && cat.id.toString() === selectedValue.toString()) {
                opt.selected = true;
            } else if (currentValue && cat.id.toString() === currentValue) {
                opt.selected = true; // Eski değeri korumaya çalış (pek güvenilir değil)
            }
            productCategorySelect.appendChild(opt);
        } else {
            console.warn("Skipping invalid category in dropdown population:", cat);
        }
    });
}

/**
 * Admin paneli için tüm ürünleri API'den çeker.
 * @returns {Promise<Array|null>} Ürün listesi veya fetch hatası durumunda null.
 */
async function fetchAllProductsForAdminInternal() {
    if (!adminProductListContainer) { console.error("Admin product list container not found."); return null; }
    showLoadingOverlay(adminProductListContainer, 'Ürünler Yükleniyor...');
    if (adminProductTable) adminProductTable.classList.add('hidden'); // Tabloyu gizle
    adminProductListContainer.innerHTML = ''; // Mesajları/içeriği temizle
    clearMessage(productListMessageDiv);

    let productsData = null;
    const token = getToken();
    if (!token || !isAdmin()) {
        _handleUnauthorizedCallback();
        hideLoadingOverlay(adminProductListContainer);
        adminProductListContainer.innerHTML = '<p style="color:red;">Yetkiniz yok.</p>';
        return null;
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/products`, 'GET', null, false); // Public ama liste admin panelinde
        if (result.success && Array.isArray(result.data)) {
            productsData = result.data;
        } else {
            displayMessage(productListMessageDiv, `Ürünler yüklenemedi: ${escapeHtml(result.error || `API Hatası (${result.status})`)}`, true, 0);
            adminProductTable?.classList.add('hidden');
        }
    } catch (error) {
        displayMessage(productListMessageDiv, `Ürünler alınırken hata: ${escapeHtml(error.message)}`, true, 0);
        adminProductTable?.classList.add('hidden');
    } finally {
        hideLoadingOverlay(adminProductListContainer);
    }
    return productsData;
}

function displayAdminProducts(products) {
    if (!adminProductTableBody || !adminProductTable || !adminProductListContainer) {
        console.error("Admin product table elements missing.");
        if (adminProductListContainer) adminProductListContainer.innerHTML = '<p style="color:red;">Tablo hatası.</p>';
        return;
    }
    adminProductTableBody.innerHTML = ''; // Temizle

    if (products === null || products.length === 0) {
        if (!productListMessageDiv?.textContent) { // Fetch hatası mesajı yoksa "boş" yaz
            adminProductListContainer.innerHTML = '<p>Kayıtlı ürün bulunmamaktadır.</p>';
        } else {
            adminProductListContainer.innerHTML = ''; // Fetch hatası varsa temizle, mesaj div'de kalır.
        }
        adminProductTable.classList.add('hidden');
        return;
    }

    try {
        products.forEach(p => {
            if (!p || typeof p.id !== 'number') { console.warn("Skipping invalid product in admin list:", p); return; }
            const row = adminProductTableBody.insertRow();
            row.dataset.productId = p.id; // ID'yi sakla
            row.innerHTML = `
                <td data-label="ID">${p.id}</td>
                <td data-label="Ad">${escapeHtml(p.name || '-')}</td>
                <td data-label="Fiyat">${(typeof p.price === 'number' ? p.price.toFixed(2) : 'N/A')}</td>
                <td data-label="Stok">${p.stockQuantity ?? '-'}</td>
                <td data-label="Kategori">${escapeHtml(p.categoryName || '-')}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-action="edit-product" data-id="${p.id}" title="Düzenle">✏️</button>
                    <button class="delete-btn" data-action="delete-product" data-id="${p.id}" title="Sil">🗑️</button>
                </td>`;
        });

        if (!adminProductListContainer.contains(adminProductTable)) {
            adminProductListContainer.innerHTML = ''; // Önceki mesajları temizle
            adminProductListContainer.appendChild(adminProductTable);
        }
        adminProductTable.classList.remove('hidden');
        clearMessage(productListMessageDiv); // Başarılı ise liste mesajını temizle

    } catch (error) {
        console.error("Error rendering admin products table:", error);
        adminProductListContainer.innerHTML = '<p style="color:red">Ürün tablosu oluşturulurken hata.</p>';
        adminProductTable.classList.add('hidden');
    }
}

function resetProductForm() {
    if (!productForm) return;
    productForm.reset();
    if (productIdInput) productIdInput.value = ''; // Hidden ID
    if (productFormTitle) productFormTitle.textContent = 'Yeni Ürün Ekle';
    if (productSubmitBtn) productSubmitBtn.textContent = 'Ürünü Ekle';
    if (productFormCancelBtn) productFormCancelBtn.classList.add('hidden');
    if (productCategorySelect) productCategorySelect.selectedIndex = 0; // Dropdown'ı sıfırla
    if (productFormMessageDiv) clearMessage(productFormMessageDiv);
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    if (!isAdmin() || !productForm) { alert("Yetkiniz yok veya form bulunamadı."); return; }

    clearMessage(productFormMessageDiv);
    clearMessage(productListMessageDiv);

    const productId = productIdInput?.value ? parseInt(productIdInput.value, 10) : 0;
    // Form verilerini al
    const productData = {
        name: productNameInput?.value.trim() ?? '',
        description: productDescriptionInput?.value.trim() || null,
        price: parseFloat(productPriceInput?.value ?? ''),
        stockQuantity: parseInt(productStockInput?.value ?? '', 10),
        categoryId: parseInt(productCategorySelect?.value ?? '', 10),
        imageUrl: productImageUrlInput?.value.trim() || null
    };

    // Validasyon
    let errorMessages = [];
    if (!productData.name) errorMessages.push("Ürün adı zorunludur.");
    if (isNaN(productData.price) || productData.price <= 0) errorMessages.push("Geçerli bir fiyat giriniz (0'dan büyük).");
    if (isNaN(productData.stockQuantity) || productData.stockQuantity < 0) errorMessages.push("Stok adedi 0 veya daha büyük olmalıdır.");
    if (isNaN(productData.categoryId) || productData.categoryId <= 0) errorMessages.push("Geçerli bir kategori seçiniz.");
    if (productData.imageUrl && !productData.imageUrl.startsWith('http')) { // Basit URL kontrolü
        errorMessages.push("Görsel URL'si geçerli bir adres olmalı (http:// veya https:// ile başlamalı).");
    }

    if (errorMessages.length > 0) {
        displayMessage(productFormMessageDiv, errorMessages.join('\n'), true, 0);
        return;
    }

    const token = getToken();
    if (!token) { _handleUnauthorizedCallback(); return; }

    const buttonsToDisable = [productSubmitBtn, productFormCancelBtn].filter(btn => btn && !btn.classList.contains('hidden'));
    showButtonLoading(productSubmitBtn, "Kaydediliyor...");
    disableButtons(buttonsToDisable);

    let result;
    let method = productId > 0 ? 'PUT' : 'POST';
    let url = `${API_BASE_URL}/api/products` + (productId > 0 ? `/${productId}` : '');

    try {
        result = await makeApiRequest(url, method, productData, token); // Token GEREKLİ

        if (result.success) {
            displayMessage(productFormMessageDiv, result.data?.message || (productId > 0 ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!"), false, 3000);
            resetProductForm();
            await refreshAdminProductList(); // Listeyi yenile
        } else {
            displayMessage(productFormMessageDiv, `Hata: ${escapeHtml(result.error || 'İşlem başarısız.')}`, true, 0);
            enableButtons(buttonsToDisable); // Hata durumunda butonları aç
            if (result.status === 401 || result.status === 403) {
                // Yetki hatası
            }
        }
    } catch (error) {
        console.error(`Error during product ${productId > 0 ? 'update' : 'add'}:`, error);
        displayMessage(productFormMessageDiv, `Beklenmedik Hata: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(buttonsToDisable);
    }
}

async function startEditProductForm(productId) {
    if (!productForm || !isAdmin()) return;

    resetProductForm(); // Formu temizle
    clearMessage(productListMessageDiv); // Liste mesajını temizle
    showLoadingOverlay(productForm, 'Ürün bilgileri yükleniyor...'); // Forma overlay

    const token = getToken(); // Edit için token gerekebilir (varsayım)

    // Önce kategorileri çek ve dropdown'ı doldur
    const categories = await _fetchCategoriesCallback();
    if (categories.length === 0) {
        displayMessage(productFormMessageDiv, "Kategoriler yüklenemedi, ürün düzenlenemiyor.", true);
        hideLoadingOverlay(productForm);
        return;
    }

    // Kategoriler yüklendikten sonra ürünü çek
    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/products/${productId}`, 'GET', null, false); // Public endpoint

        if (result.success && result.data) {
            const product = result.data;
            // Formu doldur
            if (productIdInput) productIdInput.value = product.id;
            if (productNameInput) productNameInput.value = product.name || '';
            if (productDescriptionInput) productDescriptionInput.value = product.description || '';
            if (productPriceInput) productPriceInput.value = product.price?.toFixed(2) ?? '';
            if (productStockInput) productStockInput.value = product.stockQuantity?.toString() ?? '';
            if (productImageUrlInput) productImageUrlInput.value = product.imageUrl || '';

            // Kategoriyi dropdown'da seç
            populateProductCategoryDropdown(categories, product.categoryId); // Seçili değeri de gönder

            // Form başlığını ve buton metnini güncelle
            if (productFormTitle) productFormTitle.textContent = 'Ürün Düzenle';
            if (productSubmitBtn) productSubmitBtn.textContent = 'Ürünü Güncelle';
            if (productFormCancelBtn) productFormCancelBtn.classList.remove('hidden'); // İptal butonunu göster

            productNameInput?.focus(); // Odağı ürüne getir
            productForm?.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Formu görünür alana kaydır

        } else {
            // Ürün yükleme hatası
            displayMessage(productListMessageDiv, `Ürün yüklenemedi: ${escapeHtml(result.error || 'Bilinmeyen hata')}`, true, 0);
        }
    } catch (error) {
        displayMessage(productListMessageDiv, `Ürün alınırken ağ hatası: ${escapeHtml(error.message)}`, true, 0);
    } finally {
        hideLoadingOverlay(productForm); // Spinner'ı kaldır
    }
}


/**
 * Admin ürün silme işlemini gerçekleştirir.
 * @param {HTMLButtonElement} deleteButton Sil butonuna referans.
 */
async function deleteProduct(deleteButton) {
    const row = deleteButton.closest('tr');
    if (!row) return;

    const productId = deleteButton.dataset.id; // ID'yi butondan al
    const productName = row.cells[1]?.textContent || `ID: ${productId}`;

    if (!confirm(`'${escapeHtml(productName)}' ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
        return; // Kullanıcı iptal etti
    }

    clearMessage(productListMessageDiv);
    clearMessage(productFormMessageDiv);

    const token = getToken();
    if (!token || !isAdmin()) {
        _handleUnauthorizedCallback();
        return;
    }

    const actionButtonsInRow = row.querySelectorAll('.actions-cell button');
    showButtonLoading(deleteButton, '...');
    disableButtons(Array.from(actionButtonsInRow).filter(b => b !== deleteButton));

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/products/${productId}`, 'DELETE', null, token); // Token gerekli

        if (result.success) {
            displayMessage(productListMessageDiv, result.data?.message || "Ürün başarıyla silindi.", false, 4000);
            await refreshAdminProductList(); // Listeyi yenile
            // Eğer ekleme/düzenleme formunda silinen ürün seçiliyse formu resetle
            if (productIdInput?.value === productId) {
                resetProductForm();
            }
        } else {
            // API hatası
            if (result.status !== 401 && result.status !== 403) {
                displayMessage(productListMessageDiv, `Ürün silinemedi: ${escapeHtml(result.error || 'Bilinmeyen hata')}`, true, 0);
            }
            enableButtons(Array.from(actionButtonsInRow)); // Butonları tekrar aç
        }
    } catch (error) {
        // Ağ hatası
        console.error("Error deleting product:", error);
        displayMessage(productListMessageDiv, `Ürün silinirken ağ hatası: ${escapeHtml(error.message)}`, true, 0);
        enableButtons(Array.from(actionButtonsInRow)); // Butonları tekrar aç
    }
}


function handleAdminProductAction(event) {
    const button = event.target.closest('button[data-action][data-id]');
    if (!button) return;

    const action = button.dataset.action;
    const productId = button.dataset.id;

    if (!productId) { console.warn("Product action button missing data-id."); return; }

    if (action === 'edit-product') {
        startEditProductForm(productId);
    } else if (action === 'delete-product') {
        deleteProduct(button);
    } else {
        console.warn(`Unknown product action: ${action}`);
    }
}

async function refreshAdminProductList() {
    if (!adminProductListContainer) return;
    const products = await fetchAllProductsForAdminInternal(); // Spinner/hata yönetimi yapar
    if (products !== null) { // Fetch başarılı ise
        displayAdminProducts(products);
    }
}

export function initializeProductAdmin(unauthorizedCb, fetchCategoriesCb) {
    console.log("Initializing Product Admin Module...");
    if (typeof unauthorizedCb === 'function') _handleUnauthorizedCallback = unauthorizedCb;
    else console.error("Product Admin Init Error: unauthorizedCb missing!");
    if (typeof fetchCategoriesCb === 'function') _fetchCategoriesCallback = fetchCategoriesCb;
    else console.error("Product Admin Init Error: fetchCategoriesCb missing!");

    // Olay Dinleyicileri
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);
    else console.warn("Admin product form (#admin-product-form) not found!");

    if (productFormCancelBtn) productFormCancelBtn.addEventListener('click', resetProductForm);
    else console.warn("Admin product cancel button (#admin-product-form-cancel-btn) not found!");

    if (adminProductTableBody) {
        adminProductTableBody.addEventListener('click', handleAdminProductAction); // Tablo aksiyonları
        console.log("Admin product table action listener added.");
    } else {
        console.warn("Admin product table body not found! Actions will not work.");
    }

    console.log("Product Admin Module Initialized.");

    async function showAdminProductSection() {
        console.log("[product.js] showAdminProductSection called.");
        if (!adminProductSection) { console.error("Admin product section not found."); return; }
        if (!isAdmin()) {
            _handleUnauthorizedCallback();
            return;
        }

        if (window.hideOtherSections) window.hideOtherSections(adminProductSection);
        else adminProductSection.classList.remove('hidden'); // Fallback

        resetProductForm(); // Formu sıfırla
        clearMessage(productListMessageDiv); // Mesajları temizle

        showLoadingOverlay(productForm, 'Kategoriler yükleniyor...');
        try {
            const categories = await _fetchCategoriesCallback(); // Dışarıdan gelen fonksiyonu kullan
            populateProductCategoryDropdown(categories);
        } catch (error) {
            displayMessage(productFormMessageDiv, "Kategori listesi yüklenemedi.", true);
        } finally {
            hideLoadingOverlay(productForm);
        }

        await refreshAdminProductList(); // Ürünleri çek ve göster
    }

    return { showAdminProductSection };
}

export function setLoginCallback(callback) {
    if (typeof callback === 'function') _showLoginFormCallback = callback;
    else console.error("Product Module: Invalid login callback provided.");
}

console.log("Product Module Loaded.");