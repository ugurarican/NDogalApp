import { API_BASE_URL, makeApiRequest } from './api.js';
import { getToken, saveToken, removeToken, saveUserInfo, getUserInfo } from './uiHelpers.js';
import { displayMessage, clearMessage, disableButtons, enableButtons, showButtonLoading, hideButtonLoading } from './uiHelpers.js';

// --- DOM Elementleri ---
const authFormsSection = document.getElementById('auth-forms');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessageDiv = document.getElementById('auth-message');
const switchToRegisterLink = document.getElementById('switch-to-register');
const switchToLoginLink = document.getElementById('switch-to-login');

let _updateUICallback = () => { console.error("Auth Module: updateUICallback not set."); };
let _showHomeCallback = () => { console.error("Auth Module: showHomeCallback not set."); };

// --- Yardımcı Fonksiyonlar ---
function displayAuthMessage(msg, isErr = false, duration = 5000) { displayMessage(authMessageDiv, msg, isErr, duration); }
function clearAuthMessage() { clearMessage(authMessageDiv); }

function showAuthSectionAndHideOthers() {
    if (window.hideOtherSections && typeof window.hideOtherSections === 'function') {
        window.hideOtherSections(authFormsSection);
    } else {
        console.error("hideOtherSections global function not found!");
        if (authFormsSection) authFormsSection.classList.remove('hidden');
        document.getElementById('main-content')?.classList.add('hidden');
        document.getElementById('profile-section')?.classList.add('hidden');
        document.getElementById('basket-section')?.classList.add('hidden');
    }
}

// --- Public Fonksiyonlar ---

export function showLoginForm() {
    console.log("auth.js: showLoginForm() called");
    if (!authFormsSection || !loginFormContainer || !registerFormContainer || !loginForm) { console.error("showLoginForm: Auth DOM elements not found!"); return; }
    clearAuthMessage();
    showAuthSectionAndHideOthers();
    loginFormContainer.classList.remove('hidden');
    registerFormContainer.classList.add('hidden');
    loginForm.reset();
    loginForm.querySelector('#login-email')?.focus();
}

export function showRegisterForm() {
    console.log("auth.js: showRegisterForm() called");
    if (!authFormsSection || !loginFormContainer || !registerFormContainer || !registerForm) { console.error("showRegisterForm: Auth DOM elements not found!"); return; }
    clearAuthMessage();
    showAuthSectionAndHideOthers();
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    registerForm.reset();
    registerForm.querySelector('#register-firstname')?.focus(); 
}

export function handleUnauthorized() {
    console.warn("Auth Module: Handling Unauthorized Access."); removeToken(); _updateUICallback(); showLoginForm(); displayAuthMessage("Oturumunuz sonlanmış. Tekrar giriş yapın.", true, 0);
}

// --- Olay Yöneticileri ---

async function handleLoginSubmit(event) {
    event.preventDefault();
    console.log("Login Form Submitted");
    clearAuthMessage();

    const emailInput = loginForm.querySelector('#login-email');
    const passwordInput = loginForm.querySelector('#login-password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (!emailInput || !passwordInput || !submitButton) {
        console.error("handleLoginSubmit: Login form email, password, or submit button not found!");
        displayAuthMessage("Giriş formu öğelerinde bir hata var.", true);
        return;
    }
    console.log("Submit button found:", submitButton);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { displayAuthMessage("Geçerli e-posta ve şifre giriniz.", true); return; }

    showButtonLoading(submitButton, "Giriş Yapılıyor...");

    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/auth/login`, 'POST', { email, password });
        console.log('Login API Response:', result);
        if (result.success && result.data?.token && result.data?.user) {
            console.log("Login successful."); saveToken(result.data.token); saveUserInfo(result.data.user); _updateUICallback(); _showHomeCallback(); loginForm.reset();
        } else {
            console.warn("Login failed:", result.error); displayAuthMessage(result.error || 'Giriş başarısız.', true, 0); removeToken(); _updateUICallback();
        }
    } catch (error) {
        console.error("Login Error:", error); displayAuthMessage(`Giriş hatası: ${error.message}`, true, 0); removeToken(); _updateUICallback();
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleRegisterSubmit(event) { 
    event.preventDefault(); console.log("Register Form Submitted"); clearAuthMessage(); const submitButton = registerForm.querySelector('button[type="submit"]'); const formData = { firstName: registerForm.querySelector('#register-firstname')?.value.trim(), lastName: registerForm.querySelector('#register-lastname')?.value.trim(), email: registerForm.querySelector('#register-email')?.value.trim(), password: registerForm.querySelector('#register-password')?.value, phoneNumber: registerForm.querySelector('#register-phone')?.value.trim() || null, address: registerForm.querySelector('#register-address')?.value.trim() || null }; let validationError = ""; if (!formData.firstName) validationError += "Ad?\n"; if (!formData.lastName) validationError += "Soyad?\n"; if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) validationError += "Email?\n"; if (!formData.password || formData.password.length < 6) validationError += "Şifre(min 6)?\n"; if (validationError) { displayAuthMessage(validationError.trim(), true, 0); return; } if (!submitButton) { console.error("Register submit button missing!"); return; } showButtonLoading(submitButton, "Kaydediliyor..."); try { const result = await makeApiRequest(`${API_BASE_URL}/api/auth/register`, 'POST', formData); console.log('Register API Response:', result); if (result.success) { displayAuthMessage(result.data?.message || 'Kayıt başarılı.', false, 8000); showLoginForm(); registerForm.reset(); } else { displayAuthMessage(`Kayıt hatası: ${result.error || 'Bilinmeyen'}`, true, 0); } } catch (error) { console.error("Register Error:", error); displayAuthMessage(`Kayıt hatası: ${error.message}`, true, 0); } finally { hideButtonLoading(submitButton); }
}

export function initializeAuth(updateUICb, showHomeCb) {
    console.log("Initializing Auth Module...");
    _updateUICallback = updateUICb;
    _showHomeCallback = showHomeCb;

    if (!window.hideOtherSections || typeof window.hideOtherSections !== 'function') {
        console.error("!!! Global 'hideOtherSections' function is not available. Auth forms might not hide other sections correctly. Check app.js import order or global function definition. !!!");
    }

    if (loginForm) { loginForm.addEventListener('submit', handleLoginSubmit); console.log("Login form listener added."); }
    else { console.error("Login form (#login-form) not found!"); }
    if (registerForm) { registerForm.addEventListener('submit', handleRegisterSubmit); console.log("Register form listener added."); }
    else { console.error("Register form (#register-form) not found!"); }
    if (switchToRegisterLink) { switchToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); }); console.log("SwitchToRegister listener added."); }
    else { console.warn("Switch to register link (#switch-to-register) not found!"); }
    if (switchToLoginLink) { switchToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); }); console.log("SwitchToLogin listener added."); }
    else { console.warn("Switch to login link (#switch-to-login) not found!"); }
    console.log("Auth Module Initialized.");
    return { showLoginForm, showRegisterForm, handleUnauthorized };
}