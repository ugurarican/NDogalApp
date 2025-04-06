export function getToken() { return localStorage.getItem('authToken'); }
export function saveToken(token) { if (token && typeof token === 'string') { localStorage.setItem('authToken', token); } else { console.error("saveToken: Geçersiz token."); } }
export function removeToken() { localStorage.removeItem('authToken'); localStorage.removeItem('userInfo'); }
export function saveUserInfo(user) { if (user && typeof user === 'object') { try { localStorage.setItem('userInfo', JSON.stringify(user)); } catch (e) { console.error("saveUserInfo Error:", e); } } else { console.error("saveUserInfo: Geçersiz user objesi."); } }
export function getUserInfo() { const i = localStorage.getItem('userInfo'); if (!i) return null; try { const u = JSON.parse(i); if (u && typeof u === 'object' && u.id && u.email) return u; else { console.warn("User info in localStorage is invalid. Clearing..."); removeToken(); return null; } } catch (e) { console.error("getUserInfo Error parsing localStorage:", e); removeToken(); return null; } }
export function isAdmin() { return getUserInfo()?.userType === 2; }


/**
 * Belirtilen HTML elementinde bir mesaj gösterir ve belirli bir süre sonra gizler.
 * @param {HTMLElement|null} element Mesajın gösterileceği element.
 * @param {string} message Gösterilecek mesaj.
 * @param {boolean} [isError=false] Mesajın hata mesajı olup olmadığını belirtir (CSS sınıfı için).
 * @param {number} [duration=5000] Mesajın ekranda kalma süresi (ms). 0 veya negatifse otomatik gizlenmez.
 */
export function displayMessage(element, message, isError = false, duration = 5000) {
    if (!element) {
        console.warn(`displayMessage: Element not found for message: "${message}"`);
        return;
    }
    // Önceki timeout'u temizle (varsa)
    if (element.dataset.messageTimeoutId) {
        clearTimeout(parseInt(element.dataset.messageTimeoutId, 10));
        delete element.dataset.messageTimeoutId;
    }

    element.textContent = message;
    element.className = `message-area ${isError ? 'error' : 'success'}`; // Temizleyip ekle
    element.classList.remove('hidden'); // Görünür yap

    // Otomatik gizleme (duration > 0 ise)
    if (duration > 0) {
        const timeoutId = setTimeout(() => {
            clearMessage(element);
        }, duration);
        element.dataset.messageTimeoutId = timeoutId.toString(); // Yeni ID'yi sakla
    }
}

/**
 * Belirtilen HTML elementindeki mesajı temizler ve gizler.
 * @param {HTMLElement|null} element Mesajın temizleneceği element.
 */
export function clearMessage(element) {
    if (element) {
        element.textContent = '';
        element.classList.add('hidden');
        element.classList.remove('success', 'error'); // CSS sınıflarını kaldır
        // Timeout ID'yi temizle (varsa)
        if (element.dataset.messageTimeoutId) {
            clearTimeout(parseInt(element.dataset.messageTimeoutId, 10));
            delete element.dataset.messageTimeoutId;
        }
    }
}

/**
 * Verilen HTML elementlerini (genellikle butonlar) devre dışı bırakır.
 * @param {Array<HTMLElement|null>} elements Devre dışı bırakılacak elementler dizisi.
 */
export function disableButtons(elements) {
    if (!Array.isArray(elements)) {
        console.warn("disableButtons: Expected an array of elements."); return;
    }
    elements.forEach(el => {
        if (el instanceof HTMLElement) {
            el.disabled = true;
        }
    });
}

/**
 * Verilen HTML elementlerini (genellikle butonlar) etkinleştirir.
 * Spinner varsa orijinal içeriği geri yükler.
 * @param {Array<HTMLElement|null>} elements Etkinleştirilecek elementler dizisi.
 */
export function enableButtons(elements) {
    if (!Array.isArray(elements)) {
        console.warn("enableButtons: Expected an array of elements."); return;
    }
    elements.forEach(el => {
        if (el instanceof HTMLElement) {
            el.disabled = false;
            // Eğer buton yükleniyorsa, spinner'ı kaldır ve orijinal içeriği geri yükle
            if (el.classList.contains('button-loading')) {
                hideButtonLoading(el); // hideButtonLoading orijinal içeriği zaten geri yükler
            }
        }
    });
}


/**
 * Güvenli olmayan metni HTML encod'layarak XSS saldırılarını önler.
 * @param {*} unsafe Encode edilecek değer (genellikle string).
 * @returns {string} HTML-safe string.
 */
export function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    // Metni bir div'in textContent'ine atayıp innerHTML'ini almak, encode etmenin güvenli bir yoludur.
    const div = document.createElement('div');
    div.textContent = unsafe.toString();
    return div.innerHTML;
}

// --- Yükleme Göstergesi Yardımcıları ---

/**
 * Belirtilen konteyner elementinin üzerine yarı saydam bir overlay ve spinner ekler.
 * Konteynerin position'ı static ise relative olarak ayarlanır.
 * @param {HTMLElement|null} containerElement Overlay'in ekleneceği konteyner.
 * @param {string} [spinnerText='Yükleniyor...'] Spinner altında gösterilecek metin.
 * @param {string} [spinnerColorClass='text-primary'] Spinner rengi için CSS sınıfı (örn: 'text-success').
 */
export function showLoadingOverlay(containerElement, spinnerText = 'Yükleniyor...', spinnerColorClass = 'text-primary') {
    if (!containerElement) { console.warn("showLoadingOverlay: Container element not found."); return; }

    // Mevcut overlay'i bul veya oluştur
    let overlay = containerElement.querySelector(':scope > .loading-overlay'); // :scope ile sadece direkt child ara
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay'; // Başlangıçta hidden yok
        overlay.innerHTML = `
            <div class="spinner-border ${escapeHtml(spinnerColorClass)}" role="status">
                <span class="visually-hidden">${escapeHtml(spinnerText)}</span>
            </div>
            ${spinnerText ? `<p>${escapeHtml(spinnerText)}</p>` : ''}
        `;

        // Konteynerin position'ını ayarla (eğer static ise)
        const currentPosition = window.getComputedStyle(containerElement).position;
        if (currentPosition === 'static') {
            containerElement.style.position = 'relative';
            // Orijinal durumu sakla ki kaldırırken geri alınabilsin
            containerElement.dataset.originalPosition = 'static';
        }
        containerElement.classList.add('loading-overlay-container'); // Konteyner sınıfını ekle
        containerElement.appendChild(overlay); // Overlay'i ekle
    }

    overlay.classList.remove('hidden'); // Görünür yap (zaten hidden değilse bir şey değişmez)
    containerElement.classList.add('is-loading'); // İçeriği soluklaştırmak için sınıf ekle
    console.log(`[uiHelpers] Overlay shown on:`, containerElement.id || containerElement.tagName);
}

/**
 * Belirtilen konteyner elementindeki yükleme overlay'ini kaldırır.
 * Konteynerin position'ı eski haline getirilir.
 * @param {HTMLElement|null} containerElement Overlay'in kaldırılacağı konteyner.
 */
export function hideLoadingOverlay(containerElement) {
    if (!containerElement) { console.warn("hideLoadingOverlay: Container element not found."); return; }

    const overlay = containerElement.querySelector(':scope > .loading-overlay');
    if (overlay) {
        overlay.remove(); // Overlay'i kaldır
    }

    containerElement.classList.remove('is-loading'); // İçerik solukluğunu kaldır

    // Orijinal position'ı geri yükle (eğer değiştirilmişse)
    if (containerElement.dataset.originalPosition === 'static') {
        containerElement.style.position = 'static';
        delete containerElement.dataset.originalPosition; // Saklanan bilgiyi temizle
    }

    // Eğer başka overlay kalmadıysa konteyner sınıfını kaldır
    if (!containerElement.querySelector(':scope > .loading-overlay')) {
        containerElement.classList.remove('loading-overlay-container');
    }
    console.log(`[uiHelpers] Overlay hidden/removed from:`, containerElement.id || containerElement.tagName);
}


/**
 * Bir butonun içeriğini geçici olarak bir spinner ile değiştirir ve butonu devre dışı bırakır.
 * Orijinal içeriği data-* attribute'unda saklar.
 * @param {HTMLButtonElement|null} buttonElement Spinner eklenecek buton.
 * @param {string} [spinnerText='Yükleniyor...'] Spinner için yardımcı metin (visually-hidden).
 */
export function showButtonLoading(buttonElement, spinnerText = 'Yükleniyor...') {
    if (!buttonElement || buttonElement.tagName !== 'BUTTON' || buttonElement.classList.contains('button-loading')) return;

    buttonElement.classList.add('button-loading');
    // Orijinal içeriği (HTML olabilir) sakla
    if (!buttonElement.dataset.originalContent) {
        buttonElement.dataset.originalContent = buttonElement.innerHTML;
    }
    buttonElement.disabled = true;
    // Spinner'ı ekle
    buttonElement.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span class="original-button-text visually-hidden">${escapeHtml(spinnerText)}</span>
    `;
}

/**
 * Butondaki spinner'ı kaldırır, orijinal içeriği geri yükler ve butonu etkinleştirir.
 * @param {HTMLButtonElement|null} buttonElement Spinner'ın kaldırılacağı buton.
 * @param {string|null} [fallbackContent=null] Eğer orijinal içerik bulunamazsa kullanılacak metin.
 */
export function hideButtonLoading(buttonElement, fallbackContent = null) {
    if (!buttonElement || buttonElement.tagName !== 'BUTTON' || !buttonElement.classList.contains('button-loading')) return;

    // Orijinal içeriği geri yükle
    if (buttonElement.dataset.originalContent) {
        buttonElement.innerHTML = buttonElement.dataset.originalContent;
        delete buttonElement.dataset.originalContent; // Saklanan bilgiyi temizle
    } else if (fallbackContent) {
        buttonElement.innerHTML = fallbackContent; // Fallback içeriği kullan
    } else {
        // Fallback de yoksa, butonun text'ini tahmin etmeye çalış (basit durumlar için)
        buttonElement.textContent = buttonElement.getAttribute('title') || 'Button';
    }

    buttonElement.disabled = false;
    buttonElement.classList.remove('button-loading');
}


// --- Uygulama Sabitleri ve Enum Benzeri Yapılar ---
export const OrderStatusEnum = Object.freeze({ PendingApproval: 1, Approved: 2, Shipped: 3, Delivered: 4, CancelledByCustomer: 5, CancelledByAdmin: 6, PartiallyShipped: 7, Completed: 8 });
export const OrderStatusText = Object.freeze({ 1: "Onay Bekliyor", 2: "Onaylandı", 3: "Kargolandı", 4: "Teslim Edildi", 5: "Müşteri İptal Etti", 6: "Yönetici İptal Etti", 7: "Kısmen Kargolandı", 8: "Tamamlandı" });
export const UserTypeEnum = Object.freeze({ Customer: 1, Admin: 2 });
export const UserTypeText = Object.freeze({ 1: "Müşteri", 2: "Admin" });
// Admin'in hangi durumdan hangi duruma geçiş yapabileceğini tanımlar
export const AdminAvailableActions = Object.freeze({
    [OrderStatusEnum.PendingApproval]: { // 1: Onay Bekliyor
        [OrderStatusEnum.Approved]: "Onayla",               // -> 2: Onaylandı
        [OrderStatusEnum.CancelledByAdmin]: "İptal Et"     // -> 6: Yönetici İptal
    },
    [OrderStatusEnum.Approved]: { // 2: Onaylandı
        // Buradan direkt kargo butonları kullanılacak (Kısmi G., Tümünü G.)
        [OrderStatusEnum.CancelledByAdmin]: "İptal Et"     // -> 6: Yönetici İptal
    },
    [OrderStatusEnum.PartiallyShipped]: { // 7: Kısmen Kargolandı
        // Buradan direkt kargo butonları kullanılacak (Kalanı G.)
        [OrderStatusEnum.Delivered]: "Teslim Edildi",      // -> 4: Teslim Edildi
        [OrderStatusEnum.Completed]: "Tamamlandı",         // -> 8: Tamamlandı
        [OrderStatusEnum.CancelledByAdmin]: "İptal Et"     // -> 6: Yönetici İptal
    },
    [OrderStatusEnum.Shipped]: { // 3: Kargolandı (Tamamı)
        [OrderStatusEnum.Delivered]: "Teslim Edildi",      // -> 4: Teslim Edildi
        [OrderStatusEnum.Completed]: "Tamamlandı",         // -> 8: Tamamlandı
        // [OrderStatusEnum.CancelledByAdmin]: "İptal Et" // Genellikle kargolanan sipariş iptal edilmez?
    },
    [OrderStatusEnum.Delivered]: { // 4: Teslim Edildi
        [OrderStatusEnum.Completed]: "Tamamlandı"          // -> 8: Tamamlandı
    }
    // İptal edilen (5, 6) veya Tamamlanan (8) siparişler için aksiyon yok.
});

console.log("UI Helpers Module Loaded.");