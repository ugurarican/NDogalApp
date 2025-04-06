import { API_BASE_URL, makeApiRequest } from './api.js';
import {
    getToken, isAdmin, OrderStatusEnum, OrderStatusText, AdminAvailableActions, escapeHtml,
    disableButtons, enableButtons, displayMessage, clearMessage, showLoadingOverlay,
    hideLoadingOverlay, showButtonLoading, hideButtonLoading
} from './uiHelpers.js';

// --- DOM Elementleri ---
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryListDiv = document.getElementById('order-history-list');
const adminOrdersSection = document.getElementById('admin-orders-section');
const adminOrderListDiv = document.getElementById('admin-order-list');
const adminOrderStatusFilter = document.getElementById('admin-order-status-filter');
const adminFilterOrdersBtn = document.getElementById('admin-filter-orders-btn');
const adminOrderTable = document.getElementById('admin-order-table');
const adminOrderTableBody = adminOrderTable?.tBodies[0]; // tbody'yi direkt al
// --- Partial Ship Modal Elementleri ---
const partialShipModal = document.getElementById('partialShipModal');
const partialShipForm = document.getElementById('partialShipForm');
const partialShipOrderIdInput = document.getElementById('partialShipOrderId'); // Hidden input
const partialShipOrderIdSpan = document.getElementById('partialShipOrderIdSpan');
const partialShipItemsTbody = document.getElementById('partialShipItemsTbody');
const partialShipNotesInput = document.getElementById('partialShipNotesInput');
const partialShipFormMessage = document.getElementById('partialShipFormMessage');
const partialShipSubmitBtn = document.getElementById('partialShipSubmitBtn');
const closePartialModalBtns = document.querySelectorAll('#partialShipModal .close-modal-btn, #partialShipCancelBtn');

let _handleUnauthorizedCallback = () => { console.error("Order Module: Unauthorized callback has not been set!"); };

// --- Müşteri Sipariş Geçmişi Fonksiyonları ---

async function fetchMyOrdersInternal() {
    console.log('[order.js] fetchMyOrdersInternal - Starting fetch...');
    if (!orderHistoryListDiv || !orderHistorySection) { console.error("Order History DOM not found."); return null; }
    showLoadingOverlay(orderHistoryListDiv, 'Siparişler Yükleniyor...');
    orderHistoryListDiv.innerHTML = ''; let ordersData = null; const token = getToken();
    if (!token) { hideLoadingOverlay(orderHistoryListDiv); orderHistoryListDiv.innerHTML = '<p style="color:red;">Giriş yapmalısınız.</p>'; return null; }
    try {
        const result = await makeApiRequest(`${API_BASE_URL}/api/orders/my`, 'GET', null, token);
        if (result.success && Array.isArray(result.data)) { ordersData = result.data; }
        else if (result.status === 401 || result.status === 403) { _handleUnauthorizedCallback(); ordersData = null; orderHistoryListDiv.innerHTML = '<p style="color:red;">Yetki yok/Oturum sonlanmış.</p>'; }
        else { ordersData = null; orderHistoryListDiv.innerHTML = `<p style="color:red;">Siparişler yüklenemedi: ${escapeHtml(result.error || 'Hata')}</p>`; }
    } catch (e) { ordersData = null; orderHistoryListDiv.innerHTML = `<p style="color:red;">Ağ hatası: ${escapeHtml(e.message)}</p>`; }
    finally { hideLoadingOverlay(orderHistoryListDiv); }
    return ordersData;
}

function displayOrderHistory(orders) {
    if (!orderHistoryListDiv) return;
    orderHistoryListDiv.innerHTML = '';
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        if (!orderHistoryListDiv.innerHTML.includes('red')) { orderHistoryListDiv.innerHTML = '<p>Henüz siparişiniz yok.</p>'; } return;
    }
    const ul = document.createElement('ul'); ul.className = 'order-history-items';
    try {
        orders.forEach((order, index) => {
            if (!order || typeof order !== 'object' || typeof order.id !== 'number') { return; } // Basic check
            const itemsArray = Array.isArray(order.items) ? order.items : [];
            const li = document.createElement('li'); li.className = 'order-history-item'; li.dataset.orderId = order.id;
            const statusText = OrderStatusText[order.status] || `? (${order.status})`;
            const totalAmount = (typeof order.totalAmount === 'number') ? order.totalAmount.toFixed(2) : 'N/A';
            let orderDateFormatted = 'Invalid Date'; try { const d = new Date(order.orderDate); if (!isNaN(d.getTime())) orderDateFormatted = d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { }
            const summaryDiv = document.createElement('div'); summaryDiv.className = 'order-summary'; summaryDiv.innerHTML = `<p><strong>No:</strong> ${order.id}</p><p><strong>Tarih:</strong> ${orderDateFormatted}</p><p><strong>Tutar:</strong> ${totalAmount} TL</p><p><strong>Durum:</strong> <span style="font-weight:bold;">${statusText}</span></p><button class="toggle-details-btn" title="Detay">Detay</button>`;
            const detailsDiv = document.createElement('div'); detailsDiv.className = 'order-details hidden';
            if (itemsArray.length > 0) {
                const itemsUl = document.createElement('ul'); itemsUl.style.cssText = 'list-style:none;padding-left:0;';
                itemsArray.forEach(item => {
                    if (!item || typeof item.id !== 'number') return;
                    const itemLi = document.createElement('li'); itemLi.className = 'order-detail-item'; const q = item.quantity ?? 0; const p = item.price ?? 0; const sq = item.shippedQuantity ?? 0; const pn = escapeHtml(item.productName || '?'); const img = item.productImageUrl || 'https://via.placeholder.com/55x55.png?text=?'; const total = (p * q).toFixed(2); let qInfo = ''; const pending = Math.max(0, q - sq);
                    if (sq > 0 || pending > 0) { const full = pending <= 0; const cls = full ? 'shipment-info-ok' : 'shipment-info'; const txt = `(${sq}G${pending > 0 ? `/${pending}B` : ''})`; const title = full ? 'Tümü Gönderildi' : 'Gönderilen/Bekleyen'; qInfo = ` <span class="${cls}" title="${title}">${txt}</span>`; } // Dikkat: Template literal içinde değil.
                    itemLi.innerHTML = `<img src="${img}" alt="${pn}"><span class="order-item-details">${q}x ${pn} (${p.toFixed(2)} TL)${qInfo} = <strong>${total} TL</strong></span>`; // qInfo buraya eklendi
                    const imgEl = itemLi.querySelector('img'); if (imgEl) { imgEl.onerror = function () { this.onerror = null; this.src = 'https://via.placeholder.com/55x55.png?text=H'; }; imgEl.style.cssText = 'width:55px; height:55px; object-fit:contain; vertical-align:middle; margin-right:8px; border:1px solid #eee; border-radius:3px;'; }
                    itemsUl.appendChild(itemLi);
                }); detailsDiv.appendChild(itemsUl);
            } else { detailsDiv.innerHTML = '<p>Ürün detayı yok.</p>'; }
            if (order.shippingAddress || order.notes) { const extra = document.createElement('div'); extra.style.cssText = 'margin-top:15px;padding-top:15px;border-top:1px dashed #ccc;font-size:0.9em;color:#495057;word-break:break-word;'; if (order.shippingAddress) { extra.innerHTML += `<p><strong>Adres:</strong> ${escapeHtml(order.shippingAddress)}</p>`; } if (order.notes) { extra.innerHTML += `<p><strong>Notlar:</strong></p><pre style="white-space:pre-wrap;word-break:break-word;background-color:#f8f9fa;padding:5px;border:1px solid #eee;border-radius:3px;">${escapeHtml(order.notes)}</pre>`; } detailsDiv.appendChild(extra); }
            li.appendChild(summaryDiv); li.appendChild(detailsDiv); ul.appendChild(li);
            const toggleBtn = li.querySelector('.toggle-details-btn'); if (toggleBtn) { toggleBtn.addEventListener('click', () => { detailsDiv.classList.toggle('hidden'); toggleBtn.textContent = detailsDiv.classList.contains('hidden') ? 'Detay' : 'Gizle'; }); }
        });
        orderHistoryListDiv.appendChild(ul);
    } catch (error) { console.error("[order.js] Error rendering order history:", error); orderHistoryListDiv.innerHTML = '<p style="color:red;">Liste oluşturulurken hata oluştu.</p>'; }
}

export async function showOrderHistory() {
    if (!orderHistorySection) { console.error("History section not found."); return; };
    if (window.hideOtherSections) window.hideOtherSections(orderHistorySection); else orderHistorySection.classList.remove('hidden');
    if (!getToken()) { _handleUnauthorizedCallback(); if (orderHistoryListDiv) orderHistoryListDiv.innerHTML = '<p style="color:red;">Giriş yapın.</p>'; return; }
    const orders = await fetchMyOrdersInternal();
    displayOrderHistory(orders);
}

// --- Admin Sipariş Yönetimi Fonksiyonları ---

async function fetchAllOrdersInternal(statusFilter = '') {
    if (!adminOrderListDiv || !adminOrdersSection) return null;
    const showOverlay = !adminOrdersSection.classList.contains('hidden');
    if (showOverlay) showLoadingOverlay(adminOrderListDiv, 'Siparişler Yükleniyor...'); else adminOrderListDiv.innerHTML = '<p>Yükleniyor...</p>';
    if (adminOrderTable) adminOrderTable.classList.add('hidden');
    let ordersData = null; const token = getToken(); if (!token || !isAdmin()) { if (showOverlay) hideLoadingOverlay(adminOrderListDiv); adminOrderListDiv.innerHTML = '<p style="color:red;">Yetki yok.</p>'; _handleUnauthorizedCallback(); return null; }
    let apiUrl = `${API_BASE_URL}/api/orders`; if (statusFilter) apiUrl += `?status=${statusFilter}`;
    try { const result = await makeApiRequest(apiUrl, 'GET', null, token); if (result.success && Array.isArray(result.data)) { ordersData = result.data; } else if (result.status === 401 || result.status === 403) { _handleUnauthorizedCallback(); ordersData = null; adminOrderListDiv.innerHTML = '<p style="color:red;">Yetki hatası.</p>'; } else { ordersData = null; adminOrderListDiv.innerHTML = `<p style="color:red;">Yüklenemedi: ${escapeHtml(result.error || 'Hata')}</p>`; } } catch (e) { ordersData = null; adminOrderListDiv.innerHTML = `<p style="color:red;">Ağ hatası: ${escapeHtml(e.message)}</p>`; } finally { if (showOverlay) hideLoadingOverlay(adminOrderListDiv); }
    return ordersData;
}

function displayAdminOrders(orders) {
    if (!adminOrderListDiv || !adminOrderTable || !adminOrderTableBody) { console.error("Admin order table/tbody/container not found."); return; }
    adminOrderTableBody.innerHTML = '';
    if (orders === null || !Array.isArray(orders) || orders.length === 0) { if (!adminOrderListDiv.querySelector('p[style*="color:red"]')) adminOrderListDiv.innerHTML = '<p>Filtreye uygun sipariş bulunamadı.</p>'; adminOrderTable.classList.add('hidden'); return; }
    try {
        orders.forEach(order => {
            if (!order || typeof order.id !== 'number') return;
            const itemsArray = Array.isArray(order.items) ? order.items : []; const row = adminOrderTableBody.insertRow(); row.dataset.orderId = order.id; const statusText = OrderStatusText[order.status] || `?(${order.status})`; const totalAmt = (typeof order.totalAmount === 'number') ? order.totalAmount.toFixed(2) : 'N/A'; let dateFmt = '?'; try { const d = new Date(order.orderDate); if (!isNaN(d.getTime())) dateFmt = d.toLocaleString('tr-TR', {/*options*/ }); } catch { }
            row.innerHTML = `<td data-label="Sip. No">${order.id}</td><td data-label="Müşteri">${escapeHtml(order.userFullName || order.userEmail || '-')}</td><td data-label="Tarih">${dateFmt}</td><td data-label="Tutar">${totalAmt} TL</td><td data-label="Durum" class="admin-order-status-cell">${statusText}</td><td data-label="Detay"><button class="admin-toggle-details-btn">👁️</button></td><td class="admin-actions-cell"></td>`;
            const detailRow = adminOrderTableBody.insertRow(); detailRow.className = 'admin-order-details-row hidden'; const detailCell = detailRow.insertCell(); detailCell.colSpan = row.cells.length;
            populateAdminActionCell(row.cells[row.cells.length - 1], order); populateAdminOrderDetailRow(detailCell, order, itemsArray);
            const toggleBtn = row.cells[row.cells.length - 2].querySelector('.admin-toggle-details-btn'); if (toggleBtn) { toggleBtn.addEventListener('click', () => { detailRow.classList.toggle('hidden'); toggleBtn.textContent = detailRow.classList.contains('hidden') ? '👁️' : '🔼'; }); }
        });
        if (!adminOrderListDiv.contains(adminOrderTable)) { adminOrderListDiv.innerHTML = ''; adminOrderListDiv.appendChild(adminOrderTable); } adminOrderTable.classList.remove('hidden');
    } catch (error) { console.error("Error rendering admin orders:", error); adminOrderListDiv.innerHTML = '<p style="color:red">Tablo hatası.</p>'; adminOrderTable.classList.add('hidden'); }
}

function populateAdminActionCell(cellEl, order) {
    if (!cellEl || !order || typeof order.id !== 'number') return;
    cellEl.innerHTML = '-'; // Başlangıçta temizle
    const currentStatus = order.status;
    const terminalStatuses = [OrderStatusEnum.CancelledByAdmin, OrderStatusEnum.CancelledByCustomer, OrderStatusEnum.Completed];
    if (terminalStatuses.includes(currentStatus)) return; // Terminal durumda aksiyon yok

    const container = document.createDocumentFragment(); // Fragment kullanmak daha performanslı olabilir
    let actionsAdded = false;
    const actionContainerStyle = 'display:inline-flex; flex-wrap:wrap; gap:5px; margin-bottom:5px; align-items:center;';

    // 1. Durum Değiştirme
    const availableStatusActions = AdminAvailableActions ? AdminAvailableActions[currentStatus] : null;
    if (availableStatusActions && Object.keys(availableStatusActions).length > 0) {
        const wrapper = document.createElement('div'); wrapper.style.cssText = actionContainerStyle;
        const select = document.createElement('select'); select.className = 'admin-status-select form-control-sm'; select.dataset.orderid = order.id; select.innerHTML = '<option value="">Durum Değiştir...</option>';
        for (const code in availableStatusActions) { const opt = document.createElement('option'); opt.value = code; opt.textContent = availableStatusActions[code]; select.appendChild(opt); }
        const btn = document.createElement('button'); btn.className = 'admin-update-status-btn btn-sm'; btn.dataset.orderid = order.id; btn.textContent = 'Uygula';
        wrapper.appendChild(select); wrapper.appendChild(btn); container.appendChild(wrapper); actionsAdded = true;
    }

    // 2. Kargo Butonları
    const canShip = (currentStatus === OrderStatusEnum.Approved || currentStatus === OrderStatusEnum.PartiallyShipped);
    const itemsArray = Array.isArray(order.items) ? order.items : []; const hasPending = itemsArray.some(i => ((i.quantity ?? 0) - (i.shippedQuantity ?? 0)) > 0);
    if (canShip && hasPending) {
        const wrapper = document.createElement('div'); wrapper.style.cssText = actionContainerStyle;
        if (currentStatus === OrderStatusEnum.Approved) {
            const btnP = document.createElement('button'); btnP.textContent = 'Kısmi G.'; btnP.title = 'Kısmi Gönderim'; btnP.className = 'admin-partial-ship-btn btn-sm'; btnP.dataset.orderid = order.id; wrapper.appendChild(btnP);
            const btnF = document.createElement('button'); btnF.textContent = 'Tümünü G.'; btnF.title = 'Tümünü Kargolandı İşaretle'; btnF.className = 'admin-full-ship-btn btn-sm'; btnF.dataset.orderid = order.id; wrapper.appendChild(btnF); actionsAdded = true;
        } else if (currentStatus === OrderStatusEnum.PartiallyShipped) {
            const btnR = document.createElement('button'); btnR.textContent = 'Kalanı G.'; btnR.title = 'Kalanı Kargolandı İşaretle'; btnR.className = 'admin-ship-remaining-btn btn-sm'; btnR.dataset.orderid = order.id; wrapper.appendChild(btnR); actionsAdded = true;
        }
        if (wrapper.hasChildNodes()) container.appendChild(wrapper);
    }

    if (actionsAdded) { cellEl.innerHTML = ''; cellEl.appendChild(container); } // Sadece aksiyon eklendiyse hücre içeriğini değiştir
    else if (cellEl.innerHTML === '-') { /* Zaten '-' idi, kalsın */ }
    else { cellEl.textContent = '-'; } // Aksi takdirde tire koy
}

function populateAdminOrderDetailRow(cellEl, order, itemsArray = []) {
    // Önceki yanıttaki kod geçerli
    if (!cellEl || !order) return; cellEl.innerHTML = ''; const container = document.createElement('div'); container.className = 'admin-order-detail-content'; if (itemsArray.length > 0) { container.innerHTML += '<h5>Sip. Kalemleri:</h5>'; const ul = document.createElement('ul'); ul.style.cssText = 'list-style:disc; padding-left:20px; margin-bottom: 15px;'; itemsArray.forEach(item => { /*...*/ const li = document.createElement('li'); /*...içerik...*/ ul.appendChild(li); }); container.appendChild(ul); } else { container.innerHTML = '<p>Ürün kalemi yok.</p>'; } if (order.shippingAddress || order.notes) { const extraDiv = document.createElement('div'); /*...*/ container.appendChild(extraDiv); } cellEl.appendChild(container);
}

async function updateOrderStatusByAdmin(orderId, newStatus, adminNotes = null) {
    // Önceki yanıttaki kod geçerli
    const statusInt = parseInt(newStatus); if (isNaN(statusInt) || [3, 7].includes(statusInt)) return false; const token = getToken(); if (!token || !isAdmin()) { _handleUnauthorizedCallback(); return false; } const body = { newStatus: statusInt, adminNotes }; const result = await makeApiRequest(/*...*/); if (!result.success) alert(/*...*/); return result.success;
}

async function markOrderPartiallyShipped(orderId) {
    // Önceki yanıttaki kod geçerli
    if (!partialShipModal) { alert("Modal yok"); return; } resetPartialShipModal(); const modalBody = partialShipModal.querySelector('.modal-body'); if (modalBody) showLoadingOverlay(modalBody); partialShipModal.classList.remove('hidden'); const token = getToken(); if (!token) { _handleUnauthorizedCallback(); closePartialShipModal(); return; } try { const result = await makeApiRequest(/*...*/); if (result.success && result.data) { populatePartialShipModal(result.data); } else {/*...*/ } } catch {/*...*/ } finally { if (modalBody) hideLoadingOverlay(modalBody); }
}

async function shipRemainingOrderItems(orderId) {
    // Önceki yanıttaki kod geçerli
    if (!confirm(/*...*/)) return false; const token = getToken(); if (!token) return false; const notes = prompt(/*...*/); if (notes === null) return false; const body = {/*...*/ }; const result = await makeApiRequest(/*...*/); if (!result.success) alert(/*...*/); else alert(/*...*/); return result.success;
}

async function shipAllOrderItems(orderId) {
    // Önceki yanıttaki kod geçerli
    if (!confirm(/*...*/)) return false; const token = getToken(); if (!token) return false; let itemsToShip = []; try {/* API isteği ile sipariş alınıp itemsToShip doldurulur */ } catch {/*...*/return false; } if (itemsToShip.length === 0) {/*...*/return false; } const notes = prompt(/*...*/); if (notes === null) return false; const body = {/*...*/ }; const result = await makeApiRequest(/*...*/); if (!result.success) alert(/*...*/); else alert(/*...*/); return result.success;
}

function populateStatusFilterDropdown() {
    // Önceki yanıttaki kod geçerli
    if (!adminOrderStatusFilter || adminOrderStatusFilter.options.length > 1) return; adminOrderStatusFilter.innerHTML = '<option value="">Tüm Durumlar</option>'; for (const code in OrderStatusText) { const o = document.createElement('option'); o.value = code; o.textContent = OrderStatusText[code]; adminOrderStatusFilter.appendChild(o); }
}

async function filterAdminOrders() {
    // Önceki yanıttaki kod geçerli
    const status = adminOrderStatusFilter?.value ?? ''; const btn = adminFilterOrdersBtn; if (btn) showButtonLoading(btn, 'Filtreliyor...'); const orders = await fetchAllOrdersInternal(status); displayAdminOrders(orders); if (btn) hideButtonLoading(btn);
}

async function handleAdminOrderAction(event) {
    // Önceki yanıttaki kod geçerli
    const button = event.target.closest('button[class*="admin-"]'); if (!button) return; const orderId = button.dataset.orderid || button.closest('tr')?.dataset.orderId; if (!orderId) return; let success = false; let shouldRefresh = false; const elementsToDisable = button.closest('.admin-actions-cell')?.querySelectorAll('button, select') || [button]; elementsToDisable.forEach(el => el.disabled = true); const originalContent = button.innerHTML; showButtonLoading(button, '...'); try { if (button.classList.contains('admin-update-status-btn')) {/*...*/success = await updateOrderStatusByAdmin(/*...*/); shouldRefresh = success; } else if (button.classList.contains('admin-partial-ship-btn')) { await markOrderPartiallyShipped(orderId); success = true; shouldRefresh = false; }/*...other actions...*/ } catch (err) {/*...*/ } finally { if (!button.classList.contains('admin-partial-ship-btn')) { hideButtonLoading(button, originalContent); elementsToDisable.forEach(el => el.disabled = false); } else { button.disabled = false; } if (shouldRefresh && success) await filterAdminOrders(); }
}

// --- Kısmi Gönderim Modal Fonksiyonları ---
function populatePartialShipModal(order) {
    // Önceki yanıttaki kod geçerli
    if (!partialShipItemsTbody || !order) return; resetPartialShipModal(); if (partialShipOrderIdSpan) partialShipOrderIdSpan.textContent = order.id; if (partialShipOrderIdInput) partialShipOrderIdInput.value = order.id; partialShipItemsTbody.innerHTML = ''; let hasPending = false; order.items?.forEach(item => { const pending = (item.quantity ?? 0) - (item.shippedQuantity ?? 0); if (pending > 0) { hasPending = true; const row = partialShipItemsTbody.insertRow(); row.innerHTML = `<td>${escapeHtml(item.productName || '-')}</td><td>${pending}</td><td><input type="number" class="partial-ship-qty-input form-control-sm" data-order-item-id="${item.id}" data-max-qty="${pending}" min="0" max="${pending}" value="0" required style="width: 80px;"></td>`; } }); if (!hasPending) disableButtons([partialShipSubmitBtn]); else enableButtons([partialShipSubmitBtn]);
}
function resetPartialShipModal() {
    // Önceki yanıttaki kod geçerli
    if (partialShipForm) partialShipForm.reset(); if (partialShipOrderIdSpan) partialShipOrderIdSpan.textContent = '-'; if (partialShipOrderIdInput) partialShipOrderIdInput.value = ''; if (partialShipItemsTbody) partialShipItemsTbody.innerHTML = '<tr><td colspan="3">...</td></tr>'; if (partialShipNotesInput) partialShipNotesInput.value = ''; if (partialShipFormMessage) clearMessage(partialShipFormMessage); if (partialShipSubmitBtn) enableButtons([partialShipSubmitBtn]); const modalBody = partialShipModal?.querySelector('.modal-body'); if (modalBody && modalBody.classList.contains('loading-overlay-container')) hideLoadingOverlay(modalBody);
}
function closePartialShipModal() {
    // Önceki yanıttaki kod geçerli
    if (partialShipModal) partialShipModal.classList.add('hidden'); resetPartialShipModal();
}
async function handlePartialShipSubmit(event) {
    // Önceki yanıttaki kod geçerli
    event.preventDefault(); if (partialShipFormMessage) clearMessage(partialShipFormMessage); const orderId = partialShipOrderIdInput?.value; if (!orderId) return; const token = getToken(); if (!token) return; let shippedItems = []; let validationError = false; let totalQty = 0; partialShipItemsTbody.querySelectorAll('.partial-ship-qty-input').forEach(inp => { const qty = parseInt(inp.value, 10); const max = parseInt(inp.dataset.maxQty, 10); const id = inp.dataset.orderItemId; inp.style.borderColor = ''; if (isNaN(qty) || qty < 0 || qty > max) { inp.style.borderColor = 'red'; validationError = true; } else if (qty > 0) { shippedItems.push({ orderItemId: parseInt(id), quantityToShip: qty }); totalQty += qty; } }); if (validationError) {/*...*/ } if (totalQty === 0) {/*...*/ } const notes = partialShipNotesInput?.value.trim() || null; const body = { shippedItems, adminNotes: notes }; const btns = [partialShipSubmitBtn, ...closePartialModalBtns]; showButtonLoading(partialShipSubmitBtn, 'Kaydediliyor...'); disableButtons(btns); try { const result = await makeApiRequest(/*...*/); if (result.success) { /*...*/ setTimeout(async () => { closePartialShipModal(); await filterAdminOrders(); }, 1500); } else { /*...*/enableButtons(btns); } } catch {/*...*/enableButtons(btns); }
}

// --- Modül Başlatma ---
export function initializeOrderAdmin(unauthorizedCb) {
    console.log("Initializing Order Admin Module...");
    if (typeof unauthorizedCb === 'function') _handleUnauthorizedCallback = unauthorizedCb;
    else console.error("Order Admin Init Error: unauthorizedCb is not a function!");

    if (adminFilterOrdersBtn) adminFilterOrdersBtn.addEventListener('click', filterAdminOrders); else console.warn("Admin filter button not found!");
    if (adminOrderListDiv) adminOrderListDiv.addEventListener('click', handleAdminOrderAction); else console.warn("Admin order list container not found!");
    if (partialShipForm && partialShipModal) { partialShipForm.addEventListener('submit', handlePartialShipSubmit); closePartialModalBtns.forEach(btn => btn?.addEventListener('click', closePartialShipModal)); partialShipModal.addEventListener('click', (event) => { if (event.target === partialShipModal) closePartialShipModal(); }); console.log("Partial ship modal listeners added."); } else console.warn("Partial ship modal elements missing!");
    console.log("Order Admin Module Initialized.");

    async function showAdminOrderSection() {
        if (!adminOrdersSection) return; if (!isAdmin()) { _handleUnauthorizedCallback(); return; }
        if (window.hideOtherSections) window.hideOtherSections(adminOrdersSection); else adminOrdersSection.classList.remove('hidden');
        populateStatusFilterDropdown(); await filterAdminOrders();
    }
    return { showAdminOrderSection };
}