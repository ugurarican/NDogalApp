import { API_BASE_URL, makeApiRequest } from './api.js';
import {
    getToken, displayMessage, clearMessage, disableButtons, enableButtons,
    escapeHtml, showLoadingOverlay, hideLoadingOverlay, showButtonLoading,
    hideButtonLoading
} from './uiHelpers.js';

// --- DOM Elementleri (Modül kapsamında tanımlı) ---
const basketSection = document.getElementById('basket-section');
const basketItemsContainer = document.getElementById('basket-items-container');
const basketSummaryDiv = document.getElementById('basket-summary');
const basketTotalPriceSpan = document.getElementById('basket-total-price');
const basketItemCountSpan = document.getElementById('basket-item-count'); 
const checkoutBtn = document.getElementById('checkout-btn');
const clearBasketBtn = document.getElementById('clear-basket-btn');
const basketMessageDiv = document.getElementById('basket-message');

// --- Callbacks (app.js tarafından set edilecek) ---
let _handleUnauthorizedCallback = () => { console.error("Basket Module: Unauthorized callback missing."); };
let _showHomeCallback = () => { console.warn("Basket Module: Show home callback missing."); };

// --- Dahili Fonksiyonlar ---

/**
 * API'den sepet verisini çeker. Yükleme göstergesini yönetir.
 * @returns {Promise<object|null>} Sepet verisi veya hata durumunda null.
 */
async function fetchBasketInternal() {
    console.log('[basket.js] fetchBasketInternal - Starting fetch...');
    if (!basketItemsContainer || !basketSection) { // basketSection kontrolü eklendi
        console.error("fetchBasketInternal: basketItemsContainer or basketSection not found!");
        return null;
    }

    const showOverlay = !basketSection.classList.contains('hidden'); // Bölüm görünürse overlay göster
    if (showOverlay) {
        showLoadingOverlay(basketItemsContainer, 'Sepet Yükleniyor...');
    } else {
        basketItemsContainer.innerHTML = '<p>Sepet yükleniyor...</p>'; // Bölüm gizliyken basit metin
    }
    // Başlangıçta özet ve mesajları temizle/gizle
    if (basketSummaryDiv) basketSummaryDiv.classList.add('hidden');
    if (basketMessageDiv) clearMessage(basketMessageDiv);


    let basketData = null;
    const token = getToken();
    if (!token) {
        if (showOverlay) hideLoadingOverlay(basketItemsContainer);
        basketItemsContainer.innerHTML = '<p style="color:red;">Sepeti görüntülemek için lütfen giriş yapın.</p>';
        if (basketItemCountSpan) basketItemCountSpan.textContent = '0';
        return null; // Sepet verisi yok
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/basket`, 'GET', null, token); // Token gönderiliyor
        console.log('[basket.js] API Response from /api/basket:', result);

        if (result.success && result.data != null && typeof result.data === 'object') {
            basketData = result.data; // Sepet verisini al
        } else if (result.status === 401) {
            _handleUnauthorizedCallback(); // Oturum hatası varsa merkezi handler'ı çağır
            basketData = null;
            basketItemsContainer.innerHTML = '<p style="color:red;">Oturumunuz zaman aşımına uğradı. Lütfen tekrar giriş yapın.</p>';
        } else {
            // Diğer API hataları
            console.error(`Basket fetch API error (Status ${result.status}):`, result.error);
            basketData = null;
            basketItemsContainer.innerHTML = `<p style="color:red;">Sepet yüklenemedi: ${escapeHtml(result.error || `Beklenmeyen yanıt (${result.status})`)}</p>`;
        }
    } catch (error) {
        // Network veya JS hatası
        console.error("fetchBasketInternal Catch Error:", error);
        basketData = null;
        basketItemsContainer.innerHTML = `<p style="color:red;">Sepet yüklenirken bir ağ hatası oluştu: ${escapeHtml(error.message)}</p>`;
    } finally {
        // Overlay'i her zaman kaldır
        if (showOverlay) hideLoadingOverlay(basketItemsContainer);
        console.log("[basket.js] fetchBasketInternal finished. Data returned:", basketData);
    }
    return basketData; // null veya sepet objesi döner
}

/**
 * Alınan sepet verisini HTML'e render eder.
 * @param {object|null} basket API'den alınan sepet verisi veya null/boş.
 */
function displayBasket(basket) {
    console.log('[basket.js] Displaying Basket, received data:', basket);
    // Gerekli ana elementler yoksa işlemi durdur
    if (!basketItemsContainer || !basketSummaryDiv || !basketTotalPriceSpan || !basketItemCountSpan) {
        console.error("displayBasket: Required DOM elements not found (basketItemsContainer, basketSummaryDiv, basketTotalPriceSpan, basketItemCountSpan).");
        if (basketItemsContainer) basketItemsContainer.innerHTML = '<p style="color:red;">Sepet görüntüleme hatası: Gerekli HTML elemanları eksik.</p>';
        return;
    }

    basketItemsContainer.innerHTML = ''; // Render etmeden önce her zaman içini temizle

    // null, undefined, items özelliği yok veya boş array ise "Sepet Boş" mesajı göster
    if (basket == null || typeof basket !== 'object' || !basket.items || !Array.isArray(basket.items) || basket.items.length === 0) {
        console.log("displayBasket: Rendering 'empty basket' message.");
        basketItemsContainer.innerHTML = '<p>Sepetiniz şu anda boş.</p>';
        basketSummaryDiv.classList.add('hidden'); // Özeti gizle
        basketItemCountSpan.textContent = '0'; // Sayaç sıfırla
        // Boşken butonları devre dışı bırakmak mantıklı olabilir
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (clearBasketBtn) clearBasketBtn.disabled = true;
        return;
    }

    // Sepet doluysa, ürünleri render et
    console.log(`displayBasket: Rendering ${basket.items.length} basket items...`);
    try {
        basket.items.forEach((item, index) => {
            // Her ürün verisinin geçerliliğini kontrol et
            if (!item || typeof item !== 'object' || typeof item.id !== 'number' || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
                console.warn(`[basket.js] displayBasket: Skipping invalid item data at index ${index}. Received:`, item);
                return; // Geçersiz ürünü atla
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'basket-item';
            itemDiv.dataset.itemId = item.id; // Silme/güncelleme için ID'yi sakla

            const imageUrl = item.productImageUrl || 'https://via.placeholder.com/80x80.png?text=Resim Yok';
            const productName = escapeHtml(item.productName || 'Ürün Adı Bilinmiyor');
            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            // Backend'den totalPrice geliyorsa onu kullan, yoksa hesapla
            const totalPrice = (typeof item.totalPrice === 'number' && item.totalPrice >= 0)
                ? item.totalPrice
                : (unitPrice * quantity);
            const unitPriceFormatted = unitPrice.toFixed(2);
            const totalPriceFormatted = totalPrice.toFixed(2);
            const decreaseDisabled = quantity <= 1 ? 'disabled' : ''; // Miktar 1 ise azalt butonu pasif

            // itemDiv'in içeriğini oluştur
            itemDiv.innerHTML = `
                <img src="${imageUrl}" alt="${productName}" loading="lazy">
                <div class="item-details">
                    <h4>${productName}</h4>
                    <p class="item-price">Birim Fiyat: ${unitPriceFormatted} TL</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-change-btn" data-action="decrease" title="Azalt" ${decreaseDisabled}>-</button>
                    <span data-current-quantity="${quantity}">${quantity}</span>
                    <button class="quantity-change-btn" data-action="increase" title="Artır">+</button>
                </div>
                <p class="item-total-price">${totalPriceFormatted} TL</p>
                <button class="remove-item-btn" data-action="remove" title="Sepetten Kaldır">🗑️</button>
            `;

            // Resim yüklenemezse placeholder göster
            const imgElement = itemDiv.querySelector('img');
            if (imgElement) {
                imgElement.onerror = function () {
                    this.onerror = null; // Tekrar tekrar tetiklenmesini önle
                    this.src = 'https://via.placeholder.com/80x80.png?text=Hata';
                    this.alt = `${productName} (Resim Yüklenemedi)`;
                };
            }

            basketItemsContainer.appendChild(itemDiv);
        });

        // Sepet Özetini güncelle
        if (basketTotalPriceSpan && checkoutBtn && clearBasketBtn) {
            // Backend'den totalBasketPrice geliyorsa onu kullan, yoksa hesapla
            const totalBasketPrice = typeof basket.totalBasketPrice === 'number'
                ? basket.totalBasketPrice
                : basket.items.reduce((sum, i) => sum + ((i.unitPrice ?? 0) * (i.quantity ?? 0)), 0);

            basketSummaryDiv.classList.remove('hidden'); // Özeti göster
            basketTotalPriceSpan.textContent = totalBasketPrice.toFixed(2);
            // Özet butonlarını etkinleştir
            enableButtons([checkoutBtn, clearBasketBtn]);
        } else {
            console.error("displayBasket: Basket summary elements (total price span or buttons) are missing!");
            basketSummaryDiv.classList.add('hidden');
        }

        // Sepet sayaçını güncelle (Header'daki)
        basketItemCountSpan.textContent = basket.totalItemsCount?.toString() ?? basket.items.length.toString(); // totalItemsCount varsa onu kullan, yoksa item sayısı

    } catch (error) {
        // Render sırasında bir JS hatası olursa
        console.error("[basket.js] Error during rendering basket items loop:", error);
        basketItemsContainer.innerHTML = '<p style="color:red;">Sepet içeriği görüntülenirken bir hata oluştu. Lütfen konsolu kontrol edin.</p>';
        basketSummaryDiv.classList.add('hidden'); // Özeti gizle
        basketItemCountSpan.textContent = '?'; // Sayaç belirsiz
    }
}

export async function updateBasketCountUI() {
    if (!basketItemCountSpan) {
        console.error("[basket.js] updateBasketCountUI Error: basketItemCountSpan element not found!");
        return;
    }
    console.log("[basket.js] updateBasketCountUI: Starting count update...");

    const token = getToken();
    if (!token) {
        basketItemCountSpan.textContent = '0';
        console.log("[basket.js] updateBasketCountUI: No token, count set to 0.");
        return;
    }

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/basket`, 'GET', null, token);
        console.log("[basket.js] updateBasketCountUI: API response for count:", result);

        let itemCount = 0; // Varsayılan 0
        if (result.success && result.data != null && typeof result.data === 'object') {
            itemCount = result.data.totalItemsCount ?? (Array.isArray(result.data.items) ? result.data.items.length : 0);
        } else if (result.status === 401) {
            itemCount = 0; // Yetkisizse sıfır
        } else {
            console.warn("[basket.js] updateBasketCountUI: API error or unexpected data for count. Setting count to '?'.", result);
            itemCount = '?'; // Hata durumunda belirsiz
        }
        basketItemCountSpan.textContent = itemCount.toString();
        console.log(`[basket.js] updateBasketCountUI: Count updated to ${itemCount}.`);

    } catch (error) {
        console.error("[basket.js] updateBasketCountUI: Network or JS error:", error);
        basketItemCountSpan.textContent = '?'; // Ağ hatasında belirsiz
    }
}

/**
 * Sepet içindeki buton tıklamalarını (arttır, azalt, sil) yönetir.
 * @param {Event} event Tıklama olayı.
 */
async function handleBasketAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return; // Buton değilse veya pasifse çık

    const itemDiv = button.closest('.basket-item');
    if (!itemDiv || !itemDiv.dataset.itemId) {
        console.warn("handleBasketAction: Couldn't find item ID for action.");
        return;
    }

    const itemId = itemDiv.dataset.itemId;
    const action = button.dataset.action;
    const quantitySpan = itemDiv.querySelector('.item-quantity span');
    const currentQuantity = quantitySpan ? parseInt(quantitySpan.dataset.currentQuantity || '1', 10) : 1;
    const productName = itemDiv.querySelector('h4')?.textContent || `Ürün ID: ${itemId}`;

    const token = getToken();
    if (!token) {
        _handleUnauthorizedCallback();
        return;
    }

    // İşlem sırasında sepetteki tüm butonları geçici olarak devre dışı bırak
    const allActionButtonsInBasket = basketItemsContainer?.querySelectorAll('button');
    if (allActionButtonsInBasket) disableButtons(Array.from(allActionButtonsInBasket));

    let apiUrl = `${API_BASE_URL}/api/basket/items/${itemId}`;
    let method = '';
    let body = null;
    let needsConfirmation = false;
    let confirmationMessage = '';

    switch (action) {
        case 'increase':
            method = 'PUT';
            body = { newQuantity: currentQuantity + 1 };
            break;
        case 'decrease':
            if (currentQuantity > 1) {
                method = 'PUT';
                body = { newQuantity: currentQuantity - 1 };
            } else {
                method = 'DELETE'; // Miktar 1 iken azaltılırsa sil
                needsConfirmation = true;
                confirmationMessage = `'${productName}' ürününü sepetten kaldırmak istediğinizden emin misiniz?`;
            }
            break;
        case 'remove':
            method = 'DELETE';
            needsConfirmation = true;
            confirmationMessage = `'${productName}' ürününü sepetten kaldırmak istediğinizden emin misiniz?`;
            break;
        default:
            // Bilinmeyen action, butonları tekrar aktif et ve çık
            if (allActionButtonsInBasket) enableButtons(Array.from(allActionButtonsInBasket));
            console.warn(`Unknown basket action: ${action}`);
            return;
    }

    // Silme/Azaltma için onay
    if (needsConfirmation && !confirm(confirmationMessage)) {
        if (allActionButtonsInBasket) enableButtons(Array.from(allActionButtonsInBasket));
        return; // Kullanıcı iptal etti
    }

    let result = { success: false, error: 'API isteği yapılamadı.' }; // Varsayılan hata
    showButtonLoading(button, '...'); // Sadece tıklanan butona spinner koy
    try {
        result = await makeApiRequest(apiUrl, method, body, token);
    } catch (error) {
        result = { success: false, error: `Ağ hatası: ${error.message}` };
    } finally {
        hideButtonLoading(button); // Spinner'ı kaldır
    }

    if (result.success) {
        console.log(`Basket action '${action}' for item ${itemId} successful.`);
        // Sepeti yeniden çekip güncel halini göster
        const updatedBasket = await fetchBasketInternal();
        displayBasket(updatedBasket); // Bu fonksiyon özet ve diğer butonları da günceller/etkinleştirir
        // Header'daki sayaç displayBasket içinde zaten güncellendi
    } else {
        console.error(`Basket action '${action}' failed for item ${itemId}:`, result.error);
        if (result.status === 401) {
            // Yetki hatasını merkezi handler zaten yönetti, burada ek bir şey yapmaya gerek yok
        } else {
            // Diğer hatalar için kullanıcıyı bilgilendir
            alert(`Sepet güncellenemedi: ${result.error || 'Bilinmeyen bir hata oluştu.'}`);
            // Hata durumunda tüm sepet butonlarını tekrar aktif et, ki kullanıcı tekrar deneyebilsin
            if (allActionButtonsInBasket) enableButtons(Array.from(allActionButtonsInBasket));
        }
    }
}

async function clearBasket() {
    if (!clearBasketBtn || !checkoutBtn) { console.error("Clear/Checkout button not found for clearBasket action."); return; }

    if (!confirm("Sepetinizdeki tüm ürünler kaldırılacak. Emin misiniz?")) return;

    const token = getToken();
    if (!token) {
        _handleUnauthorizedCallback();
        return;
    }

    const originalText = clearBasketBtn.textContent;
    showButtonLoading(clearBasketBtn, "Boşaltılıyor...");
    disableButtons([checkoutBtn]); // Diğer butonu pasif yap

    let result;
    try {
        result = await makeApiRequest(`${API_BASE_URL}/api/basket`, 'DELETE', null, token);
        if (result.success) {
            if (basketMessageDiv) displayMessage(basketMessageDiv, "Sepet başarıyla boşaltıldı.", false, 3000);
            displayBasket(null); // Sepet boş arayüzünü göster
            // Sepet sayacı displayBasket içinde güncellendi
        } else if (result.status === 401) {
            // handleUnauthorized zaten çağrıldı
        } else {
            if (basketMessageDiv) displayMessage(basketMessageDiv, `Sepet boşaltılamadı: ${result.error || 'Bilinmeyen hata.'}`, true, 0);
            enableButtons([checkoutBtn]); // Hata durumunda diğer butonu geri aç
        }
    } catch (error) {
        if (basketMessageDiv) displayMessage(basketMessageDiv, `Sepet boşaltılırken ağ hatası: ${error.message}`, true, 0);
        enableButtons([checkoutBtn]); // Ağ hatasında diğer butonu geri aç
    } finally {
        hideButtonLoading(clearBasketBtn, originalText); // Bu butonu her zaman eski haline getir
    }
}

async function checkout() {
    if (!checkoutBtn || !clearBasketBtn || !basketTotalPriceSpan) {
        console.error("Checkout/Clear/Total price span not found for checkout action."); return;
    }

    // Sepetin boş olup olmadığını kontrol et (UI üzerinden)
    if (!basketItemsContainer?.querySelector('.basket-item')) {
        if (basketMessageDiv) displayMessage(basketMessageDiv, "Sipariş oluşturmak için sepetiniz boş.", true);
        return;
    }

    const totalText = basketTotalPriceSpan.textContent || "0.00";
    if (!confirm(`Sepetinizdeki ürünler ile ${totalText} TL tutarında bir sipariş oluşturulacak. Onaylıyor musunuz?`)) return;

    const token = getToken();
    if (!token) {
        _handleUnauthorizedCallback();
        return;
    }

    const originalText = checkoutBtn.textContent;
    showButtonLoading(checkoutBtn, "Sipariş Oluşturuluyor...");
    disableButtons([clearBasketBtn]); // Diğer butonu pasif yap

    let orderResult;
    try {
        // Sipariş oluşturma isteği (body'ye şimdilik bir şey eklemedik, gerekirse { shippingAddress, notes } eklenebilir)
        orderResult = await makeApiRequest(`${API_BASE_URL}/api/orders`, 'POST', {}, token);

        if (orderResult.success && orderResult.data?.id) {
            // Başarılı sipariş
            alert(`Siparişiniz başarıyla oluşturuldu! Sipariş Numaranız: ${orderResult.data.id}`);
            displayBasket(null); // Sepeti boş göster
            updateBasketCountUI(); // Header sayacını sıfırla (displayBasket bunu zaten yapıyor ama garanti olsun)
            // Başarılı sipariş sonrası kullanıcıyı ana sayfaya veya siparişlerim sayfasına yönlendir
            _showHomeCallback(); // Ana sayfayı göster
        } else if (orderResult.status === 401) {
            // Yetki hatası
        } else {
            // Diğer hatalar (stok yetersiz vb.)
            if (basketMessageDiv) displayMessage(basketMessageDiv, `Sipariş oluşturulamadı: ${orderResult.error || 'Bilinmeyen bir hata oluştu.'}`, true, 0);
            enableButtons([clearBasketBtn]); // Hata durumunda diğer butonu aç
        }
    } catch (error) {
        // Ağ hatası
        if (basketMessageDiv) displayMessage(basketMessageDiv, `Sipariş oluşturulurken ağ hatası: ${error.message}`, true, 0);
        enableButtons([clearBasketBtn]); // Hata durumunda diğer butonu aç
    } finally {
        hideButtonLoading(checkoutBtn, originalText); // Butonu eski haline getir
        // Buton durumu başarı/hata durumuna göre zaten ayarlandı.
    }
}

/**
 * Belirtilen ürünü sepete ekler (API isteği yapar).
 * @param {number|string} productId Eklenen ürünün ID'si.
 * @param {number} [quantity=1] Eklenecek miktar.
 * @returns {Promise<object>} API isteği sonucunu içeren nesne.
 */
export async function addItemToBasket(productId, quantity = 1) {
    const token = getToken();
    if (!token) {
        console.warn("[basket.js] addItemToBasket: User not logged in. Triggering unauthorized callback.");
        _handleUnauthorizedCallback(); // Kullanıcıyı login ekranına yönlendir
        return { success: false, status: 401, error: "Sepete eklemek için lütfen giriş yapınız." };
    }

    let result;
    try {
        console.log(`[basket.js] addItemToBasket: Sending API call for ProductId ${productId}, Quantity: ${quantity}`);
        result = await makeApiRequest(
            `${API_BASE_URL}/api/basket/items`,
            'POST',
            { productId: parseInt(productId, 10), quantity: quantity }, // Düzgün JSON body
            token // Token gönderiliyor
        );
        console.log('[basket.js] addItemToBasket API response:', result);

        if (result.success) {
            console.log("[basket.js] addItemToBasket successful. Updating UI count.");
            await updateBasketCountUI(); // Başarılı ise header'daki sayacı GÜNCELLE
        } else if (result.status === 401) {
            // Yetki hatası zaten merkezi olarak yönetildi.
        } else {
            // Diğer hatalar (stok vb.) için konsola log yaz
            console.error(`[basket.js] addItemToBasket failed: ${result.error || 'API error'}`);
            // Kullanıcıya product card üzerinde mesaj gösterilecek (handleAddToBasketClick içinde)
        }
    } catch (error) {
        // Network veya JS hatası
        console.error('[basket.js] addItemToBasket MAIN Catch Error:', error);
        result = { success: false, status: 0, error: `Ürün sepete eklenirken ağ/istemci hatası: ${error.message}` };
    }
    // Sonucu döndür ki çağıran fonksiyon (örn: handleAddToBasketClick) mesaj gösterebilsin
    return result ?? { success: false, status: -1, error: 'addItemToBasket bilinmeyen hata.' };
}

/**
 * Sepet bölümünü görünür yapar ve içeriğini yükler/günceller.
 */
export async function showBasket() {
    console.log("[basket.js] showBasket called.");
    if (!basketSection) { console.error("Basket section element (#basket-section) not found!"); return; }

    // ---> Bölümü Göster <---
    if (window.hideOtherSections) {
        window.hideOtherSections(basketSection); // Diğerlerini gizle, sepeti göster
    } else {
        console.error("Global hideOtherSections function not found! Cannot properly show basket section.");
        basketSection.classList.remove('hidden'); // Fallback
    }

    if (!getToken()) {
        _handleUnauthorizedCallback(); // Token yoksa login'e yönlendir
        // Bölümü gizlemek yerine hata mesajı göstermek daha iyi olabilir fetchBasketInternal içinde yapıldığı gibi
        basketItemsContainer.innerHTML = '<p style="color:red;">Sepeti görüntülemek için lütfen giriş yapın.</p>';
        if (basketSummaryDiv) basketSummaryDiv.classList.add('hidden');
        return;
    }

    // Bölüm zaten görünür, şimdi içeriği yükle/güncelle
    const basket = await fetchBasketInternal(); // fetch; yükleme göstergesi, hata yönetimi yapar
    displayBasket(basket); // display; null, boş, dolu durumları yönetir
}

/**
 * Sepet modülünü başlatır, olay dinleyicilerini ekler.
 * @param {function} unauthorizedCb Yetkisiz erişim durumunda çağrılacak callback.
 * @param {function} showHomeCb Ana sayfayı göstermek için callback.
 */
export function initializeBasket(unauthorizedCb, showHomeCb) {
    console.log("Initializing Basket Module...");
    if (typeof unauthorizedCb === 'function') {
        _handleUnauthorizedCallback = unauthorizedCb;
    } else {
        console.error("Basket Module Init Error: unauthorizedCb is not a function!");
    }
    if (typeof showHomeCb === 'function') {
        _showHomeCallback = showHomeCb;
    } else {
        console.error("Basket Module Init Error: showHomeCb is not a function!");
    }

    // Sepet içindeki butonlar için olay dinleyicisi (event delegation)
    if (basketItemsContainer) {
        basketItemsContainer.addEventListener('click', handleBasketAction);
    } else { console.error("Basket items container (#basket-items-container) not found! Basket actions will not work."); }

    // Sepeti Boşalt ve Siparişi Tamamla butonları
    if (clearBasketBtn) {
        clearBasketBtn.addEventListener('click', clearBasket);
    } else { console.warn("Clear basket button (#clear-basket-btn) not found!"); }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    } else { console.warn("Checkout button (#checkout-btn) not found!"); }

    console.log("Basket Module Initialized.");
    // Dışarıya açılan fonksiyonları döndür
    return {
        showBasket,          // Sepet sayfasını göstermek için
        addItemToBasket,     // Başka modüllerden sepete ürün eklemek için
        updateBasketCountUI  // Header'daki sayacı güncellemek için
    };
}