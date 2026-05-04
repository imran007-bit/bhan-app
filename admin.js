// ============================================
// B HAN — Admin Panel v2
// Easy product add + image upload + dynamic categories + promo banner
// ============================================

let SETTINGS = { ...STORE_DEFAULTS };
let PRODUCTS = [];
let ORDERS = [];
let COUPONS = [];

const A = {
  loggedIn: localStorage.getItem("bhan_admin_session") === "yes",
  loginInput: "",
  loginErr: "",
  tab: "dashboard",
  selectedOrder: null,
  editingProduct: null,
  editingCoupon: null,
  showAddProduct: false,
  toast: null,
  saved: {},
  imgPreview: []
};

// ============================================
// HELPERS
// ============================================
function fmt(n) { return "৳" + Number(n).toLocaleString("en-IN") }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]) }
function dateAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return min + "m ago";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h ago";
  return Math.floor(hr / 24) + "d ago";
}
function genId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2,4) }
function showToast(msg, err) { A.toast = {msg, err:!!err}; render(); setTimeout(() => {A.toast=null; render()}, 2500) }

// ============================================
// ACTIONS
// ============================================
window.AD = {
  setLoginInput(el) { A.loginInput = el.value; A.loginErr = "" },
  doLogin(e) {
    if (e) e.preventDefault();
    if (A.loginInput === ADMIN_PASSWORD) {
      A.loggedIn = true;
      localStorage.setItem("bhan_admin_session", "yes");
      init();
    } else {
      A.loginErr = "Wrong password!";
      render();
    }
  },
  logout() { A.loggedIn = false; localStorage.removeItem("bhan_admin_session"); render() },
  setTab(t) { A.tab = t; render(); window.scrollTo(0,0) },

  // ===== ORDERS =====
  selectOrder(id) { A.selectedOrder = ORDERS.find(o => o.id === id); render() },
  closeOrder() { A.selectedOrder = null; render() },
  async setOrderStatus(status) {
    if (!A.selectedOrder) return;
    A.selectedOrder.status = status;
    await Store.updateOrderStatus(A.selectedOrder.id, status);
    const o = ORDERS.find(x => x.id === A.selectedOrder.id);
    if (o) o.status = status;
    showToast("Status updated: " + status);
    render();
  },

  // ===== PRODUCTS =====
  addProduct() {
    A.editingProduct = {
      id: genId("p"),
      cat: "Skincare",
      name: "",
      brand: "",
      price: 0,
      oldPrice: 0,
      krw: "",
      cost: 0,
      stock: 50,
      rating: 4.8,
      reviews: 0,
      tag: "New",
      featured: false,
      emoji: "✨",
      bg: "#f5f5f7",
      images: [],
      desc: "",
      howTo: "",
      ingredients: [],
      benefits: [],
      variants: ["Default"],
      skinTags: []
    };
    A.showAddProduct = true;
    A.imgPreview = [];
    render();
  },
  editProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    A.editingProduct = JSON.parse(JSON.stringify(p));
    A.showAddProduct = false;
    A.imgPreview = A.editingProduct.images || [];
    render();
  },
  closeEditProduct() { A.editingProduct = null; A.showAddProduct = false; A.imgPreview = []; render() },
  setProductField(field, el) {
    if (!A.editingProduct) return;
    let val = el.value;
    if (["price","oldPrice","cost","stock","reviews"].includes(field)) val = Number(val);
    if (field === "rating") val = parseFloat(val);
    if (field === "featured") val = el.checked;
    if (["ingredients","benefits","variants","skinTags"].includes(field)) val = val.split(",").map(s=>s.trim()).filter(Boolean);
    A.editingProduct[field] = val;

    // Auto-suggest bg color based on category
    if (field === "cat") {
      const bgMap = {Skincare:"#e8f5e8", Sunscreen:"#fff0d0", Makeup:"#ffd0e0", Haircare:"#ffe0c0", Body:"#f0e8ff"};
      if (!A.editingProduct.bg || A.editingProduct.bg === "#f5f5f7") {
        A.editingProduct.bg = bgMap[val] || "#f5f5f7";
      }
    }
  },
  addImageUrl() {
    const input = document.getElementById("imgUrlInput");
    if (!input || !input.value.trim()) return;
    const url = input.value.trim();
    if (!A.editingProduct.images) A.editingProduct.images = [];
    A.editingProduct.images.push(url);
    A.imgPreview = [...A.editingProduct.images];
    input.value = "";
    render();
  },
  removeImage(idx) {
    A.editingProduct.images.splice(idx, 1);
    A.imgPreview = [...A.editingProduct.images];
    render();
  },
  async saveProduct() {
    const p = A.editingProduct;
    if (!p.name || !p.brand || !p.price) { showToast("Name, brand & price required", true); return; }
    await Store.saveProduct(p);
    PRODUCTS = await Store.getProducts();
    A.editingProduct = null;
    A.showAddProduct = false;
    A.imgPreview = [];
    showToast("✓ Product saved!");
    render();
  },
  async deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await Store.deleteProduct(id);
    PRODUCTS = await Store.getProducts();
    showToast("Product deleted");
    render();
  },
  async duplicateProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = genId("p");
    copy.name = copy.name + " (Copy)";
    copy.createdAt = Date.now();
    await Store.saveProduct(copy);
    PRODUCTS = await Store.getProducts();
    showToast("Product duplicated!");
    render();
  },

  // ===== COUPONS =====
  addCoupon() { A.editingCoupon = {id:genId("c"), code:"", type:"percent", discount:10, minOrder:500, active:true}; render() },
  editCoupon(id) { A.editingCoupon = COUPONS.find(c => c.id === id); render() },
  closeCoupon() { A.editingCoupon = null; render() },
  setCouponField(field, el) {
    if (!A.editingCoupon) return;
    let val = el.value;
    if (["discount","minOrder"].includes(field)) val = Number(val);
    if (field === "active") val = el.checked;
    if (field === "code") val = val.toUpperCase();
    A.editingCoupon[field] = val;
  },
  async saveCoupon() {
    const c = A.editingCoupon;
    if (!c.code || !c.discount) { showToast("Code & discount required", true); return; }
    if (!c.id) c.id = c.code;
    await Store.saveCoupon(c);
    COUPONS = await Store.getCoupons();
    A.editingCoupon = null;
    showToast("✓ Coupon saved!");
    render();
  },
  async deleteCoupon(id) {
    if (!confirm("Delete coupon?")) return;
    await Store.deleteCoupon(id);
    COUPONS = await Store.getCoupons();
    showToast("Coupon deleted");
    render();
  },

  // ===== SETTINGS =====
  setSettingsField(field, el) {
    let val = el.value;
    if (["shippingInsideDhaka","shippingOutsideDhaka","freeShippingThreshold"].includes(field)) val = Number(val);
    if (field === "promoBanner") val = el.checked;
    SETTINGS[field] = val;
  },
  setColor(field, color) { SETTINGS[field] = color; render() },
  setCategoryList(el) {
    SETTINGS.categories = el.value.split(",").map(s=>s.trim()).filter(Boolean);
  },
  async saveSettings() {
    await Store.saveSettings(SETTINGS);
    A.saved.settings = true;
    render();
    setTimeout(() => { A.saved.settings = false; render() }, 2500);
    showToast("✓ Settings saved! Customer app updated.");
  }
};

// ============================================
// RENDERERS
// ============================================
function renderLogin() {
  return `<div class="login-pg">
    <form class="login-card" onsubmit="AD.doLogin(event)">
      <div class="login-logo">B</div>
      <div class="login-title">B HAN Admin</div>
      <div class="login-sub">Sign in to manage your store</div>
      ${A.loginErr ? `<div class="login-err">${A.loginErr}</div>` : ""}
      <input type="password" class="login-input" placeholder="Admin Password" oninput="AD.setLoginInput(this)" autofocus/>
      <button type="submit" class="login-btn">Sign In →</button>
      <div style="text-align:center;margin-top:14px;font-size:11px;color:#aaa">Default: bhan2025admin</div>
    </form>
  </div>`;
}

function renderHeader() {
  return `<div class="header">
    <div class="alogo">
      <div class="alogo-mark">B</div>
      <div><div class="alogo-text">B HAN Admin</div><div class="alogo-sub">Store Manager</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="live-badge">${useFirebase?"☁️ Firebase":"📦 Local"} ● LIVE</div>
      <button class="logout-btn" onclick="AD.logout()">Exit</button>
    </div>
  </div>`;
}

function renderTabs() {
  const tabs = [
    {id:"dashboard",icon:"📊",lbl:"Dashboard"},
    {id:"products",icon:"📦",lbl:"Products"},
    {id:"orders",icon:"🛒",lbl:"Orders"},
    {id:"coupons",icon:"🎟️",lbl:"Coupons"},
    {id:"customers",icon:"👥",lbl:"Customers"},
    {id:"settings",icon:"⚙️",lbl:"Settings"}
  ];
  return `<div class="tabs">${tabs.map(t => `<button class="tab ${A.tab===t.id?"on":""}" onclick="AD.setTab('${t.id}')">${t.icon} ${t.lbl}</button>`).join("")}</div>`;
}

async function renderDashboard() {
  const stats = await Store.getStats();
  const recentOrders = ORDERS.slice(0, 5);
  return `<div class="body">
    <div class="sect-hd"><div><div class="sect-title">Dashboard</div><div class="sect-sub">${useFirebase?"Firebase syncing live":"Demo mode — configure Firebase to go live"}</div></div></div>
    <div class="stats">
      ${[
        {icon:"💰",lbl:"REVENUE",val:fmt(stats.totalRevenue),c:"#16a34a",sub:"Delivered orders"},
        {icon:"🛒",lbl:"ORDERS",val:stats.totalOrders,c:"#ff6b9d",sub:stats.pending+" pending"},
        {icon:"📦",lbl:"PRODUCTS",val:stats.totalProducts,c:"#ea580c",sub:stats.lowStock+" low stock"},
        {icon:"👥",lbl:"CUSTOMERS",val:stats.customers,c:"#2563eb",sub:"Unique customers"}
      ].map(s => `<div class="stat" style="border-color:${s.c}"><div class="stat-icon">${s.icon}</div><div class="stat-lbl">${s.lbl}</div><div class="stat-val">${s.val}</div><div class="stat-sub">${s.sub}</div></div>`).join("")}
    </div>
    <div class="card">
      <div class="card-title">📋 Recent Orders</div>
      ${recentOrders.length ? recentOrders.map(o => `
        <div class="order" onclick="AD.selectOrder('${o.id}')">
          <div class="order-hd">
            <div><div class="order-cust">${esc(o.customer.name)}</div><div class="order-id">${o.id}</div></div>
            <span class="status-tag s-${o.status}">${o.status}</span>
          </div>
          <div class="order-ft">
            <span>${o.items.length} items • ${(o.customer.payment||"cod").toUpperCase()}</span>
            <span class="order-total">${fmt(o.total)}</span>
          </div>
        </div>`).join("") :
        `<div class="empty"><div class="empty-icon">📋</div><div class="empty-msg">No orders yet</div></div>`}
    </div>
  </div>`;
}

function renderProducts() {
  return `<div class="body">
    <div class="sect-hd">
      <div><div class="sect-title">Products (${PRODUCTS.length})</div><div class="sect-sub">Click edit to modify</div></div>
      <button class="add-btn" onclick="AD.addProduct()">+ Add</button>
    </div>
    ${PRODUCTS.length ? PRODUCTS.map(p => `
      <div class="prod-card">
        <div class="prod-img" style="background:${p.bg||'#f5f5f7'}">
          ${p.images && p.images.length ? `<img src="${p.images[0]}" alt="" onerror="this.style.display='none'"/>` : `<div style="font-size:24px">${p.emoji||"📦"}</div>`}
        </div>
        <div class="prod-info">
          <div class="prod-name">${esc(p.name)}</div>
          <div class="prod-meta">${esc(p.brand)} • ${p.cat} • Stock: ${p.stock}${p.stock<10?' ⚠️':''}</div>
          <div class="prod-price">${fmt(p.price)}</div>
        </div>
        <div class="prod-actions">
          <button class="prod-edit" onclick="AD.editProduct('${p.id}')">✏️</button>
          <button class="prod-edit" onclick="AD.duplicateProduct('${p.id}')" style="background:#f0fff4">📋</button>
          <button class="prod-del" onclick="AD.deleteProduct('${p.id}')">🗑️</button>
        </div>
      </div>`).join("") :
      `<div class="empty"><div class="empty-icon">📦</div><div class="empty-msg">No products yet</div><div style="margin-top:14px"><button class="add-btn" onclick="AD.addProduct()">+ Add First Product</button></div></div>`}
  </div>`;
}

function renderOrders() {
  return `<div class="body">
    <div class="sect-hd"><div><div class="sect-title">Orders (${ORDERS.length})</div></div></div>
    ${ORDERS.length ? ORDERS.map(o => `
      <div class="order" onclick="AD.selectOrder('${o.id}')">
        <div class="order-hd">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div class="order-cust">${esc(o.customer.name)}</div>
              ${o.uid ? `<span style="font-size:9px;font-weight:800;background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px">✓ MEMBER</span>` : `<span style="font-size:9px;font-weight:800;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px">GUEST</span>`}
            </div>
            <div class="order-id">${o.id}</div>
            ${o.uid ? `<div style="font-size:10px;color:#2563eb;margin-top:1px;word-break:break-all">📧 ${esc(o.userEmail || o.customer?.email || o.uid)}</div>` : ""}
            <div style="font-size:10px;color:#aaa;margin-top:2px">${dateAgo(o.createdAt)}</div>
          </div>
          <span class="status-tag s-${o.status}">${o.status}</span>
        </div>
        <div class="order-ft">
          <span>${o.items.length} items • ${(o.customer.payment||"cod").toUpperCase()} • ${esc(o.customer.phone)}</span>
          <span class="order-total">${fmt(o.total)}</span>
        </div>
      </div>`).join("") :
      `<div class="empty"><div class="empty-icon">🛒</div><div class="empty-msg">No orders yet</div></div>`}
  </div>`;
}

function renderCoupons() {
  return `<div class="body">
    <div class="sect-hd">
      <div><div class="sect-title">Coupons (${COUPONS.length})</div></div>
      <button class="add-btn" onclick="AD.addCoupon()">+ Add</button>
    </div>
    ${COUPONS.map(c => `
      <div class="cpn">
        <div class="cpn-left">
          <div class="cpn-icon">🎟️</div>
          <div>
            <div class="cpn-code">${esc(c.code)}</div>
            <div class="cpn-detail">${c.type==="percent"?c.discount+"%":"৳"+c.discount} off • Min ${fmt(c.minOrder)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="cpn-active ${!c.active?"cpn-inactive":""}">${c.active?"ACTIVE":"OFF"}</span>
          <button class="prod-edit" onclick="AD.editCoupon('${c.id}')">Edit</button>
          <button class="prod-del" onclick="AD.deleteCoupon('${c.id}')">🗑️</button>
        </div>
      </div>`).join("")}
  </div>`;
}

async function renderCustomers() {
  const customers = {};
  ORDERS.forEach(o => {
    const phone = o.customer.phone;
    const email = o.userEmail || o.customer?.email || (o.uid && o.uid.includes("@") ? o.uid : null);
    if (!customers[phone]) customers[phone] = {phone, name:o.customer.name, address:o.customer.address, email:email||null, uid:o.uid||null, orders:0, totalSpent:0, lastOrder:0};
    customers[phone].orders++;
    customers[phone].totalSpent += o.total || 0;
    if (email) customers[phone].email = email;
    if (o.uid) customers[phone].uid = o.uid;
    if (o.createdAt > customers[phone].lastOrder) customers[phone].lastOrder = o.createdAt;
  });
  const list = Object.values(customers).sort((a,b) => b.lastOrder - a.lastOrder);
  const memberCount = list.filter(c => c.uid).length;
  const guestCount = list.length - memberCount;
  return `<div class="body">
    <div class="sect-hd">
      <div>
        <div class="sect-title">Customers (${list.length})</div>
        <div class="sect-sub">✓ ${memberCount} members · ${guestCount} guests</div>
      </div>
    </div>
    ${list.length ? list.map(c => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div style="font-size:14px;font-weight:700">${esc(c.name)}</div>
              ${c.uid ? `<span style="font-size:9px;font-weight:800;background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px">✓ MEMBER</span>` : `<span style="font-size:9px;font-weight:800;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px">GUEST</span>`}
            </div>
            ${c.email ? `<div style="font-size:11px;color:#2563eb;font-weight:600;margin-top:3px;word-break:break-all">📧 ${esc(c.email)}</div>` : ""}
            <div style="font-size:11px;color:#888;margin-top:3px">📞 ${esc(c.phone)}</div>
            <div style="font-size:11px;color:#888">📍 ${esc(c.address||"")}</div>
          </div>
          <div style="text-align:right;margin-left:10px;flex-shrink:0">
            <div style="font-size:16px;font-weight:900;color:#ff3366">${fmt(c.totalSpent)}</div>
            <div style="font-size:11px;color:#888">${c.orders} order${c.orders!==1?"s":""}</div>
            <div style="font-size:10px;color:#aaa">${dateAgo(c.lastOrder)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <a style="flex:1;background:#f5f5f7;padding:9px;border-radius:9px;text-align:center;font-size:12px;font-weight:700;color:#000;text-decoration:none" href="tel:${esc(c.phone)}">📞 Call</a>
          <a style="flex:1;background:#22c55e;padding:9px;border-radius:9px;text-align:center;font-size:12px;font-weight:700;color:#fff;text-decoration:none" href="https://wa.me/${esc(c.phone.replace(/[^0-9]/g,""))}" target="_blank">💬 WhatsApp</a>
        </div>
      </div>`).join("") :
      `<div class="empty"><div class="empty-icon">👥</div><div class="empty-msg">No customers yet</div></div>`}
  </div>`;
}

function renderSettings() {
  const colors = ["#ff6b9d","#c44dff","#3b82f6","#10b981","#f97316","#ef4444","#000000","#8b5cf6"];
  return `<div class="body">
    <div class="sect-hd"><div><div class="sect-title">Settings</div><div class="sect-sub">Changes apply instantly to customer app</div></div></div>

    <div class="form-card">
      <div class="form-title">🏪 Store Info</div>
      <label class="label">Store Name</label>
      <input class="input" value="${esc(SETTINGS.storeName)}" oninput="AD.setSettingsField('storeName',this)"/>
      <label class="label">Tagline</label>
      <input class="input" value="${esc(SETTINGS.tagline)}" oninput="AD.setSettingsField('tagline',this)"/>
      <label class="label">Hero Title</label>
      <textarea class="input textarea" oninput="AD.setSettingsField('heroTitle',this)">${esc(SETTINGS.heroTitle)}</textarea>
      <label class="label">Hero Subtitle</label>
      <textarea class="input textarea" oninput="AD.setSettingsField('heroSubtitle',this)">${esc(SETTINGS.heroSubtitle)}</textarea>
      <label class="label">Hero Offer Text</label>
      <input class="input" value="${esc(SETTINGS.heroOffer)}" oninput="AD.setSettingsField('heroOffer',this)"/>
    </div>

    <div class="form-card">
      <div class="form-title">📂 Categories</div>
      <label class="label">Category Names (comma separated)</label>
      <input class="input" value="${esc((SETTINGS.categories||["Skincare","Sunscreen","Makeup","Haircare","Body"]).join(", "))}" oninput="AD.setCategoryList(this)"/>
      <div style="font-size:11px;color:#888;margin-top:-8px">Example: Skincare, Sunscreen, Makeup, Haircare, Body</div>
    </div>

    <div class="form-card">
      <div class="form-title">📢 Announcement & Promo Banner</div>
      <label class="label">Announcement Bar Text</label>
      <input class="input" value="${esc(SETTINGS.announcement)}" oninput="AD.setSettingsField('announcement',this)"/>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer">
        <input type="checkbox" ${SETTINGS.promoBanner?"checked":""} onchange="AD.setSettingsField('promoBanner',this)" style="width:18px;height:18px"/>
        <span style="font-size:13px;font-weight:700">Show Promo Banner on Homepage</span>
      </label>
      ${SETTINGS.promoBanner ? `
        <label class="label">Banner Title</label>
        <input class="input" value="${esc(SETTINGS.promoTitle||"")}" oninput="AD.setSettingsField('promoTitle',this)" placeholder="FLASH SALE 🔥"/>
        <label class="label">Banner Subtitle</label>
        <input class="input" value="${esc(SETTINGS.promoSub||"")}" oninput="AD.setSettingsField('promoSub',this)" placeholder="Up to 30% off all skincare"/>
        <label class="label">Button Text</label>
        <input class="input" value="${esc(SETTINGS.promoCta||"Shop Now")}" oninput="AD.setSettingsField('promoCta',this)"/>
      ` : ""}
    </div>

    <div class="form-card">
      <div class="form-title">💳 Payment Numbers</div>
      <label class="label">📱 bKash Number</label>
      <input class="input" value="${esc(SETTINGS.bkashNumber)}" oninput="AD.setSettingsField('bkashNumber',this)" placeholder="01712-345678"/>
      <label class="label">🟠 Nagad Number</label>
      <input class="input" value="${esc(SETTINGS.nagadNumber)}" oninput="AD.setSettingsField('nagadNumber',this)" placeholder="01812-345678"/>
      <label class="label">💬 WhatsApp (with country code)</label>
      <input class="input" value="${esc(SETTINGS.whatsappNumber)}" oninput="AD.setSettingsField('whatsappNumber',this)" placeholder="8801712345678"/>
    </div>

    <div class="form-card">
      <div class="form-title">🚚 Shipping</div>
      <div class="row3">
        <div>
          <label class="label">Inside Dhaka (৳)</label>
          <input class="input" type="number" value="${SETTINGS.shippingInsideDhaka}" oninput="AD.setSettingsField('shippingInsideDhaka',this)"/>
        </div>
        <div>
          <label class="label">Outside Dhaka (৳)</label>
          <input class="input" type="number" value="${SETTINGS.shippingOutsideDhaka}" oninput="AD.setSettingsField('shippingOutsideDhaka',this)"/>
        </div>
        <div>
          <label class="label">Free Above (৳)</label>
          <input class="input" type="number" value="${SETTINGS.freeShippingThreshold}" oninput="AD.setSettingsField('freeShippingThreshold',this)"/>
        </div>
      </div>
    </div>

    <div class="form-card">
      <div class="form-title">🎨 Theme Colors</div>
      <label class="label">Primary Color</label>
      <div class="color-picker" style="margin-bottom:14px">
        ${colors.map(c => `<div class="color-opt ${SETTINGS.primaryColor===c?"on":""}" style="background:${c}" onclick="AD.setColor('primaryColor','${c}')"></div>`).join("")}
      </div>
      <label class="label">Accent Color</label>
      <div class="color-picker">
        ${colors.map(c => `<div class="color-opt ${SETTINGS.accentColor===c?"on":""}" style="background:${c}" onclick="AD.setColor('accentColor','${c}')"></div>`).join("")}
      </div>
    </div>

    <button class="save-btn ${A.saved.settings?"ok":""}" onclick="AD.saveSettings()">${A.saved.settings?"✓ Saved!":"💾 Save All Settings"}</button>
    <a href="index.html" target="_blank" style="display:block;text-align:center;margin-top:12px;color:#888;font-size:12px">👁️ View Customer App →</a>
  </div>`;
}

function renderOrderModal() {
  const o = A.selectedOrder; if (!o) return "";
  const isRegistered = !!o.uid;
  return `<div class="overlay" onclick="AD.closeOrder()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-hd">
        <div><div class="modal-title">${o.id}</div><div style="font-size:11px;color:#888">${dateAgo(o.createdAt)}</div></div>
        <button class="modal-close" onclick="AD.closeOrder()">×</button>
      </div>
      <div class="modal-body">

        ${isRegistered ? `
          <div style="background:linear-gradient(135deg,#e0f2fe,#dbeafe);border-radius:10px;padding:11px 13px;margin-bottom:12px;display:flex;align-items:center;gap:10px;border:1.5px solid #93c5fd">
            <div style="font-size:24px">✓</div>
            <div style="flex:1">
              <div style="font-size:11px;font-weight:800;color:#1e40af;letter-spacing:.5px">REGISTERED CUSTOMER</div>
              <div style="font-size:12px;color:#1e3a8a;margin-top:2px;font-weight:600;word-break:break-all">📧 ${esc(o.uid)}</div>
            </div>
          </div>
        ` : `
          <div style="background:#fff7ed;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;gap:10px;border:1.5px solid #fed7aa">
            <div style="font-size:20px">👤</div>
            <div>
              <div style="font-size:11px;font-weight:800;color:#9a3412;letter-spacing:.5px">GUEST CHECKOUT</div>
              <div style="font-size:11px;color:#9a3412;margin-top:1px">No account — ordered without login</div>
            </div>
          </div>
        `}

        <div class="det-customer" style="background:${o.uid?'#dbeafe':'#fef3c7'};border:1.5px solid ${o.uid?'#3b82f6':'#f59e0b'};margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:800;color:${o.uid?'#1e40af':'#92400e'};letter-spacing:.5px">${o.uid?"✓ MEMBER ORDER":"⚠️ GUEST ORDER"}</div>
          </div>
          ${o.uid ? `
            <div class="det-c-row"><strong>📧 Account Email:</strong></div>
            <div style="background:#fff;padding:8px 10px;border-radius:6px;margin-top:4px;word-break:break-all;font-family:monospace;font-size:12px;color:#1e40af">${esc(o.userEmail || o.customer?.email || o.uid)}</div>
            <div style="font-size:10px;color:#1e40af;margin-top:6px">✓ This customer is registered in your store</div>
          ` : `
            <div style="font-size:11px;color:#92400e">This customer ordered without creating an account. Phone number only available.</div>
          `}
        </div>

        <div class="det-customer">
          <div style="font-size:11px;font-weight:800;color:#888;letter-spacing:.5px;margin-bottom:6px">📍 DELIVERY DETAILS</div>
          <div class="det-c-row"><strong>Name:</strong> ${esc(o.customer.name)}</div>
          <div class="det-c-row"><strong>Phone:</strong> ${esc(o.customer.phone)}</div>
          <div class="det-c-row"><strong>Address:</strong> ${esc(o.customer.address)}, ${esc(o.customer.city)} (${o.customer.zone==="inside"?"Inside Dhaka":"Outside Dhaka"})</div>
          <div class="det-c-row"><strong>Payment:</strong> ${(o.customer.payment||"cod").toUpperCase()}</div>
          ${o.customer.note ? `<div class="det-c-row"><strong>Note:</strong> ${esc(o.customer.note)}</div>` : ""}
          <div class="contact-btns">
            <a class="btn-call" href="tel:${esc(o.customer.phone)}">📞 Call</a>
            <a class="btn-wa" href="https://wa.me/${esc(o.customer.phone.replace(/[^0-9]/g,""))}?text=Hi%20${encodeURIComponent(o.customer.name)},%20your%20B%20HAN%20order%20${o.id}" target="_blank">💬 WhatsApp</a>
          </div>
        </div>
        <div style="font-size:11px;font-weight:800;color:#888;letter-spacing:.5px;margin-bottom:8px">UPDATE STATUS</div>
        <div class="status-grid">
          ${["pending","confirmed","processing","shipped","delivered","cancelled"].map(s =>
            `<button class="status-btn ${o.status===s?"on":""}" onclick="AD.setOrderStatus('${s}')">${s}</button>`
          ).join("")}
        </div>
        <div style="font-size:11px;font-weight:800;color:#888;letter-spacing:.5px;margin:14px 0 8px">ITEMS (${o.items.length})</div>
        ${o.items.map(i => `
          <div class="itm">
            <div class="itm-img" style="background:${i.bg||'#f5f5f7'}">
              ${i.image ? `<img src="${i.image}" alt=""/>` : (i.emoji||"📦")}
            </div>
            <div class="itm-info">
              <div class="itm-name">${esc(i.name)}</div>
              <div class="itm-meta">${esc(i.brand)}${i.variant?" • "+esc(i.variant):""} • ${fmt(i.price)} ×${i.qty}</div>
            </div>
            <div class="itm-price">${fmt(i.price*i.qty)}</div>
          </div>`).join("")}
        <div style="margin-top:14px;padding-top:14px;border-top:2px solid #f0f0f0">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:4px"><span>Subtotal</span><span>${fmt(o.subtotal||0)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:4px"><span>Shipping</span><span>${fmt(o.shipping||0)}</span></div>
          ${o.discount ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;margin-bottom:4px"><span>Discount</span><span>-${fmt(o.discount)}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;padding-top:8px;border-top:1px solid #eee"><span>Total</span><span>${fmt(o.total)}</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderProductModal() {
  const p = A.editingProduct; if (!p) return "";
  const isNew = A.showAddProduct;
  const cats = SETTINGS.categories || ["Skincare","Sunscreen","Makeup","Haircare","Body"];

  return `<div class="overlay" onclick="AD.closeEditProduct()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-hd">
        <div class="modal-title">${isNew?"+ Add Product":"✏️ Edit Product"}</div>
        <button class="modal-close" onclick="AD.closeEditProduct()">×</button>
      </div>
      <div class="modal-body">

        <div class="row2">
          <div>
            <label class="label">Product Name *</label>
            <input class="input" value="${esc(p.name)}" oninput="AD.setProductField('name',this)" placeholder="e.g. Snail 96 Essence"/>
          </div>
          <div>
            <label class="label">Brand *</label>
            <input class="input" value="${esc(p.brand)}" oninput="AD.setProductField('brand',this)" placeholder="COSRX"/>
          </div>
        </div>

        <div class="row3">
          <div>
            <label class="label">Category</label>
            <select class="input" onchange="AD.setProductField('cat',this)">
              ${cats.map(c => `<option ${p.cat===c?"selected":""}>${c}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="label">Tag</label>
            <select class="input" onchange="AD.setProductField('tag',this)">
              ${["Viral","Icon","Best Seller","Trending","New","Popular"].map(t => `<option ${p.tag===t?"selected":""}>${t}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="label">Stock</label>
            <input class="input" type="number" value="${p.stock}" oninput="AD.setProductField('stock',this)"/>
          </div>
        </div>

        <div class="row3">
          <div>
            <label class="label">Sale Price (৳) *</label>
            <input class="input" type="number" value="${p.price}" oninput="AD.setProductField('price',this)"/>
          </div>
          <div>
            <label class="label">Old Price (৳)</label>
            <input class="input" type="number" value="${p.oldPrice}" oninput="AD.setProductField('oldPrice',this)"/>
          </div>
          <div>
            <label class="label">Cost Price (৳)</label>
            <input class="input" type="number" value="${p.cost}" oninput="AD.setProductField('cost',this)"/>
          </div>
        </div>

        <div class="row2">
          <div>
            <label class="label">Korean Price (₩)</label>
            <input class="input" value="${esc(p.krw)}" oninput="AD.setProductField('krw',this)" placeholder="22,000"/>
          </div>
          <div>
            <label class="label">Emoji (fallback)</label>
            <input class="input" value="${esc(p.emoji)}" oninput="AD.setProductField('emoji',this)" placeholder="✨"/>
          </div>
        </div>

        <!-- IMAGE UPLOAD SECTION -->
        <label class="label">📸 Product Images</label>
        <div style="background:#fafafa;border:1.5px dashed #eee;border-radius:12px;padding:14px;margin-bottom:10px">
          <div style="font-size:12px;color:#888;margin-bottom:10px">Paste image URL (from Imgur, Google, etc.)</div>
          <div style="display:flex;gap:8px">
            <input id="imgUrlInput" class="input" placeholder="https://i.imgur.com/..." style="margin-bottom:0;flex:1"/>
            <button onclick="AD.addImageUrl()" style="background:var(--grad);color:#fff;padding:0 14px;border-radius:9px;font-size:13px;font-weight:700;white-space:nowrap">Add</button>
          </div>
          ${A.imgPreview.length ? `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
              ${A.imgPreview.map((url,i) => `
                <div style="position:relative;width:64px;height:64px;border-radius:8px;overflow:hidden;background:#f0f0f0">
                  <img src="${url}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'"/>
                  <button onclick="AD.removeImage(${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">×</button>
                </div>`).join("")}
            </div>
          ` : `<div style="text-align:center;color:#ccc;font-size:12px;margin-top:10px">No images added yet</div>`}
          <div style="font-size:11px;color:#aaa;margin-top:8px">💡 <a href="https://imgur.com/upload" target="_blank" style="color:var(--pink)">Upload to Imgur.com</a> → right-click → Copy image address</div>
        </div>

        <label class="label">Description</label>
        <textarea class="input textarea" oninput="AD.setProductField('desc',this)" placeholder="Why is this product amazing...">${esc(p.desc)}</textarea>

        <label class="label">How To Use</label>
        <textarea class="input textarea" oninput="AD.setProductField('howTo',this)" placeholder="Step by step...">${esc(p.howTo)}</textarea>

        <div class="row2">
          <div>
            <label class="label">Ingredients (comma separated)</label>
            <input class="input" value="${esc((p.ingredients||[]).join(", "))}" oninput="AD.setProductField('ingredients',this)" placeholder="Snail Mucin, HA"/>
          </div>
          <div>
            <label class="label">Benefits (comma separated)</label>
            <input class="input" value="${esc((p.benefits||[]).join(", "))}" oninput="AD.setProductField('benefits',this)" placeholder="Repairs skin, Hydrates"/>
          </div>
        </div>

        <label class="label">Variants (comma separated)</label>
        <input class="input" value="${esc((p.variants||[]).join(", "))}" oninput="AD.setProductField('variants',this)" placeholder="50ml, 100ml"/>

        <label class="label">🎯 Skin Tags (for personalized recommendations)</label>
        <input class="input" value="${esc((p.skinTags||[]).join(", "))}" oninput="AD.setProductField('skinTags',this)" placeholder="dry, oily, acne, dark spots"/>
        <div style="font-size:10px;color:#888;margin-top:-8px;margin-bottom:14px;line-height:1.5">
          💡 Available tags: <strong>all, dry, oily, combination, normal, sensitive, acne, spots, melasma, dullness, wrinkles, pores, redness, dryness, makeup, haircare, body</strong>
        </div>

        <div class="row2">
          <div>
            <label class="label">Rating (0-5)</label>
            <input class="input" type="number" step="0.1" min="0" max="5" value="${p.rating}" oninput="AD.setProductField('rating',this)"/>
          </div>
          <div>
            <label class="label">Review Count</label>
            <input class="input" type="number" value="${p.reviews}" oninput="AD.setProductField('reviews',this)"/>
          </div>
        </div>

        <label class="label">Background Color</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
          ${["#fde8f0","#e8f5e8","#f0e8ff","#e0f0ff","#fff0d0","#ffd0d0","#f5e8d0","#f5f5f7"].map(c =>
            `<div style="width:32px;height:32px;border-radius:8px;background:${c};cursor:pointer;border:3px solid ${p.bg===c?"#000":"transparent"}" onclick="A.editingProduct.bg='${c}';AD.setProductField('bg',{value:'${c}'});render()"></div>`
          ).join("")}
        </div>

        <label style="display:flex;align-items:center;gap:8px;margin-bottom:14px;cursor:pointer">
          <input type="checkbox" ${p.featured?"checked":""} onchange="AD.setProductField('featured',this)" style="width:18px;height:18px"/>
          <span style="font-size:13px;font-weight:700">⭐ Featured on Homepage</span>
        </label>

        <button class="save-btn" onclick="AD.saveProduct()">${isNew?"✓ Add Product":"💾 Save Changes"}</button>
      </div>
    </div>
  </div>`;
}

function renderCouponModal() {
  const c = A.editingCoupon; if (!c) return "";
  return `<div class="overlay" onclick="AD.closeCoupon()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-hd">
        <div class="modal-title">🎟️ Coupon</div>
        <button class="modal-close" onclick="AD.closeCoupon()">×</button>
      </div>
      <div class="modal-body">
        <label class="label">Coupon Code</label>
        <input class="input" value="${esc(c.code)}" oninput="AD.setCouponField('code',this)" placeholder="BHAN20" style="text-transform:uppercase"/>
        <div class="row2">
          <div>
            <label class="label">Type</label>
            <select class="input" onchange="AD.setCouponField('type',this)">
              <option value="percent" ${c.type==="percent"?"selected":""}>Percentage</option>
              <option value="amount" ${c.type==="amount"?"selected":""}>Fixed Amount</option>
            </select>
          </div>
          <div>
            <label class="label">${c.type==="percent"?"Discount %":"Discount ৳"}</label>
            <input class="input" type="number" value="${c.discount}" oninput="AD.setCouponField('discount',this)"/>
          </div>
        </div>
        <label class="label">Minimum Order (৳)</label>
        <input class="input" type="number" value="${c.minOrder}" oninput="AD.setCouponField('minOrder',this)"/>
        <label style="display:flex;align-items:center;gap:8px;margin:14px 0;cursor:pointer">
          <input type="checkbox" ${c.active?"checked":""} onchange="AD.setCouponField('active',this)" style="width:18px;height:18px"/>
          <span style="font-size:13px;font-weight:700">✅ Active</span>
        </label>
        <button class="save-btn" onclick="AD.saveCoupon()">💾 Save Coupon</button>
      </div>
    </div>
  </div>`;
}

// ============================================
// MAIN RENDER
// ============================================
async function render() {
  const root = document.getElementById("app");
  if (!A.loggedIn) { root.innerHTML = renderLogin(); return; }

  let html = renderHeader() + renderTabs() + `<div class="app">`;

  if (A.tab === "dashboard") html += await renderDashboard();
  else if (A.tab === "products") html += renderProducts();
  else if (A.tab === "orders") html += renderOrders();
  else if (A.tab === "coupons") html += renderCoupons();
  else if (A.tab === "customers") html += await renderCustomers();
  else if (A.tab === "settings") html += renderSettings();

  html += `</div>`;

  if (A.selectedOrder) html += renderOrderModal();
  if (A.editingProduct) html += renderProductModal();
  if (A.editingCoupon) html += renderCouponModal();
  if (A.toast) html += `<div class="toast ${A.toast.err?"err":""}">${esc(A.toast.msg)}</div>`;

  root.innerHTML = html;
}

// ============================================
// INIT
// ============================================
async function init() {
  if (!A.loggedIn) { render(); return; }
  try {
    SETTINGS = await Store.getSettings();
    PRODUCTS = await Store.getProducts();
    ORDERS = await Store.getOrders();
    COUPONS = await Store.getCoupons();
    render();
  } catch(e) {
    console.error("Init error:", e);
    showToast("Error loading data", true);
  }
}

init();
