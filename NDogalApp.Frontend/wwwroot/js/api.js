export const API_BASE_URL = 'https://localhost:7113';
console.log(`[api.js] API_BASE_URL set to: ${API_BASE_URL}`); 

/**
 * Belirtilen URL'e API isteği yapar.
 * @param {string} url İstek yapılacak tam URL (API_BASE_URL + yol).
 * @param {string} [method='GET'] HTTP metodu (GET, POST, PUT, DELETE, PATCH).
 * @param {object|null} [body=null] İstek gövdesi (POST, PUT, PATCH için).
 * @param {string|null} [token=null] Yetkilendirme için JWT token'ı. Eğer null ise Authorization header eklenmez.
 * @returns {Promise<object>} Başarı durumunu, status kodunu, veriyi veya hatayı içeren bir nesne döner.
 *          { success: boolean, status: number, data?: any, error?: string }
 */
export async function makeApiRequest(url, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
        method: method.toUpperCase(),
        headers: headers,
    };
    if (body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
        try {
            options.body = JSON.stringify(body);
        } catch (e) {
            const errorMsg = `Request body stringify error: ${e.message}`;
            console.error(`[api.js] ${method} ${url}:`, body, e);
            return { success: false, status: -1, error: errorMsg };
        }
    }

    let response;
    const fullUrl = url.trim();
    console.log(`[api.js] -> Requesting: ${options.method} ${fullUrl}`); // İstek log

    try {
        response = await fetch(fullUrl, options);
        console.log(`[api.js] <- Response Status: ${response.status} (${response.statusText}) for ${options.method} ${fullUrl}`); // Yanıt log

        let responseData = null;
        const contentType = response.headers.get("content-type");

        if (response.status !== 204 && contentType) { // 204 değilse ve içerik tipi varsa
            if (contentType.includes("application/json")) {
                try { responseData = await response.json(); } catch (e) {
                    console.warn(`[api.js] JSON parse error (Status ${response.status}) @ ${fullUrl}. Reading as text.`, e);
                    try { const text = await response.text(); responseData = { parseError: true, raw: text || "[Empty Body]" }; } catch { responseData = { parseError: true, raw: "[Cannot Read Body]" }; }
                }
            } else if (contentType.includes("text")) {
                try { responseData = await response.text(); } catch { responseData = "[Cannot Read Text Body]"; }
                console.log(`[api.js] Text response (Status: ${response.status}):`, responseData);
            } else {
                console.warn(`[api.js] Non-JSON/Text content-type: ${contentType}`);
                try { responseData = await response.blob(); } catch {  }
            }
        } 

        if (response.ok) { 
            console.log(`[api.js] Success for ${options.method} ${fullUrl}`);
            return { success: true, status: response.status, data: responseData };
        } else { // 3xx, 4xx, 5xx
            let errorMessage = "Bilinmeyen API hatası.";
            if (responseData) {
                if (typeof responseData === 'string') { errorMessage = responseData; }
                else if (responseData.message) { errorMessage = responseData.message; }
                else if (responseData.title && responseData.status) { errorMessage = responseData.title; /* ... validation errors ... */ }
                else if (responseData.error) { errorMessage = responseData.error; }
                else if (responseData.parseError) { errorMessage = `API yanıtı okunamadı (${response.status}). Ham içerik konsolda olabilir.`; }
            } else { errorMessage = response.statusText || `HTTP Hatası: ${response.status}`; }
            console.error(`[api.js] API Request FAILED (${options.method} ${fullUrl}) - Status ${response.status}:`, errorMessage, responseData);
            return { success: false, status: response.status, error: errorMessage.trim(), data: responseData };
        }
    } catch (error) { // Fetch hatası
        console.error(`[api.js] API Request FETCH/Network Error (${method.toUpperCase()} ${url}): `, error);
        let userFriendlyError = `Ağ Hatası: ${error.message}`;
        if (error instanceof TypeError) {
            if (error.message.toLowerCase().includes('failed to fetch')) { // Tarayıcı standardı hata
                userFriendlyError = `API sunucusuna ulaşılamadı (${url}). Sunucu çalışıyor mu? URL doğru mu? CORS ayarları izin veriyor mu?`;
            } else { userFriendlyError = `İstek oluşturulamadı: ${error.message}`; }
        }
        return { success: false, status: 0, error: userFriendlyError }; // Ağ hataları için status 0
    }
}