/* Code Bazar user panel. Add your Firebase web app config below. */
const firebaseConfig = {
  apiKey: "AIzaSyClhRCFRg-R4D_OXtMKmyfbIGB2GscUp4c",
  authDomain: "code-bazar-301a9.firebaseapp.com",
  databaseURL: "https://code-bazar-301a9-default-rtdb.firebaseio.com",
  projectId: "code-bazar-301a9",
  storageBucket: "code-bazar-301a9.firebasestorage.app",
  messagingSenderId: "505547793699",
  appId: "1:505547793699:web:7d314ad633a83e17da1896",
  measurementId: "G-BJT5RZMHRK"
};

const $ = (id) => document.getElementById(id);
const state = { products: [], settings: {}, user: null, selectedProduct: null, authMode: 'login', initialized: false };
const placeholderImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g"><stop stop-color="#efedff"/><stop offset="1" stop-color="#dff7f0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="48%" text-anchor="middle" font-family="monospace" font-size="48" font-weight="bold" fill="#635bff">&lt;/&gt;</text><text x="50%" y="62%" text-anchor="middle" font-family="Arial" font-size="18" fill="#514b9d">DIGITAL PRODUCT</text></svg>');
let auth, db;

function showToast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => el.classList.remove('show'), 3500); }
function money(value) { const n = Number(value); return '৳' + (Number.isFinite(n) ? n.toLocaleString('en-BD', { maximumFractionDigits: 2 }) : '0'); }
function safeText(value, fallback='') { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function validHttpUrl(value) { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } }
function openModal(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(id) { $(id).hidden = true; if (![...document.querySelectorAll('.modal-backdrop')].some(el => !el.hidden)) document.body.style.overflow = ''; }
function requireFirebase() { if (!state.initialized || !auth || !db) { showToast('Firebase is not configured yet. Follow SETUP.md first.'); return false; } return true; }
function setupFirebase() {
  if (!window.firebase) { showToast('Firebase SDK could not load. Check your internet connection.'); return; }
  if (firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY' || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
    $('productGrid').innerHTML = '<div class="loading-card"><div class="empty-icon">&lt;/&gt;</div><h3>Connect your Firebase project</h3><p>Add your Firebase web app configuration in script.js. Follow SETUP.md.</p></div>';
    $('productCount').textContent = 'Setup required'; return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth(); db = firebase.database(); state.initialized = true;
    auth.onAuthStateChanged(user => { state.user = user; updateHeader(); });
    db.ref('productsPublic').on('value', snap => { state.products = []; snap.forEach(child => { const p = child.val() || {}; if (p.active !== false) state.products.push({ id: child.key, ...p }); }); renderProducts(); }, error => { console.error(error); showToast('Could not load products. Check Realtime Database rules.'); });
    db.ref('settings/paymentMethods').on('value', snap => { state.settings.paymentMethods = snap.val() || {}; if (!state.settings.paymentMethods || !Object.keys(state.settings.paymentMethods).length) state.settings.paymentMethods = {}; });
    db.ref('settings/store').on('value', snap => { state.settings.store = snap.val() || {}; });
  } catch (e) { console.error(e); showToast('Firebase configuration error. Check script.js.'); }
}
function updateHeader() { $('loginBtn').hidden = !!state.user; $('signupBtn').hidden = !!state.user; $('myOrdersBtn').hidden = !state.user; }
function renderProducts() {
  const query = $('searchInput').value.trim().toLowerCase(); const category = $('categoryFilter').value; const sort = $('sortFilter').value;
  let list = state.products.filter(p => {
    const text = [p.name,p.description,p.category,p.tags].map(x => String(x || '')).join(' ').toLowerCase();
    return (!query || text.includes(query)) && (category === 'all' || p.category === category);
  });
  if (sort === 'low') list.sort((a,b) => Number(a.price||0)-Number(b.price||0));
  if (sort === 'high') list.sort((a,b) => Number(b.price||0)-Number(a.price||0));
  if (sort === 'new') list.sort((a,b) => Number(b.createdAt||0)-Number(a.createdAt||0));
  if (sort === 'featured') list.sort((a,b) => Number(b.featured===true)-Number(a.featured===true));
  $('productCount').textContent = `${list.length} product${list.length===1?'':'s'}`;
  $('emptyState').hidden = list.length > 0;
  if (!list.length) { $('productGrid').innerHTML = ''; return; }
  $('productGrid').innerHTML = list.map(p => {
    const img = validHttpUrl(p.imageUrl) ? escapeHtml(p.imageUrl) : placeholderImage;
    const previewLink = (p.previewUrl && validHttpUrl(p.previewUrl)) ? `<a class="preview-link" href="${escapeHtml(p.previewUrl)}" target="_blank" rel="noopener noreferrer">◉ Live preview ↗</a>` : '';
    return `<article class="product-card"><div class="product-image-wrap">${p.imageUrl && validHttpUrl(p.imageUrl) ? `<img class="product-image" loading="lazy" src="${img}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='${placeholderImage}'">` : `<div class="product-placeholder">&lt;/&gt;</div>`}${p.featured===true?'<span class="product-tag">FEATURED</span>':''}</div><div class="product-body"><div class="product-category">${escapeHtml(safeText(p.category,'Digital product'))}</div><h3 class="product-title">${escapeHtml(safeText(p.name,'Untitled product'))}</h3><p class="product-description">${escapeHtml(safeText(p.description,'Digital resource for your next project.'))}</p>${previewLink}<div class="product-bottom"><div class="price">${money(p.price)}<small>One-time payment</small></div><button class="buy-btn" data-buy="${escapeHtml(p.id)}">View & buy →</button></div></div></article>`;
  }).join('');
}
function setAuthMode(mode) { state.authMode = mode; document.querySelectorAll('[data-auth-mode]').forEach(b => b.classList.toggle('active', b.dataset.authMode===mode)); $('authTitle').textContent = mode === 'login' ? 'Your next project starts here.' : 'Create your Code Bazar account.'; $('authSubtitle').textContent = mode === 'login' ? 'Log in to purchase products and manage your downloads.' : 'Create an account to submit orders and access downloads.'; $('authSubmit').innerHTML = mode === 'login' ? 'Log in <span>→</span>' : 'Create account <span>→</span>'; $('authPassword').autocomplete = mode === 'login' ? 'current-password' : 'new-password'; }
function startCheckout(product) {
  if (!state.user) { state.selectedProduct = product; setAuthMode('login'); openModal('authModal'); showToast('Log in or create an account before checkout.'); return; }
  state.selectedProduct = product;
  const previewBtn = (product.previewUrl && validHttpUrl(product.previewUrl)) ? `<a class="preview-link" style="margin:6px 0 0" href="${escapeHtml(product.previewUrl)}" target="_blank" rel="noopener noreferrer">◉ Live preview ↗</a>` : '';
  $('checkoutProduct').innerHTML = `<div class="checkout-thumb">&lt;/&gt;</div><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category||'Digital product')} · ${money(product.price)}</small>${previewBtn}</div>`;
  const methods = state.settings.paymentMethods || {}; const active = Object.entries(methods).filter(([,m]) => m && m.enabled !== false && m.number);
  $('paymentMethod').innerHTML = active.map(([key,m]) => `<option value="${escapeHtml(key)}">${escapeHtml(m.label || key)} — ${escapeHtml(m.number)}</option>`).join('');
  $('paymentInstructions').innerHTML = active.length ? '<strong>Payment instructions</strong>' + active.map(([key,m]) => `<p><b>${escapeHtml(m.label||key)}:</b> ${escapeHtml(m.number)} ${m.accountType ? '· '+escapeHtml(m.accountType):''}${m.instructions ? '<br>'+escapeHtml(m.instructions):''}</p>`).join('') + '<p>Send the exact amount shown above, then enter your sender number and transaction ID.</p>' : '<strong>Payment method not configured yet.</strong><p>Please contact the store administrator. Do not send money to unverified numbers.</p>';
  $('checkoutForm').reset(); $('submitOrderBtn').disabled = active.length === 0; openModal('checkoutModal');
}
async function submitAuth(event) {
  event.preventDefault(); if (!requireFirebase()) return;
  const email = $('authEmail').value.trim(); const password = $('authPassword').value;
  $('authSubmit').disabled = true;
  try {
    if (state.authMode === 'signup') await auth.createUserWithEmailAndPassword(email,password); else await auth.signInWithEmailAndPassword(email,password);
    closeModal('authModal'); showToast(state.authMode === 'signup' ? 'Account created successfully.' : 'You are now logged in.');
    if (state.selectedProduct) { const p=state.selectedProduct; state.selectedProduct=null; startCheckout(p); }
  } catch(e) { showToast(authError(e)); } finally { $('authSubmit').disabled = false; }
}
function authError(e) { const codes = {'auth/email-already-in-use':'This email already has an account.','auth/invalid-email':'Please enter a valid email address.','auth/weak-password':'Use a password with at least 6 characters.','auth/user-not-found':'No account found. Create an account first.','auth/wrong-password':'Incorrect email or password.','auth/invalid-credential':'Incorrect email or password.','auth/too-many-requests':'Too many attempts. Please try again later.'}; return codes[e.code] || e.message || 'Authentication failed.'; }
async function submitOrder(event) {
  event.preventDefault(); if (!requireFirebase() || !state.user || !state.selectedProduct) return;
  const methodKey = $('paymentMethod').value; const method = (state.settings.paymentMethods||{})[methodKey];
  if (!method || method.enabled === false) { showToast('Select an active payment method.'); return; }
  const transactionId = $('transactionId').value.trim(); const senderNumber = $('senderNumber').value.trim();
  if (transactionId.length < 4 || senderNumber.length < 6) { showToast('Enter a valid sender number and transaction ID.'); return; }
  $('submitOrderBtn').disabled = true;
  try {
    const p = state.selectedProduct; const ref = db.ref('orders').push();
    const order = { userId: state.user.uid, userEmail: state.user.email || '', productId: p.id, productName: safeText(p.name,'Digital product'), amount: Number(p.price)||0, currency: 'BDT', paymentMethod: methodKey, paymentMethodLabel: safeText(method.label,methodKey), senderNumber, transactionId, status: 'pending', createdAt: firebase.database.ServerValue.TIMESTAMP };
    const updates = {}; updates['orders/'+ref.key] = order; updates['ordersByUser/'+state.user.uid+'/'+ref.key] = order; await db.ref().update(updates);
    closeModal('checkoutModal'); state.selectedProduct = null; showToast('Order submitted. Waiting for payment review.'); openOrders();
  } catch(e) { console.error(e); showToast('Could not submit order. Check your connection and database rules.'); } finally { $('submitOrderBtn').disabled = false; }
}
async function openOrders() {
  if (!state.user) { setAuthMode('login'); openModal('authModal'); return; }
  openModal('ordersModal'); $('ordersList').innerHTML = '<div class="loading-card"><span class="spinner"></span><p>Loading your orders…</p></div>';
  try {
    const snap = await db.ref('ordersByUser/'+state.user.uid).once('value'); const orders=[];
    snap.forEach(child => orders.push({id:child.key,...child.val()})); orders.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
    if (!orders.length) { $('ordersList').innerHTML='<div class="empty-state"><div class="empty-icon">◈</div><h3>No orders yet</h3><p>Your purchases will appear here.</p></div>'; return; }
    $('ordersList').innerHTML = orders.map(o => { const status = ['approved','rejected'].includes(o.status) ? o.status : 'pending'; const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recently submitted'; const download = status === 'approved' && validHttpUrl(o.downloadUrl) ? `<a class="download-link" href="${escapeHtml(o.downloadUrl)}" target="_blank" rel="noopener noreferrer">Download product ↗</a>` : ''; const note = o.adminNote ? `<p class="order-meta">Admin note: ${escapeHtml(o.adminNote)}</p>` : ''; return `<article class="order-item"><div class="order-head"><div><strong>${escapeHtml(o.productName||'Digital product')}</strong><div class="order-meta">${money(o.amount)} · ${escapeHtml(date)}<br>Transaction: ${escapeHtml(o.transactionId||'—')}</div></div><span class="status status-${status}">${escapeHtml(status)}</span></div>${note}${download}</article>`; }).join('');
  } catch(e) { console.error(e); $('ordersList').innerHTML='<p class="form-note">Could not load orders. Check Realtime Database rules.</p>'; }
}
function bindEvents() {
  $('year').textContent = new Date().getFullYear();
  $('loginBtn').addEventListener('click',()=>{setAuthMode('login');openModal('authModal');}); $('signupBtn').addEventListener('click',()=>{setAuthMode('signup');openModal('authModal');}); $('myOrdersBtn').addEventListener('click',openOrders);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
  document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));
  $('authForm').addEventListener('submit',submitAuth); $('checkoutForm').addEventListener('submit',submitOrder); $('logoutBtn').addEventListener('click',async()=>{try{await auth.signOut();closeModal('ordersModal');showToast('You have logged out.');}catch(e){showToast('Could not log out.');}});
  ['searchInput','categoryFilter','sortFilter'].forEach(id=>$(id).addEventListener(id==='searchInput'?'input':'change',renderProducts)); $('clearFiltersBtn').addEventListener('click',()=>{$('searchInput').value='';$('categoryFilter').value='all';$('sortFilter').value='featured';renderProducts();});
  $('productGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-buy]');if(!btn)return;const p=state.products.find(x=>x.id===btn.dataset.buy);if(p)startCheckout(p);});
  $('menuBtn').addEventListener('click',()=>{const existing=document.querySelector('.mobile-menu');if(existing){existing.remove();return;}const menu=document.createElement('div');menu.className='mobile-menu';menu.style.cssText='display:flex;position:fixed;top:104px;left:12px;right:12px;z-index:30;padding:18px;background:#fff;border:1px solid #e8e8f1;border-radius:14px;box-shadow:0 15px 40px #17172d20;flex-direction:column;gap:14px;font-size:13px;font-weight:700';menu.innerHTML='<a href="#products">Products</a><a href="#how-it-works">How it works</a><a href="#faq">FAQ</a>';menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.remove()));document.body.appendChild(menu);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m=>closeModal(m.id));});
}
document.addEventListener('DOMContentLoaded',()=>{bindEvents();setupFirebase();});