import {
    getToken, getUserInfo, isAdmin, removeToken, UserTypeText, escapeHtml,
    displayMessage, clearMessage, showLoadingOverlay, hideLoadingOverlay,
    disableButtons, enableButtons 
} from './uiHelpers.js';
import { initializeAuth, handleUnauthorized as handleAuthUnauthorized } from './auth.js'; 
import { initializeBasket, updateBasketCountUI } from './basket.js';
import { displayCategoriesForHome, initializeCategoryAdmin, setFetchProductsCallback, fetchCategories as fetchCategoriesForDropdown } from './category.js';
import {
    fetchProductsForCategory,
    initializeProductAdmin,
    populateProductCategoryDropdown,
    setLoginCallback as setProductLoginCallback
} from './product.js';
import { showOrderHistory, initializeOrderAdmin } from './order.js'; 
import { initializeUserAdmin } from './userAdmin.js';

// --- Ana DOM Element Referansları ---
const mainContent = document.getElementById('main-content');
const authFormsSection = document.getElementById('auth-forms');
const profileSection = document.getElementById('profile-section');
const basketSection = document.getElementById('basket-section');
const orderHistorySection = document.getElementById('order-history-section');
const adminCategorySection = document.getElementById('admin-category-section');
const adminProductSection = document.getElementById('admin-product-section');
const adminOrdersSection = document.getElementById('admin-orders-section');
const adminUserSection = document.getElementById('admin-user-section');
const contentListContainer = document.getElementById('content-list');
const mainContentTitle = document.getElementById('main-content-title');
// Header Navigasyon Elementleri
const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const userInfoDiv = document.getElementById('user-info');
const userWelcomeMessageSpan = document.getElementById('user-welcome-message');
const showProfileBtn = document.getElementById('show-profile-btn');
const showBasketBtn = document.getElementById('show-basket-btn');
const basketItemCountSpan = document.getElementById('basket-item-count');
const showMyOrdersBtn = document.getElementById('show-my-orders-btn');
const showAdminOrdersBtn = document.getElementById('show-admin-orders-btn');
const showProductMgmtBtn = document.getElementById('show-product-mgmt-btn');
const showCategoryMgmtBtn = document.getElementById('show-category-mgmt-btn');
const showUserMgmtBtn = document.getElementById('show-user-mgmt-btn');
const logoutBtn = document.getElementById('logout-btn');
const homeLink = document.getElementById('home-link');
// Geri Dönüş Linkleri
const backToHomeLinks = document.querySelectorAll('.back-to-home');

// --- Merkezi UI Yönetim Fonksiyonları ---

/**
 * Belirtilen bölüm dışındaki tüm ana bölümleri gizler.
 * @param {HTMLElement | null} activeSectionElement Gösterilecek olan bölüm veya null (hepsini gizlemek için).
 */
function hideOtherSections(activeSectionElement) {
    console.log("[app.js] hideOtherSections called for:", activeSectionElement?.id || 'null');
    const sections = [
        mainContent, authFormsSection, profileSection, basketSection,
        orderHistorySection, adminCategorySection, adminProductSection,
        adminOrdersSection, adminUserSection
    ];
    sections.forEach(section => {
        if (section) {
            if (section === activeSectionElement) {
                section.classList.remove('hidden');
                // Ana içeriği gösteriyorsak, içindeki spinner'ı temizle (ihtiyaç halinde)
                if (section === mainContent && contentListContainer && contentListContainer.innerHTML.includes('spinner')) {
                }
            } else {
                section.classList.add('hidden');
            }
        } else {
            console.warn("[app.js] hideOtherSections: A section element is potentially missing in the DOM.");
        }
    });
}
// Global erişim için window objesine ata
window.hideOtherSections = hideOtherSections;

function updateUIState() {
    console.log("[app.js] Updating UI state...");
    const token = getToken();
    const userInfo = getUserInfo();
    const userIsAdmin = isAdmin();

    // Element varlık kontrolü
    const elementsToCheck = [showLoginBtn, showRegisterBtn, userInfoDiv, userWelcomeMessageSpan, showProfileBtn, showBasketBtn, basketItemCountSpan, showMyOrdersBtn, showAdminOrdersBtn, showProductMgmtBtn, showCategoryMgmtBtn, showUserMgmtBtn, logoutBtn];
    if (elementsToCheck.some(el => !el)) {
        console.error("UI Update Error: One or more critical navigation elements are missing!");
        return; // Güncelleme yapılamaz
    }

    if (token && userInfo && userInfo.firstName) {
        // Kullanıcı Giriş Yapmış
        showLoginBtn.classList.add('hidden');
        showRegisterBtn.classList.add('hidden');
        userInfoDiv.classList.remove('hidden');
        authFormsSection?.classList.add('hidden'); // Auth formunu gizle

        userWelcomeMessageSpan.innerHTML = `Hoş Geldin, ${escapeHtml(userInfo.firstName)}! ${userIsAdmin ? '<span class="user-role">(Admin)</span>' : ''}`;
        showProfileBtn.classList.remove('hidden');
        showBasketBtn.classList.remove('hidden');
        showMyOrdersBtn.classList.remove('hidden'); // Müşteri ve Admin

        // Admin Butonları
        showAdminOrdersBtn.classList.toggle('hidden', !userIsAdmin);
        showProductMgmtBtn.classList.toggle('hidden', !userIsAdmin);
        showCategoryMgmtBtn.classList.toggle('hidden', !userIsAdmin);
        showUserMgmtBtn.classList.toggle('hidden', !userIsAdmin);

        updateBasketCountUI(); // Sepet sayacını güncelle (giriş yapınca önemlidir)
    } else {
        // Kullanıcı Giriş Yapmamış
        showLoginBtn.classList.remove('hidden');
        showRegisterBtn.classList.remove('hidden');
        userInfoDiv.classList.add('hidden');
        showProfileBtn.classList.add('hidden');
        showBasketBtn.classList.add('hidden');
        if (basketItemCountSpan) basketItemCountSpan.textContent = '0';
        showMyOrdersBtn.classList.add('hidden');
        showAdminOrdersBtn.classList.add('hidden');
        showProductMgmtBtn.classList.add('hidden');
        showCategoryMgmtBtn.classList.add('hidden');
        showUserMgmtBtn.classList.add('hidden');

        // Çıkış yapıldığında veya token yoksa admin bölümlerini gizle
        adminCategorySection?.classList.add('hidden');
        adminProductSection?.classList.add('hidden');
        adminOrdersSection?.classList.add('hidden');
        adminUserSection?.classList.add('hidden');
        profileSection?.classList.add('hidden');
        basketSection?.classList.add('hidden');
        orderHistorySection?.classList.add('hidden');
        // Eğer çıkış yapıldığında auth formu görünmüyorsa, ana sayfayı göster
        if (mainContent && authFormsSection?.classList.contains('hidden')) {
            mainContent.classList.remove('hidden');
        }
    }
}

/**
 * Yetkisiz erişim veya token süresi dolduğunda çağrılacak merkezi fonksiyon.
 */
function handleUnauthorizedCentral() {
    console.warn("[app.js] Central Unauthorized Handler Triggered!");
    const currentAuthVisible = !(authFormsSection?.classList.contains('hidden'));
    removeToken(); // Token ve kullanıcı bilgisini sil
    updateUIState(); // UI'ı güncelle (giriş/kayıt butonlarını göster)

    // Sadece zaten login ekranında DEĞİLSE login ekranını göster ve mesaj ver.
    if (!currentAuthVisible) {
        if (authModule && typeof authModule.showLoginForm === 'function') {
            authModule.showLoginForm(); // auth.js içinden formu göster
            // Mesajı da auth.js göstersin veya buradan gösterelim
            const authMsgDiv = document.getElementById('auth-message');
            if (authMsgDiv) {
                displayMessage(authMsgDiv, "Oturumunuz sonlanmış veya yetkiniz yok. Lütfen tekrar giriş yapın.", true, 0); // Süresiz hata
            }
        } else {
            console.error("Auth module or showLoginForm function not available!");
            // Fallback
            hideOtherSections(authFormsSection);
            document.getElementById('login-form-container')?.classList.remove('hidden');
            document.getElementById('register-form-container')?.classList.add('hidden');
        }
    } else {
        // Zaten login/register ekranındaysa, sadece hata mesajını güncelleyebiliriz.
        const authMsgDiv = document.getElementById('auth-message');
        if (authMsgDiv) {
            displayMessage(authMsgDiv, "Giriş başarısız veya yetkiniz yok.", true, 0);
        }
    }
}


/**
 * Ana Sayfayı (Kategoriler) gösterir.
 */
function showHomeSection() {
    console.log("[app.js] Showing Home Section (Categories)");
    hideOtherSections(mainContent);
    // Kategori kartlarını yüklemek için category.js'deki fonksiyonu çağır
    if (typeof displayCategoriesForHome === 'function') {
        displayCategoriesForHome(); // Bu fonksiyon kendi içinde başlığı vs. ayarlar ve yüklemeyi yapar
    } else {
        console.error("displayCategoriesForHome function not found in category.js!");
        if (contentListContainer) contentListContainer.innerHTML = '<p style="color:red;">Kategoriler yüklenemedi.</p>';
        if (mainContentTitle) mainContentTitle.textContent = 'Hata';
    }
    // Formlardaki veya diğer bölümlerdeki mesajları temizle (isteğe bağlı)
    clearMessage(document.getElementById('auth-message'));
    clearMessage(document.getElementById('basket-message'));
    clearMessage(document.getElementById('category-form-message'));
    clearMessage(document.getElementById('category-list-message'));
    clearMessage(document.getElementById('product-form-message'));
    clearMessage(document.getElementById('product-list-message'));
    clearMessage(document.getElementById('user-list-message'));
}

/**
 * Profil Sayfasını gösterir.
 */
function showProfilePage() {
    console.log("[app.js] Showing Profile Page");
    if (!profileSection) { console.error("Profile section element not found!"); return; }
    const userInfo = getUserInfo();
    if (!userInfo) { handleUnauthorizedCentral(); return; }

    hideOtherSections(profileSection); // Profil bölümünü göster

    // Elementleri seç
    const profileIdEl = profileSection.querySelector('#profile-id');
    const firstNameEl = profileSection.querySelector('#profile-firstname');
    const lastNameEl = profileSection.querySelector('#profile-lastname');
    const emailEl = profileSection.querySelector('#profile-email');
    const phoneEl = profileSection.querySelector('#profile-phone');
    const addressEl = profileSection.querySelector('#profile-address');
    const userTypeEl = profileSection.querySelector('#profile-usertype');
    const profileMessageDiv = document.getElementById('profile-message'); // Profile özel mesaj alanı

    // Bilgileri doldur (varlık kontrolü ile)
    if (profileIdEl) profileIdEl.textContent = userInfo.id ?? '-';
    if (firstNameEl) firstNameEl.textContent = escapeHtml(userInfo.firstName ?? '-');
    if (lastNameEl) lastNameEl.textContent = escapeHtml(userInfo.lastName ?? '-');
    if (emailEl) emailEl.textContent = escapeHtml(userInfo.email ?? '-');
    if (phoneEl) phoneEl.textContent = escapeHtml(userInfo.phoneNumber ?? 'Belirtilmemiş');
    if (addressEl) addressEl.textContent = escapeHtml(userInfo.address ?? 'Belirtilmemiş');
    if (userTypeEl) userTypeEl.textContent = UserTypeText[userInfo.userType] ?? 'Bilinmiyor';
    if (profileMessageDiv) clearMessage(profileMessageDiv); // Mesaj alanını temizle
}

// --- Modül Başlatma ve Bağlantıları Kurma ---
console.log("Initializing modules...");
// Initialize fonksiyonları ilgili modülün public fonksiyonlarını döndürür
const authModule = initializeAuth(updateUIState, showHomeSection);
const basketModule = initializeBasket(handleUnauthorizedCentral, showHomeSection); // showBasket export edilmeli
const categoryAdminModule = initializeCategoryAdmin(handleUnauthorizedCentral, (categories) => {
    // Kategori güncellendiğinde ürün adminindeki dropdown'ı güncelle
    if (typeof populateProductCategoryDropdown === 'function') {
        populateProductCategoryDropdown(categories);
    }
});
// Kategori modülü, ürünleri getirmek için product modülündeki callback'i kullanır
setFetchProductsCallback(fetchProductsForCategory);
const productAdminModule = initializeProductAdmin(handleUnauthorizedCentral, fetchCategoriesForDropdown); // product.js, kategorileri çekmek için category.js'i kullanır
// Ürün modülü, sepete eklemede login gerekirse auth modülünü kullanır
setProductLoginCallback(authModule.showLoginForm);
// Order ve User modüllerini başlat
const orderAdminModule = initializeOrderAdmin(handleUnauthorizedCentral);
const userAdminModule = initializeUserAdmin(handleUnauthorizedCentral);
console.log("Modules initialized.");

// --- Genel Olay Dinleyicileri Ayarlama ---
function setupEventListeners() {
    console.log("Setting up global event listeners...");

    // Login/Register Butonları ve Geçiş Linkleri
    if (showLoginBtn) showLoginBtn.addEventListener('click', authModule.showLoginForm);
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', authModule.showRegisterForm);
    const switchToRegisterLink = document.getElementById('switch-to-register');
    const switchToLoginLink = document.getElementById('switch-to-login');
    if (switchToRegisterLink) switchToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); authModule.showRegisterForm(); });
    if (switchToLoginLink) switchToLoginLink.addEventListener('click', (e) => { e.preventDefault(); authModule.showLoginForm(); });

    // Logout Butonu
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        console.log("Logout clicked");
        removeToken();
        updateUIState();
        showHomeSection(); // Çıkış yapınca ana sayfaya dön
    });

    // Profil Butonu
    if (showProfileBtn) showProfileBtn.addEventListener('click', showProfilePage);

    // Sepetim Butonu
    if (showBasketBtn) showBasketBtn.addEventListener('click', basketModule.showBasket); // basket.js'den gelen fonksiyonu çağır

    // Siparişlerim Butonu
    if (showMyOrdersBtn) {
        showMyOrdersBtn.addEventListener('click', showOrderHistory); // order.js'den import edilen fonksiyonu çağır
        console.log("My Orders button listener attached correctly."); // EKLENDİ
    } else {
        console.warn("My Orders button (#show-my-orders-btn) not found!");
    }

    // Admin Butonları (Modüllerin döndürdüğü fonksiyonları çağırır)
    if (showAdminOrdersBtn) showAdminOrdersBtn.addEventListener('click', orderAdminModule.showAdminOrderSection);
    if (showProductMgmtBtn) showProductMgmtBtn.addEventListener('click', productAdminModule.showAdminProductSection);
    if (showCategoryMgmtBtn) showCategoryMgmtBtn.addEventListener('click', categoryAdminModule.showAdminCategorySection);
    if (showUserMgmtBtn) showUserMgmtBtn.addEventListener('click', userAdminModule.showAdminUserSection);

    // Ana Sayfa Linki (Logo/Başlık)
    if (homeLink) homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHomeSection();
    });

    // Geri Dönüş Linkleri (".back-to-home")
    backToHomeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showHomeSection();
        });
    });

    console.log("Global event listeners set up complete.");
}


// --- Uygulama Başlangıç Noktası ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing UI and setting listeners...");

    // Modül başlatma ve callback ayarlama İLK YAPILMALI
    // -> Yukarı taşındı

    setupEventListeners(); // Olay dinleyicilerini AYARLA
    updateUIState();      // Mevcut token durumuna göre UI'ı ilk kez GÜNCELLE

    // Başlangıçta gösterilecek bölüm
    // Token yoksa veya auth formu zaten görünür değilse ana sayfayı göster
    const tokenExists = !!getToken();
    const authIsVisible = !(authFormsSection?.classList.contains('hidden'));

    if (tokenExists && !authIsVisible) {
        showHomeSection(); // Giriş yapmışsa ve auth gizliyse Ana Sayfa
    } else if (!tokenExists && authIsVisible) {
        // Zaten auth formundaysa bir şey yapma (login/register görünür)
    } else if (!tokenExists && !authIsVisible) {
        // Token yok ve auth gizliyse, Ana sayfayı göstermek yerine login gösterelim mi?
        showHomeSection(); // Şimdilik yine Ana Sayfa
        // Veya: authModule.showLoginForm(); // Direkt login göster
    } else { // Token var ama auth formu görünürse (bu durum olmamalı ama varsa)
        showHomeSection();
    }

    console.log("Application initialization complete.");
});