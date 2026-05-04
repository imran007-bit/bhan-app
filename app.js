// ============================================
// B HAN — Customer App v2
// All fixes + Login + WhatsApp Alert + Related Products
// ============================================

let SETTINGS = { ...STORE_DEFAULTS };
let PRODUCTS = [];
let COUPONS = [];

const State = {
  view: "home",
  cat: "all",
  search: "",
  cart: JSON.parse(localStorage.getItem("bhan_cart") || "[]"),
  liked: JSON.parse(localStorage.getItem("bhan_liked") || "{}"),

  // Auth
  user: null,
  userProfile: null,
  showAuth: false,
  authMode: "login", // login | register
  authEmail: "",
  authPass: "",
  authName: "",
  authPhone: "",
  authErr: "",
  authLoading: false,

  // Modals
  prod: null,
  imgIdx: 0,
  selVar: null,
  qty: 1,
  showCart: false,
  showCheckout: false,
  orderDone: null,

  // My orders
  myOrders: [],
  showMyOrders: false,

  // Skin Quiz
  skinProfile: null,
  showSkinQuiz: false,
  quizStep: 0,
  quizAnswers: {
    skinType: "",
    skinTone: "",
    concerns: [],
    age: "",
    name: ""
  },
  recommendations: [],

  // Forms
  form: { name:"", phone:"", address:"", city:"Dhaka", zone:"inside", payment:"bkash", note:"" },
  couponInput: "",
  coupon: null,
  trackId: "",
  trackRes: null,

  toast: null,
  added: {}
};

// ============================================
// HELPERS
// ============================================
function fmt(n) { return "৳" + Number(n).toLocaleString("en-IN") }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]) }
function saveCart() { localStorage.setItem("bhan_cart", JSON.stringify(State.cart)) }
function saveLiked() { localStorage.setItem("bhan_liked", JSON.stringify(State.liked)) }
function subtotal() { return State.cart.reduce((s,i) => s + i.price*i.qty, 0) }
function itemCount() { return State.cart.reduce((s,i) => s + i.qty, 0) }
function shipping() {
  const sub = subtotal();
  if (!sub) return 0;
  if (sub >= SETTINGS.freeShippingThreshold) return 0;
  return State.form.zone === "inside" ? SETTINGS.shippingInsideDhaka : SETTINGS.shippingOutsideDhaka;
}
function discount() {
  if (!State.coupon) return 0;
  const sub = subtotal();
  return State.coupon.type === "percent" ? Math.floor(sub * State.coupon.discount / 100) : State.coupon.discount;
}
function total() { return Math.max(0, subtotal() + shipping() - discount()) }
function findP(id) { return PRODUCTS.find(p => p.id === id) }

function showToast(msg, type) {
  State.toast = { msg, type: type || "default" };
  render();
  setTimeout(() => { State.toast = null; render() }, 2500);
}

function applyTheme() {
  const pink = SETTINGS.primaryColor || "#ff6b9d";
  const purple = SETTINGS.accentColor || "#c44dff";
  document.documentElement.style.setProperty("--pink", pink);
  document.documentElement.style.setProperty("--purple", purple);
  document.documentElement.style.setProperty("--grad", `linear-gradient(135deg,${pink},${purple})`);
  const meta = document.querySelector("meta[name=theme-color]");
  if (meta) meta.setAttribute("content", pink);
}

function copyText(txt) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => showToast("Copied: " + txt, "ok"));
  } else {
    showToast("Number: " + txt);
  }
}

// Send WhatsApp notification to admin when order placed
function notifyAdminWhatsApp(order) {
  if (!SETTINGS.whatsappNumber) return;
  const items = order.items.map(i => `${i.name} ×${i.qty}`).join(", ");
  const memberInfo = order.uid ? `\n✓ Member: ${order.userEmail || order.customer?.email || "Yes"}` : `\n⚠️ Guest checkout`;
  const msg = `🛍️ NEW ORDER!\n\nID: ${order.id}\nCustomer: ${order.customer.name}${memberInfo}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.city}\nPayment: ${order.customer.payment.toUpperCase()}\nItems: ${items}\nTotal: ৳${order.total}\n\nPlease confirm ASAP!`;
  const url = `https://wa.me/${SETTINGS.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ============================================
// ACTIONS
// ============================================
window.B = {
  setView(v) {
    State.view = v; State.showCart = false; State.showCheckout = false;
    State.showMyOrders = false;
    render(); window.scrollTo(0,0);
  },
  setCat(c) { State.cat = c; render() },
  setSearch(el) { State.search = el.value; render() },

  // AUTH
  openAuth(mode) { State.showAuth = true; State.authMode = mode || "login"; State.authErr = ""; render() },
  closeAuth() { State.showAuth = false; render() },
  setAuthMode(m) { State.authMode = m; State.authErr = ""; render() },
  setAuthField(f, el) { State[f] = el.value },

  async doAuth() {
    State.authLoading = true; State.authErr = ""; render();
    const email = State.authEmail.trim();
    const pass = State.authPass;
    if (!email || !pass) { State.authErr = "Email & password required"; State.authLoading = false; render(); return; }
    if (pass.length < 6) { State.authErr = "Password must be 6+ characters"; State.authLoading = false; render(); return; }

    const result = await Store.loginWithEmail(email, pass);
    State.authLoading = false;

    if (result.success) {
      State.user = result.user;
      State.showAuth = false;

      // Load profile
      const uid = result.user.uid || result.user.email;
      let profile = await Store.getCustomer(uid);

      if (result.isNew && (State.authName || State.authPhone)) {
        profile = { name: State.authName || "", phone: State.authPhone || "", email, uid };
        await Store.saveCustomer(uid, profile);
      }

      State.userProfile = profile;
      if (profile) {
        State.form.name = profile.name || "";
        State.form.phone = profile.phone || "";
        State.form.address = profile.address || "";
      }

      // Load skin profile
      State.skinProfile = await Store.getSkinProfile(uid);

      showToast(result.isNew ? "Welcome to B HAN! 🌸" : "Welcome back! 😊", "ok");

      // Auto-open quiz for new users
      if (result.isNew && !State.skinProfile) {
        setTimeout(() => window.B.openSkinQuiz(), 800);
      }

      render();
    } else {
      State.authErr = result.error || "Something went wrong";
      render();
    }
  },

  async doLogout() {
    await Store.logout();
    State.user = null; State.userProfile = null;
    State.skinProfile = null;
    showToast("Logged out");
    render();
  },

  // PRODUCTS
  openProd(id) {
    const p = findP(id); if (!p) return;
    State.prod = p; State.imgIdx = 0;
    State.selVar = (p.variants && p.variants[0]) || null;
    State.qty = 1;
    render();
  },
  closeProd() { State.prod = null; render() },
  setImg(i) { State.imgIdx = i; render() },
  nextImg() {
    if (!State.prod) return;
    const len = (State.prod.images && State.prod.images.length) || 1;
    State.imgIdx = (State.imgIdx + 1) % len; render();
  },
  prevImg() {
    if (!State.prod) return;
    const len = (State.prod.images && State.prod.images.length) || 1;
    State.imgIdx = (State.imgIdx - 1 + len) % len; render();
  },
  setVar(v) { State.selVar = v; render() },
  changeQty(d) { State.qty = Math.max(1, State.qty + d); render() },

  toggleLike(id, e) {
    if (e) e.stopPropagation();
    if (State.liked[id]) delete State.liked[id];
    else State.liked[id] = true;
    saveLiked(); render();
  },

  addCart(id, e) {
    if (e) e.stopPropagation();
    const p = findP(id); if (!p) return;
    if (p.stock <= 0) { showToast("Out of stock", "err"); return; }
    const variant = (p.variants && p.variants[0]) || null;
    const key = variant ? p.id + "_" + variant : p.id;
    const ex = State.cart.find(i => i.key === key);
    if (ex) ex.qty++;
    else State.cart.push({ key, id:p.id, name:p.name, brand:p.brand, price:p.price, qty:1, variant, emoji:p.emoji, bg:p.bg, image:(p.images&&p.images[0])||null });
    saveCart();
    State.added[id] = true;
    render();
    setTimeout(() => { State.added[id] = false; render() }, 1500);
    showToast("Added to cart ✓", "ok");
  },

  addFromDetail() {
    const p = State.prod; if (!p) return;
    if (p.stock <= 0) { showToast("Out of stock", "err"); return; }
    const key = State.selVar ? p.id + "_" + State.selVar : p.id;
    const ex = State.cart.find(i => i.key === key);
    if (ex) ex.qty += State.qty;
    else State.cart.push({ key, id:p.id, name:p.name, brand:p.brand, price:p.price, qty:State.qty, variant:State.selVar, emoji:p.emoji, bg:p.bg, image:(p.images&&p.images[0])||null });
    saveCart();
    State.prod = null;
    render();
    showToast("Added to cart ✓", "ok");
  },

  buyNow() { B.addFromDetail(); State.showCart = true; render() },

  updateCartQty(key, d) {
    const i = State.cart.find(x => x.key === key); if (!i) return;
    i.qty = Math.max(1, i.qty + d);
    saveCart(); render();
  },
  removeCartItem(key) {
    State.cart = State.cart.filter(i => i.key !== key);
    saveCart(); render();
  },

  openCart() { State.showCart = true; render() },
  closeCart() { State.showCart = false; render() },
  goCheckout() {
    // Pre-fill from profile
    if (State.userProfile) {
      State.form.name = State.form.name || State.userProfile.name || "";
      State.form.phone = State.form.phone || State.userProfile.phone || "";
      State.form.address = State.form.address || State.userProfile.address || "";
    }
    State.showCheckout = true; State.showCart = false; render();
  },
  backToCart() { State.showCheckout = false; State.showCart = true; render() },

  setField(f, el) { State.form[f] = el.value },
  setZone(z) { State.form.zone = z; render() },
  setPayment(p) { State.form.payment = p; render() },

  setCouponInput(el) { State.couponInput = el.value },
  async applyCoupon() {
    const c = COUPONS.find(x => x.code.toUpperCase() === State.couponInput.toUpperCase() && x.active);
    if (!c) { showToast("Invalid coupon", "err"); return; }
    if (subtotal() < c.minOrder) { showToast("Min order " + fmt(c.minOrder) + " required", "err"); return; }
    State.coupon = c; render(); showToast("Coupon applied! 🎉", "ok");
  },
  removeCoupon() { State.coupon = null; State.couponInput = ""; render() },

  copyNumber(num) { copyText(num) },

  async placeOrder() {
    if (!State.form.name || !State.form.phone || !State.form.address) {
      showToast("Please fill all required fields", "err"); return;
    }

    // Save customer profile
    if (State.user) {
      const uid = State.user.uid || State.user.email;
      const profile = { name:State.form.name, phone:State.form.phone, address:State.form.address, city:State.form.city, email:State.user.email||"", uid };
      await Store.saveCustomer(uid, profile);
      State.userProfile = profile;
    }

    const order = {
      total: total(),
      subtotal: subtotal(),
      shipping: shipping(),
      discount: discount(),
      couponCode: State.coupon ? State.coupon.code : null,
      items: State.cart.slice(),
      customer: { ...State.form, email: State.user ? (State.user.email || "") : "" },
      uid: State.user ? (State.user.uid || State.user.email) : null,
      userEmail: State.user ? (State.user.email || "") : null
    };

    const saved = await Store.createOrder(order);
    State.orderDone = saved;
    State.cart = []; saveCart();
    State.showCheckout = false; State.showCart = false;
    State.coupon = null; State.couponInput = "";
    render(); window.scrollTo(0,0);

    // Notify admin on WhatsApp
    setTimeout(() => notifyAdminWhatsApp(saved), 1500);
  },

  continueShopping() { State.orderDone = null; render() },

  setTrackId(el) { State.trackId = el.value },
  async trackOrder() {
    if (!State.trackId) return;
    const orders = await Store.getOrders();
    const found = orders.find(o => o.id.toUpperCase() === State.trackId.toUpperCase().trim());
    State.trackRes = found || { notFound: true }; render();
  },

  async loadMyOrders() {
    if (!State.user) { window.B.openAuth("login"); return; }
    const uid = State.user.uid || State.user.email;
    State.myOrders = await Store.getMyOrders(uid);
    State.showMyOrders = true; render();
  },

  closeMyOrders() { State.showMyOrders = false; render() },

  // ===== SKIN QUIZ =====
  openSkinQuiz() {
    if (!State.user) {
      showToast("Please login first to take quiz", "err");
      window.B.openAuth("login");
      return;
    }
    // Pre-fill if exists
    if (State.skinProfile) {
      State.quizAnswers = {
        skinType: State.skinProfile.skinType || "",
        skinTone: State.skinProfile.skinTone || "",
        concerns: State.skinProfile.concerns || [],
        age: State.skinProfile.age || "",
        name: State.skinProfile.name || ""
      };
    }
    State.showSkinQuiz = true;
    State.quizStep = 0;
    render();
  },
  closeSkinQuiz() { State.showSkinQuiz = false; render() },
  setQuizAnswer(field, value) {
    if (field === "concerns") {
      const concerns = State.quizAnswers.concerns;
      const idx = concerns.indexOf(value);
      if (idx >= 0) concerns.splice(idx, 1);
      else concerns.push(value);
    } else {
      State.quizAnswers[field] = value;
    }
    render();
  },
  nextQuizStep() {
    State.quizStep++;
    render();
  },
  prevQuizStep() {
    if (State.quizStep > 0) State.quizStep--;
    render();
  },
  async finishSkinQuiz() {
    if (!State.user) return;
    const uid = State.user.uid || State.user.email;
    const profile = { ...State.quizAnswers, uid };
    await Store.saveSkinProfile(uid, profile);
    State.skinProfile = profile;
    State.recommendations = Store.getRecommendations(PRODUCTS, profile);
    State.showSkinQuiz = false;
    showToast("✨ Profile saved! Check your recommendations", "ok");
    render();
  },
  async skipSkinQuiz() {
    State.showSkinQuiz = false;
    showToast("You can take the quiz anytime from Account", "ok");
    render();
  }
};

// ============================================
// RENDER HELPERS
// ============================================
function tagStyle(tag) {
  const styles = {
    "Viral": "background:linear-gradient(135deg,#ff6b9d,#c44dff);color:#fff",
    "Icon": "background:linear-gradient(135deg,#000,#333);color:#fff",
    "Best Seller": "background:#fff0f5;color:#ff3366",
    "Trending": "background:#f0f7ff;color:#2563eb",
    "New": "background:#f0fff4;color:#16a34a",
    "Popular": "background:#fff7ed;color:#ea580c"
  };
  return styles[tag] || styles["Best Seller"];
}

function prodImg(p, idx, size) {
  const fs = { thumb:"26px", feat:"52px", detail:"100px", cart:"30px", related:"40px" }[size] || "60px";
  if (p.images && p.images.length > 0) {
    const url = p.images[idx % p.images.length];
    return `<img src="${url}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>` +
           `<div style="font-size:${fs};display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${p.bg||'#f5f5f7'};position:absolute;inset:0">${p.emoji||'📦'}</div>`;
  }
  return `<div style="font-size:${fs};display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${p.bg||'#f5f5f7'}">${p.emoji||'📦'}</div>`;
}

function renderCard(p) {
  const disc = p.oldPrice ? Math.round((1 - p.price/p.oldPrice) * 100) : 0;
  const outOfStock = p.stock <= 0;
  return `<div class="card" onclick="B.openProd('${p.id}')">
    <div class="card-img" style="background:${p.bg||'#f5f5f7'}">
      ${prodImg(p, 0, "card")}
      ${outOfStock ? `<div class="card-out"><div class="card-out-txt">Out of Stock</div></div>` : ""}
      <button class="card-like" onclick="B.toggleLike('${p.id}',event)">${State.liked[p.id]?"❤️":"🤍"}</button>
      ${p.tag ? `<div class="card-tag" style="${tagStyle(p.tag)}">${p.tag}</div>` : ""}
      ${disc > 0 ? `<div class="card-disc">-${disc}%</div>` : ""}
    </div>
    <div class="card-body">
      <div class="card-brand">${esc(p.brand)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <div class="card-rating">⭐ <span>${p.rating}</span> (${p.reviews.toLocaleString()})</div>
      <div class="card-foot">
        <div>
          <div class="price">${fmt(p.price)}</div>
          ${p.oldPrice ? `<div class="old-price">${fmt(p.oldPrice)}</div>` : ""}
        </div>
        <button class="add-btn ${State.added[p.id]?"ok":""}"
          onclick="B.addCart('${p.id}',event)" ${outOfStock?"disabled":""}>
          ${State.added[p.id]?"✓":"+"}
        </button>
      </div>
    </div>
  </div>`;
}

function renderAuth() {
  const isLogin = State.authMode === "login";
  return `<div class="auth-modal">
    <div class="auth-card">
      <div class="auth-logo">B</div>
      <div class="auth-title">${isLogin ? "Welcome Back!" : "Join B HAN"}</div>
      <div class="auth-sub">${isLogin ? "Sign in to your account" : "Create your account to order"}</div>
      ${State.authErr ? `<div class="auth-err">${esc(State.authErr)}</div>` : ""}
      ${!isLogin ? `<input class="auth-input" placeholder="Your Name" oninput="B.setAuthField('authName', this)"/>` : ""}
      ${!isLogin ? `<input class="auth-input" type="tel" placeholder="Phone Number" oninput="B.setAuthField('authPhone', this)"/>` : ""}
      <input class="auth-input" type="email" placeholder="Email Address *" value="${esc(State.authEmail)}" oninput="B.setAuthField('authEmail', this)"/>
      <input class="auth-input" type="password" placeholder="Password (min 6 characters) *" oninput="B.setAuthField('authPass', this)"/>
      <button class="auth-btn" onclick="B.doAuth()">${State.authLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}</button>
      <div class="auth-switch">
        ${isLogin ? "New to B HAN? <span onclick=\"B.setAuthMode('register')\">Create account</span>" : "Already have account? <span onclick=\"B.setAuthMode('login')\">Sign in</span>"}
      </div>
      <span class="auth-skip" onclick="B.closeAuth()">Skip for now →</span>
    </div>
  </div>`;
}

function renderHome() {
  let list = PRODUCTS.filter(p => State.cat === "all" || p.cat === State.cat);
  if (State.search) {
    const q = State.search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }
  const featured = PRODUCTS.filter(p => p.featured);
  const cats = [{id:"all",icon:"✨",name:"All"}].concat((SETTINGS.categories||["Skincare","Sunscreen","Makeup","Haircare","Body"]).map(c => ({id:c,icon:{Skincare:"💧",Sunscreen:"☀️",Makeup:"💄",Haircare:"💁‍♀️",Body:"🧴"}[c]||"✨",name:c})));

  // Personalized recommendations
  const hasProfile = State.skinProfile && (State.skinProfile.skinType || (State.skinProfile.concerns && State.skinProfile.concerns.length));
  const recommendations = hasProfile ? Store.getRecommendations(PRODUCTS, State.skinProfile).slice(0, 8) : [];

  return `<div class="content">
    <div class="hero">
      <div class="hero-orb1"></div>
      <div class="hero-orb2"></div>
      <div class="hero-inner">
        <div class="hero-pill">🇰🇷 K-BEAUTY DIRECT FROM SEOUL</div>
        <h1>${esc(SETTINGS.heroTitle)}</h1>
        <p>${esc(SETTINGS.heroSubtitle)}</p>
        <div class="hero-cta">🎉 ${esc(SETTINGS.heroOffer)} →</div>
      </div>
    </div>

    ${SETTINGS.promoBanner ? `
      <div class="promo-banner" style="background:linear-gradient(135deg,${SETTINGS.promoColor||"#ff6b9d"},${SETTINGS.promoColor2||"#c44dff"})">
        <div>
          <div class="promo-title">${esc(SETTINGS.promoTitle||"")}</div>
          <div class="promo-sub">${esc(SETTINGS.promoSub||"")}</div>
        </div>
        <div class="promo-btn" style="color:${SETTINGS.promoColor||"#ff6b9d"}">${esc(SETTINGS.promoCta||"Shop Now")}</div>
      </div>
    ` : ""}

    ${!hasProfile && State.user ? `
      <div onclick="B.openSkinQuiz()" style="background:linear-gradient(135deg,#fff0f5,#f5e0ff);border-radius:16px;padding:18px;margin-bottom:18px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1.5px solid #ffb3d1">
        <div style="font-size:36px">✨</div>
        <div style="flex:1">
          <div style="font-family:'DM Serif Display',serif;font-size:16px;color:#c44dff;margin-bottom:2px">Get Personalized Picks!</div>
          <div style="font-size:11px;color:#666">আপনার skin-এর জন্য perfect products খুঁজুন</div>
        </div>
        <div style="background:linear-gradient(135deg,#ff6b9d,#c44dff);color:#fff;padding:8px 14px;border-radius:100px;font-size:12px;font-weight:800">Take Quiz →</div>
      </div>
    ` : ""}

    ${!State.user && !State.search ? `
      <div onclick="B.openAuth('register')" style="background:#0a0a0a;color:#fff;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font-size:13px;font-weight:800">🎁 Get 10% off first order</div>
          <div style="font-size:11px;opacity:.7">Sign up & take our skin quiz</div>
        </div>
        <div style="background:#fff;color:#000;padding:6px 12px;border-radius:100px;font-size:11px;font-weight:800">Sign Up →</div>
      </div>
    ` : ""}

    <div class="search-wrap">
      <svg width="16" height="16" fill="none" stroke="#999" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
      <input class="search" placeholder="Search products, brands..." value="${esc(State.search)}" oninput="B.setSearch(this)"/>
    </div>

    <div class="cats">
      ${cats.map(c => `<button class="cat ${State.cat===c.id?"on":""}" onclick="B.setCat('${c.id}')">${c.icon} ${c.name}</button>`).join("")}
    </div>

    ${hasProfile && recommendations.length > 0 && State.cat === "all" && !State.search ? `
      <div class="sec">
        <h2>✨ Just For You</h2>
        <span class="sec-count">Based on your skin</span>
      </div>
      <div style="background:linear-gradient(135deg,#fff0f5,#f5e0ff);border-radius:14px;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#888">
        ${State.skinProfile.skinType ? `<strong style="color:#c44dff">${State.skinProfile.skinType.toUpperCase()} skin</strong>` : ""}
        ${State.skinProfile.concerns && State.skinProfile.concerns.length ? ` • ${State.skinProfile.concerns.slice(0,3).join(", ")}` : ""}
        <span style="float:right;color:#c44dff;font-weight:700;cursor:pointer" onclick="B.openSkinQuiz()">Edit ✏️</span>
      </div>
      <div class="grid" style="margin-bottom:24px">${recommendations.map(renderCard).join("")}</div>
    ` : ""}

    ${State.cat === "all" && !State.search && featured.length ? `
      <div class="sec"><h2>⭐ Featured</h2></div>
      <div class="feat-row">
        ${featured.map(p => `
          <div class="feat" onclick="B.openProd('${p.id}')">
            <div class="feat-img" style="background:${p.bg||'#f5f5f7'}">${prodImg(p,0,"feat")}</div>
            <div class="feat-info">
              <div class="feat-brand">${esc(p.brand)}</div>
              <div class="feat-name">${esc(p.name)}</div>
              <div class="feat-price">${fmt(p.price)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <div class="sec">
      <h2>${State.cat === "all" ? "All Products" : State.cat}</h2>
      <span class="sec-count">${list.length} items</span>
    </div>
    ${list.length ? `<div class="grid">${list.map(renderCard).join("")}</div>` :
      `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-msg">No products found</div></div>`}
  </div>`;
}

function renderWishlist() {
  const liked = PRODUCTS.filter(p => State.liked[p.id]);
  return `<div class="content">
    <div class="sec"><h2>♡ Wishlist</h2><span class="sec-count">${liked.length} saved</span></div>
    ${liked.length ? `<div class="grid">${liked.map(renderCard).join("")}</div>` :
      `<div class="empty"><div class="empty-icon">♡</div><div class="empty-msg">Wishlist is empty</div><div class="empty-sub">Tap ♡ on products you love</div></div>`}
  </div>`;
}

function renderTrack() {
  let res = "";
  if (State.trackRes) {
    if (State.trackRes.notFound) {
      res = `<div class="empty" style="background:#fff;border-radius:12px;margin-top:12px"><div class="empty-icon">❓</div><div class="empty-msg">Order not found</div></div>`;
    } else {
      const o = State.trackRes;
      const steps = [{k:"pending",l:"Order Placed"},{k:"confirmed",l:"Confirmed"},{k:"processing",l:"Processing"},{k:"shipped",l:"Shipped"},{k:"delivered",l:"Delivered"}];
      const si = steps.findIndex(s => s.k === o.status);
      res = `<div class="track-card">
        <div style="font-size:10px;color:#aaa;font-weight:700;letter-spacing:1px;margin-bottom:3px">ORDER</div>
        <div style="font-size:16px;font-weight:900;font-family:monospace;margin-bottom:14px">${o.id}</div>
        ${steps.map((s,i) => `
          <div class="trow">
            <div class="tdot ${i<=si?"done":""}">${i<=si?"✓":""}</div>
            <div><div class="tlabel ${i<=si?"done":""}">${s.l}</div>${i===si?'<div class="tcurrent">● Current status</div>':""}</div>
          </div>`).join("")}
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;font-size:17px;font-weight:900">
          <span>Total</span><span>${fmt(o.total)}</span>
        </div>
      </div>`;
    }
  }
  return `<div class="content">
    <div class="sec"><h2>📦 Track Order</h2></div>
    <div class="track-wrap">
      <input class="track-input" placeholder="Enter Order ID e.g. BHN1234567" value="${esc(State.trackId)}" oninput="B.setTrackId(this)"/>
      <div class="track-hint">💡 Order ID was in your confirmation screen</div>
      <button class="track-btn" onclick="B.trackOrder()">Track My Order</button>
    </div>
    ${res}
  </div>`;
}

function renderAccount() {
  if (!State.user) {
    return `<div class="content">
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:60px;margin-bottom:16px">👤</div>
        <div style="font-family:'DM Serif Display',serif;font-size:24px;margin-bottom:8px">Sign In to B HAN</div>
        <div style="color:#888;font-size:13px;margin-bottom:24px">Track orders, save addresses & wishlist</div>
        <button class="go-checkout" onclick="B.openAuth('login')" style="max-width:280px;margin:0 auto 10px">Sign In</button>
        <button onclick="B.openAuth('register')" style="display:block;width:100%;max-width:280px;margin:0 auto;padding:14px;border-radius:14px;border:1.5px solid #eee;font-size:14px;font-weight:700">Create Account</button>
      </div>
    </div>`;
  }

  const u = State.user;
  const profile = State.userProfile;
  const hasSkinProfile = State.skinProfile && State.skinProfile.skinType;
  return `<div class="content">
    <div class="acc-header">
      <div class="acc-avatar">👤</div>
      <div class="acc-name">${esc(profile?.name || u.displayName || "Customer")}</div>
      <div class="acc-email">${esc(u.email || u.uid || "")}</div>
    </div>

    ${!hasSkinProfile ? `
      <div onclick="B.openSkinQuiz()" style="background:linear-gradient(135deg,#fff0f5,#f5e0ff);border-radius:14px;padding:16px;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:12px;border:1.5px solid #ffb3d1">
        <div style="font-size:32px">✨</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800;color:#c44dff">Take Skin Quiz</div>
          <div style="font-size:11px;color:#666">Get personalized recommendations</div>
        </div>
        <div style="color:#c44dff;font-size:18px">›</div>
      </div>
    ` : `
      <div class="acc-card" style="background:linear-gradient(135deg,#fff0f5,#f5e0ff);padding:16px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:13px;font-weight:800;color:#c44dff">✨ Your Skin Profile</div>
          <span onclick="B.openSkinQuiz()" style="color:#c44dff;font-size:11px;font-weight:700;cursor:pointer">Edit ✏️</span>
        </div>
        <div style="font-size:11px;color:#666;line-height:1.6">
          <div><strong>Type:</strong> ${esc(State.skinProfile.skinType||"")}</div>
          ${State.skinProfile.concerns && State.skinProfile.concerns.length ? `<div><strong>Concerns:</strong> ${State.skinProfile.concerns.join(", ")}</div>` : ""}
          ${State.skinProfile.age ? `<div><strong>Age:</strong> ${State.skinProfile.age}</div>` : ""}
          ${State.skinProfile.skinTone ? `<div><strong>Tone:</strong> ${State.skinProfile.skinTone}</div>` : ""}
        </div>
      </div>
    `}

    <div class="acc-card">
      <div class="acc-item" onclick="B.loadMyOrders()">
        <div class="acc-item-left"><div class="acc-icon">📦</div><div><div>My Orders</div><div style="font-size:11px;color:#aaa;font-weight:500">View all past orders</div></div></div>
        <span style="color:#ccc">›</span>
      </div>
      <div class="acc-item" onclick="B.setView('wishlist')">
        <div class="acc-item-left"><div class="acc-icon">❤️</div><div><div>Wishlist</div><div style="font-size:11px;color:#aaa;font-weight:500">${Object.keys(State.liked).length} saved items</div></div></div>
        <span style="color:#ccc">›</span>
      </div>
      <div class="acc-item" onclick="B.setView('track')">
        <div class="acc-item-left"><div class="acc-icon">🔍</div><div><div>Track Order</div><div style="font-size:11px;color:#aaa;font-weight:500">Check delivery status</div></div></div>
        <span style="color:#ccc">›</span>
      </div>
      ${SETTINGS.whatsappNumber ? `
      <div class="acc-item" onclick="window.open('https://wa.me/${SETTINGS.whatsappNumber}','_blank')">
        <div class="acc-item-left"><div class="acc-icon">💬</div><div><div>Contact Support</div><div style="font-size:11px;color:#aaa;font-weight:500">WhatsApp us</div></div></div>
        <span style="color:#ccc">›</span>
      </div>` : ""}
    </div>
    <button class="logout-btn" onclick="B.doLogout()">🚪 Sign Out</button>
  </div>`;
}

function renderMyOrders() {
  const orders = State.myOrders;
  return `<div class="overlay" onclick="B.closeMyOrders()">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="handle"><div class="handle-bar"></div></div>
      <div class="sheet-pad">
        <div style="font-size:20px;font-weight:800;margin:14px 0 16px">📦 My Orders</div>
        ${orders.length === 0 ? `<div class="empty"><div class="empty-icon">📦</div><div class="empty-msg">No orders yet</div></div>` :
          orders.map(o => `
            <div class="my-order">
              <div class="my-order-hd">
                <div class="my-order-id">${o.id}</div>
                <span class="my-order-status s-${o.status}">${o.status}</span>
              </div>
              <div style="font-size:12px;color:#666;margin-bottom:6px">${o.items.length} items • ${fmt(o.total)}</div>
              <div style="font-size:11px;color:#aaa">${new Date(o.createdAt).toLocaleDateString("en-BD")}</div>
            </div>
          `).join("")}
      </div>
    </div>
  </div>`;
}

function renderSkinQuiz() {
  const step = State.quizStep;
  const a = State.quizAnswers;
  const totalSteps = 4;

  const skinTypes = [
    { id: "dry", emoji: "🌵", name: "Dry", desc: "Tight, flaky, রুক্ষ" },
    { id: "oily", emoji: "✨", name: "Oily", desc: "Shiny, large pores, তৈলাক্ত" },
    { id: "combination", emoji: "🌗", name: "Combination", desc: "Oily T-zone, dry cheeks, মিশ্র" },
    { id: "normal", emoji: "🌸", name: "Normal", desc: "Balanced, স্বাভাবিক" },
    { id: "sensitive", emoji: "🌿", name: "Sensitive", desc: "Easily irritated, সংবেদনশীল" }
  ];

  const concerns = [
    { id: "acne", emoji: "🔴", name: "Acne / Bron", desc: "ব্রণ" },
    { id: "spots", emoji: "🟤", name: "Dark Spots", desc: "কালো দাগ" },
    { id: "melasma", emoji: "🟫", name: "Melasma", desc: "মেস্তা" },
    { id: "dullness", emoji: "🌫️", name: "Dullness", desc: "নিস্তেজ" },
    { id: "wrinkles", emoji: "⏳", name: "Wrinkles", desc: "বলিরেখা" },
    { id: "pores", emoji: "🕳️", name: "Large Pores", desc: "বড় রোম" },
    { id: "redness", emoji: "🩹", name: "Redness", desc: "লালচে" },
    { id: "dryness", emoji: "💧", name: "Dryness", desc: "শুষ্কতা" }
  ];

  const ageGroups = [
    { id: "teen", emoji: "🌱", name: "Teen (13-19)" },
    { id: "20s", emoji: "🌸", name: "20s" },
    { id: "30s", emoji: "🌺", name: "30s" },
    { id: "40+", emoji: "🌹", name: "40+" }
  ];

  const skinTones = [
    { id: "fair", emoji: "🤍", name: "Fair / ফর্সা", color: "#fde8d8" },
    { id: "light", emoji: "🤎", name: "Light / হালকা", color: "#f0c8a0" },
    { id: "medium", emoji: "🟫", name: "Medium / মাঝারি", color: "#c89060" },
    { id: "tan", emoji: "🟤", name: "Tan / শ্যামলা", color: "#a06840" },
    { id: "deep", emoji: "⚫", name: "Deep / গাঢ়", color: "#704020" }
  ];

  let stepContent = "";

  if (step === 0) {
    // Welcome
    stepContent = `
      <div style="text-align:center;padding:20px 10px">
        <div style="font-size:60px;margin-bottom:14px">✨</div>
        <div style="font-family:'DM Serif Display',serif;font-size:24px;margin-bottom:8px">Skin Profile Quiz</div>
        <div style="color:#666;font-size:13px;line-height:1.6;margin-bottom:24px">
          ৫ মিনিটের একটা quiz দিয়ে আপনার skin-এর জন্য<br><strong>perfect Korean products</strong> খুঁজে পাবেন!
        </div>
        <div style="background:#fff0f5;border-radius:14px;padding:14px;margin-bottom:20px;text-align:left">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#c44dff">আপনি পাবেন:</div>
          <div style="font-size:12px;color:#666;line-height:1.8">
            ✓ Personalized product suggestions<br>
            ✓ Skin-type অনুযায়ী recommendations<br>
            ✓ Concern-specific solutions<br>
            ✓ Korean dermatologist-approved
          </div>
        </div>
        <button class="auth-btn" onclick="B.nextQuizStep()" style="margin-bottom:10px">শুরু করুন →</button>
        <button onclick="B.skipSkinQuiz()" style="display:block;width:100%;background:none;color:#888;font-size:13px;padding:10px">Skip for now</button>
      </div>`;
  } else if (step === 1) {
    // Skin Type
    stepContent = `
      <div style="padding:10px">
        <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:6px">STEP 1 OF 4</div>
        <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">আপনার skin type কী?</div>
        <div style="color:#666;font-size:12px;margin-bottom:20px">আপনার skin সাধারণত কেমন থাকে?</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
          ${skinTypes.map(s => `
            <button onclick="B.setQuizAnswer('skinType', '${s.id}')"
              style="padding:14px;border-radius:12px;border:2px solid ${a.skinType===s.id?'var(--pink)':'#eee'};background:${a.skinType===s.id?'#fff0f5':'#fff'};text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer">
              <div style="font-size:28px">${s.emoji}</div>
              <div>
                <div style="font-size:14px;font-weight:700">${s.name}</div>
                <div style="font-size:11px;color:#888">${s.desc}</div>
              </div>
            </button>
          `).join("")}
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="B.prevQuizStep()" style="flex:1;padding:13px;border-radius:11px;border:1.5px solid #eee;background:#fff;font-weight:700">← Back</button>
          <button onclick="B.nextQuizStep()" ${!a.skinType?"disabled":""} class="auth-btn" style="flex:2;${!a.skinType?'opacity:.5':''}">Next →</button>
        </div>
      </div>`;
  } else if (step === 2) {
    // Concerns (multi-select)
    stepContent = `
      <div style="padding:10px">
        <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:6px">STEP 2 OF 4</div>
        <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">কী কী concern আছে?</div>
        <div style="color:#666;font-size:12px;margin-bottom:20px">যা যা সমস্যা সব select করুন (multiple)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
          ${concerns.map(c => `
            <button onclick="B.setQuizAnswer('concerns', '${c.id}')"
              style="padding:12px 8px;border-radius:12px;border:2px solid ${a.concerns.includes(c.id)?'var(--pink)':'#eee'};background:${a.concerns.includes(c.id)?'#fff0f5':'#fff'};text-align:center;cursor:pointer">
              <div style="font-size:24px;margin-bottom:4px">${c.emoji}</div>
              <div style="font-size:12px;font-weight:700">${c.name}</div>
              <div style="font-size:10px;color:#888;margin-top:2px">${c.desc}</div>
            </button>
          `).join("")}
        </div>
        <div style="background:#f0f7ff;border-radius:10px;padding:10px;margin-bottom:14px;font-size:11px;color:#2563eb;text-align:center">
          ${a.concerns.length > 0 ? `✓ ${a.concerns.length} selected` : "Select at least one concern"}
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="B.prevQuizStep()" style="flex:1;padding:13px;border-radius:11px;border:1.5px solid #eee;background:#fff;font-weight:700">← Back</button>
          <button onclick="B.nextQuizStep()" ${a.concerns.length===0?"disabled":""} class="auth-btn" style="flex:2;${a.concerns.length===0?'opacity:.5':''}">Next →</button>
        </div>
      </div>`;
  } else if (step === 3) {
    // Age Group
    stepContent = `
      <div style="padding:10px">
        <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:6px">STEP 3 OF 4</div>
        <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">আপনার age group?</div>
        <div style="color:#666;font-size:12px;margin-bottom:20px">Age অনুযায়ী product recommend করব</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          ${ageGroups.map(g => `
            <button onclick="B.setQuizAnswer('age', '${g.id}')"
              style="padding:18px 12px;border-radius:12px;border:2px solid ${a.age===g.id?'var(--pink)':'#eee'};background:${a.age===g.id?'#fff0f5':'#fff'};text-align:center;cursor:pointer">
              <div style="font-size:28px;margin-bottom:6px">${g.emoji}</div>
              <div style="font-size:13px;font-weight:700">${g.name}</div>
            </button>
          `).join("")}
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="B.prevQuizStep()" style="flex:1;padding:13px;border-radius:11px;border:1.5px solid #eee;background:#fff;font-weight:700">← Back</button>
          <button onclick="B.nextQuizStep()" ${!a.age?"disabled":""} class="auth-btn" style="flex:2;${!a.age?'opacity:.5':''}">Next →</button>
        </div>
      </div>`;
  } else if (step === 4) {
    // Skin Tone (final)
    stepContent = `
      <div style="padding:10px">
        <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:6px">STEP 4 OF 4</div>
        <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">আপনার skin tone?</div>
        <div style="color:#666;font-size:12px;margin-bottom:20px">Foundation/cushion shade match করতে</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
          ${skinTones.map(t => `
            <button onclick="B.setQuizAnswer('skinTone', '${t.id}')"
              style="padding:14px;border-radius:12px;border:2px solid ${a.skinTone===t.id?'var(--pink)':'#eee'};background:${a.skinTone===t.id?'#fff0f5':'#fff'};text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer">
              <div style="width:40px;height:40px;border-radius:50%;background:${t.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.1)"></div>
              <div style="font-size:14px;font-weight:700">${t.name}</div>
            </button>
          `).join("")}
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="B.prevQuizStep()" style="flex:1;padding:13px;border-radius:11px;border:1.5px solid #eee;background:#fff;font-weight:700">← Back</button>
          <button onclick="B.finishSkinQuiz()" ${!a.skinTone?"disabled":""} class="auth-btn" style="flex:2;${!a.skinTone?'opacity:.5':''}">✨ Get My Recommendations</button>
        </div>
      </div>`;
  }

  return `<div class="auth-modal">
    <div class="auth-card" style="max-width:420px;padding:20px;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="display:flex;gap:4px">
          ${[0,1,2,3,4].map(i => `<div style="width:28px;height:4px;border-radius:2px;background:${i<=step?'var(--pink)':'#eee'}"></div>`).join("")}
        </div>
        <button onclick="B.closeSkinQuiz()" style="background:#f5f5f7;width:30px;height:30px;border-radius:50%;font-size:18px">×</button>
      </div>
      ${stepContent}
    </div>
  </div>`;
}

function renderProductDetail() {
  const p = State.prod; if (!p) return "";
  const hasImgs = p.images && p.images.length > 0;
  const totalImgs = hasImgs ? p.images.length : 1;
  const outOfStock = p.stock <= 0;
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 6);

  return `<div class="overlay" onclick="B.closeProd()">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="handle"><div class="handle-bar"></div></div>
      <div class="det-img-wrap" style="background:${p.bg||'#f8f8f8'}">
        ${prodImg(p, State.imgIdx, "detail")}
        <button class="det-close" onclick="B.closeProd()">×</button>
        <button class="det-heart" onclick="B.toggleLike('${p.id}')">${State.liked[p.id]?"❤️":"🤍"}</button>
        ${hasImgs && totalImgs > 1 ? `
          <button class="det-nav det-prev" onclick="B.prevImg()">‹</button>
          <button class="det-nav det-next" onclick="B.nextImg()">›</button>
          <div class="dots">${p.images.map((_,i) => `<div class="dot ${State.imgIdx===i?"on":""}"></div>`).join("")}</div>
        ` : ""}
      </div>
      ${hasImgs && totalImgs > 1 ? `
        <div class="thumbs">
          ${p.images.map((url,i) => `<div class="thumb ${State.imgIdx===i?"on":""}" onclick="B.setImg(${i})" style="background:${p.bg||'#f5f5f7'}"><img src="${url}" alt=""/></div>`).join("")}
        </div>
      ` : ""}
      <div class="sheet-pad">
        <div class="det-brand">${esc(p.brand)}</div>
        <div class="det-name">${esc(p.name)}</div>
        <div class="det-meta">
          ⭐ <span style="color:#0a0a0a;font-weight:700">${p.rating}</span>
          • <span>${p.reviews.toLocaleString()} reviews</span>
          • ${outOfStock ? '<span class="out-badge">Out of Stock</span>' : `<span class="stock-badge">In Stock (${p.stock})</span>`}
        </div>
        <div class="price-row">
          <div class="det-price">${fmt(p.price)}</div>
          ${p.oldPrice ? `<div class="det-old">${fmt(p.oldPrice)}</div><div class="save-pill">SAVE ${Math.round((1-p.price/p.oldPrice)*100)}%</div>` : ""}
        </div>
        ${p.krw ? `
          <div class="breakdown">
            <div class="bd-head">💰 PRICE BREAKDOWN</div>
            <div class="bd-row"><span>Korean retail</span><span>₩${p.krw} ≈ ৳${p.cost}</span></div>
            <div class="bd-row"><span>Import + shipping</span><span>+ ৳${p.price - p.cost}</span></div>
            <div class="bd-total"><span>Your price</span><span>${fmt(p.price)}</span></div>
          </div>
        ` : ""}
        ${p.variants && p.variants.length > 0 ? `
          <div class="slabel">SELECT OPTION</div>
          <div class="variants">
            ${p.variants.map(v => `<button class="var-btn ${State.selVar===v?"on":""}" onclick="B.setVar('${esc(v).replace(/'/g, '\\\'')}')">${esc(v)}</button>`).join("")}
          </div>
        ` : ""}
        <div class="qty-row">
          <div class="slabel" style="margin:0">QUANTITY</div>
          <div class="qty-ctrl">
            <button class="qty-b" onclick="B.changeQty(-1)">−</button>
            <span class="qty-v">${State.qty}</span>
            <button class="qty-b" onclick="B.changeQty(1)">+</button>
          </div>
        </div>
        <div class="det-desc">${esc(p.desc)}</div>
        ${p.benefits && p.benefits.length ? `
          <div class="slabel">KEY BENEFITS</div>
          <div class="benefits">${p.benefits.map(b => `<div class="ben"><span class="ben-icon">✓</span>${esc(b)}</div>`).join("")}</div>
        ` : ""}
        ${p.ingredients && p.ingredients.length ? `
          <div class="slabel">KEY INGREDIENTS</div>
          <div class="ings">${p.ingredients.map(i => `<span class="ing">${esc(i)}</span>`).join("")}</div>
        ` : ""}
        ${p.howTo ? `<div class="slabel">HOW TO USE</div><div class="howto">${esc(p.howTo)}</div>` : ""}
        ${related.length ? `
          <div class="slabel">YOU MAY ALSO LIKE</div>
          <div class="related-row">
            ${related.map(r => `
              <div class="related-card" onclick="B.closeProd();setTimeout(()=>B.openProd('${r.id}'),100)">
                <div class="related-img" style="background:${r.bg||'#f5f5f7'}">${prodImg(r,0,"related")}</div>
                <div class="related-body">
                  <div class="related-name">${esc(r.name)}</div>
                  <div class="related-price">${fmt(r.price)}</div>
                </div>
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="det-cta">
          <button class="btn-blk" onclick="B.addFromDetail()" ${outOfStock?"disabled":""}>Add to Cart</button>
          <button class="btn-pk" onclick="B.buyNow()" ${outOfStock?"disabled":""}>Buy Now →</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderCartSheet() {
  const sub = subtotal(), ship = shipping(), tot = sub + ship;
  return `<div class="overlay" onclick="B.closeCart()">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="handle"><div class="handle-bar"></div></div>
      <div class="cart-pad">
        <div class="cart-hd">
          <div><div class="cart-title">Your Cart</div><div class="cart-sub">${itemCount()} item${itemCount()!==1?"s":""}</div></div>
          <button style="background:#f5f5f7;width:34px;height:34px;border-radius:50%;font-size:20px;display:flex;align-items:center;justify-content:center" onclick="B.closeCart()">×</button>
        </div>
        ${State.cart.length === 0 ? `<div class="empty"><div class="empty-icon">🛍️</div><div class="empty-msg">Cart is empty</div></div>` :
          State.cart.map(item => `
            <div class="ci">
              <div class="ci-img" style="background:${item.bg||'#f5f5f7'}">
                ${item.image ? `<img src="${item.image}" alt=""/>` : `<div style="font-size:30px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${item.emoji||"📦"}</div>`}
              </div>
              <div class="ci-info">
                <div class="ci-brand">${esc(item.brand)}</div>
                <div class="ci-name">${esc(item.name)}</div>
                ${item.variant ? `<div class="ci-var">${esc(item.variant)}</div>` : ""}
                <div class="ci-row">
                  <div class="ci-qty">
                    <button class="ci-qbtn" onclick="B.updateCartQty('${esc(item.key).replace(/'/g, '\\\'')}', -1)">−</button>
                    <span class="ci-qval">${item.qty}</span>
                    <button class="ci-qbtn" onclick="B.updateCartQty('${esc(item.key).replace(/'/g, '\\\'')}', 1)">+</button>
                  </div>
                  <div class="ci-price">${fmt(item.price * item.qty)}</div>
                </div>
              </div>
              <button class="ci-rm" onclick="B.removeCartItem('${esc(item.key).replace(/'/g, '\\\'')}')">✕</button>
            </div>
          `).join("")}
        ${State.cart.length > 0 ? `
          <div class="cart-sum">
            <div class="sum-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
            <div class="sum-row"><span>Shipping${ship===0?' <span class="sum-free">(FREE!)</span>':""}</span><span>${ship===0?"Free":fmt(ship)}</span></div>
            ${sub < SETTINGS.freeShippingThreshold && sub > 0 ? `<div class="sum-note">✨ Add ${fmt(SETTINGS.freeShippingThreshold - sub)} more for FREE delivery!</div>` : ""}
            <div class="sum-total"><span>Total</span><span class="sum-total-val">${fmt(tot)}</span></div>
          </div>
          <button class="go-checkout" onclick="B.goCheckout()">Proceed to Checkout →</button>
        ` : ""}
      </div>
    </div>
  </div>`;
}

function renderCheckout() {
  const sub = subtotal(), ship = shipping(), disc = discount(), tot = total();
  return `<div class="overlay">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="handle"><div class="handle-bar"></div></div>
      <div class="cart-pad">
        <div class="ck-hd">
          <button class="ck-back" onclick="B.backToCart()">←</button>
          <div class="ck-title">Checkout</div>
        </div>
        <div class="slabel">📍 DELIVERY ADDRESS</div>
        <input class="finput" placeholder="Full Name *" value="${esc(State.form.name)}" oninput="B.setField('name',this)"/>
        <input class="finput" type="tel" placeholder="Phone Number *" value="${esc(State.form.phone)}" oninput="B.setField('phone',this)"/>
        <input class="finput" placeholder="Delivery Address *" value="${esc(State.form.address)}" oninput="B.setField('address',this)"/>
        <input class="finput" placeholder="City" value="${esc(State.form.city)}" oninput="B.setField('city',this)"/>
        <textarea class="finput" placeholder="Order note (optional)" oninput="B.setField('note',this)" style="min-height:60px;resize:none">${esc(State.form.note)}</textarea>

        <div class="slabel">🚚 DELIVERY ZONE</div>
        <div class="zone-grid">
          <div class="zone-opt ${State.form.zone==="inside"?"on":""}" onclick="B.setZone('inside')">
            <div class="zone-opt-name">Inside Dhaka</div>
            <div class="zone-opt-price">${fmt(SETTINGS.shippingInsideDhaka)}</div>
          </div>
          <div class="zone-opt ${State.form.zone==="outside"?"on":""}" onclick="B.setZone('outside')">
            <div class="zone-opt-name">Outside Dhaka</div>
            <div class="zone-opt-price">${fmt(SETTINGS.shippingOutsideDhaka)}</div>
          </div>
        </div>

        <div class="slabel">🎟️ PROMO CODE</div>
        ${State.coupon ?
          `<div class="coupon-ok">
            <div><div style="font-size:12px;font-weight:800;color:#16a34a">✓ ${State.coupon.code} applied!</div><div style="font-size:11px;color:#16a34a">Saved ${fmt(disc)}</div></div>
            <button onclick="B.removeCoupon()" style="color:#aaa;font-size:18px">×</button>
          </div>` :
          `<div class="coupon-row">
            <input class="finput" placeholder="Try BHAN20 or NEW200" value="${esc(State.couponInput)}" oninput="B.setCouponInput(this)"/>
            <button class="coupon-apply" onclick="B.applyCoupon()">Apply</button>
          </div>`}

        <div class="slabel">💳 PAYMENT METHOD</div>
        <div class="pay-opt ${State.form.payment==="bkash"?"on":""}" onclick="B.setPayment('bkash')">
          <div class="pay-icon">📱</div>
          <div class="pay-info"><div class="pay-name">bKash</div><div class="pay-detail">Send Money to agent number</div></div>
          <div class="pay-radio"></div>
        </div>
        ${State.form.payment==="bkash" ? `
          <div class="bkash-info">
            <div class="bkash-info-title">📱 SEND TO bKASH:</div>
            <div class="bkash-info-num">${SETTINGS.bkashNumber}</div>
            <div class="bkash-info-amt">→ Amount: <strong>${fmt(tot)}</strong></div>
            <div class="bkash-info-amt">→ Use "Send Money" option</div>
            <div class="bkash-info-amt">→ Save your transaction ID</div>
            <button class="bkash-copy" onclick="B.copyNumber('${SETTINGS.bkashNumber}')">📋 Copy Number</button>
          </div>` : ""}

        <div class="pay-opt ${State.form.payment==="nagad"?"on":""}" onclick="B.setPayment('nagad')">
          <div class="pay-icon">💳</div>
          <div class="pay-info"><div class="pay-name">Nagad</div><div class="pay-detail">Send Money to agent number</div></div>
          <div class="pay-radio"></div>
        </div>
        ${State.form.payment==="nagad" ? `
          <div class="nagad-info">
            <div class="nagad-info-title">🟠 SEND TO NAGAD:</div>
            <div class="nagad-info-num">${SETTINGS.nagadNumber}</div>
            <div class="bkash-info-amt" style="color:#444">→ Amount: <strong>${fmt(tot)}</strong></div>
            <button class="bkash-copy" style="background:#ff6a00" onclick="B.copyNumber('${SETTINGS.nagadNumber}')">📋 Copy Number</button>
          </div>` : ""}

        <div class="pay-opt ${State.form.payment==="cod"?"on":""}" onclick="B.setPayment('cod')">
          <div class="pay-icon">💵</div>
          <div class="pay-info"><div class="pay-name">Cash on Delivery</div><div class="pay-detail">Pay when you receive</div></div>
          <div class="pay-radio"></div>
        </div>

        <div class="ck-summary">
          <div class="ck-sum-title">ORDER SUMMARY</div>
          ${State.cart.map(i => `<div class="ck-sum-row"><span>${esc(i.name.length>26?i.name.slice(0,26)+"...":i.name)} ×${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join("")}
          <div class="ck-sum-row"><span>Shipping</span><span>${ship===0?'<span style="color:#16a34a">FREE</span>':fmt(ship)}</span></div>
          ${disc > 0 ? `<div class="ck-sum-row ck-sum-disc"><span>Discount (${State.coupon.code})</span><span>-${fmt(disc)}</span></div>` : ""}
          <div class="ck-sum-total"><span>TOTAL</span><span>${fmt(tot)}</span></div>
        </div>
        <button class="place-order" onclick="B.placeOrder()">✅ Place Order — ${fmt(tot)}</button>
      </div>
    </div>
  </div>`;
}

function renderConfirm() {
  const o = State.orderDone;
  return `<div class="confirm-pg">
    <div class="confirm-inner">
      <div class="confirm-icon">✓</div>
      <div class="confirm-title">Order Confirmed! 🎉</div>
      <div class="confirm-msg">Your Korean beauty essentials are on their way!<br>Save your Order ID to track delivery.</div>
      <div class="confirm-card">
        <div class="confirm-label">ORDER ID</div>
        <div class="confirm-id">${o.id}</div>
        <div style="height:12px"></div>
        <div class="confirm-label">AMOUNT</div>
        <div class="confirm-amt">${fmt(o.total)}</div>
        ${o.customer.payment !== "cod" ? `
          <div style="margin-top:10px;padding:10px;background:#fff8ed;border-radius:8px;font-size:12px;color:#666">
            ⚠️ Please send <strong>${fmt(o.total)}</strong> to ${o.customer.payment==="bkash"?"bKash":"Nagad"}: <strong>${o.customer.payment==="bkash"?SETTINGS.bkashNumber:SETTINGS.nagadNumber}</strong>
          </div>` :
          `<div style="margin-top:10px;font-size:12px;color:#16a34a;font-weight:600">✅ Pay cash when you receive your order!</div>`}
      </div>
      <button class="confirm-back" onclick="B.continueShopping()">Continue Shopping</button>
      ${SETTINGS.whatsappNumber ? `<a href="https://wa.me/${SETTINGS.whatsappNumber}?text=Hi!%20I%20placed%20order%20${o.id}" target="_blank" style="display:block;margin-top:14px;color:#16a34a;font-weight:700;font-size:13px">💬 Chat with us on WhatsApp</a>` : ""}
    </div>
  </div>`;
}

// ============================================
// MAIN RENDER
// ============================================
function render() {
  const root = document.getElementById("app");
  let html = "";

  if (State.orderDone) {
    html = renderConfirm();
  } else {
    const cnt = itemCount();
    html += `<div class="header">
      <div class="logo" onclick="B.setView('home')">
        <div class="logo-mark">B</div>
        <div>
          <div class="logo-text">${esc(SETTINGS.storeName)}</div>
          <div class="logo-sub">${esc(SETTINGS.tagline)}</div>
        </div>
      </div>
      <div class="hactions">
        <button class="user-btn ${State.user?"logged":""}" onclick="${State.user?`B.setView('account')`:`B.openAuth('login')`}">${State.user?"👤":"🔑"}</button>
        <button class="hbtn" onclick="B.openCart()">
          <svg width="16" height="16" fill="none" stroke="#333" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          ${cnt > 0 ? `<span class="cart-count">${cnt}</span>` : ""}
        </button>
      </div>
    </div>`;

    if (SETTINGS.announcement) {
      html += `<div class="announce">${esc(SETTINGS.announcement)}</div>`;
    }

    if (State.view === "home") html += renderHome();
    else if (State.view === "wishlist") html += renderWishlist();
    else if (State.view === "track") html += renderTrack();
    else if (State.view === "account") html += renderAccount();

    html += `<div class="bnav"><div class="bnav-inner">
      ${[{id:"home",icon:"🏠",lbl:"Home"},{id:"wishlist",icon:"♡",lbl:"Wishlist"},{id:"track",icon:"📦",lbl:"Track"},{id:"account",icon:"👤",lbl:"Account"}].map(n =>
        `<button class="nav-btn ${State.view===n.id?"on":""}" onclick="B.setView('${n.id}')"><div class="nav-icon">${n.icon}</div>${n.lbl}</button>`
      ).join("")}
    </div></div>`;

    if (State.showAuth) html += renderAuth();
    else if (State.showSkinQuiz) html += renderSkinQuiz();
    else if (State.showMyOrders) html += renderMyOrders();
    else if (State.prod) html += renderProductDetail();
    else if (State.showCheckout) html += renderCheckout();
    else if (State.showCart) html += renderCartSheet();
  }

  if (State.toast) {
    html += `<div class="toast ${State.toast.type==="err"?"err":State.toast.type==="ok"?"ok":""}">${esc(State.toast.msg)}</div>`;
  }

  root.innerHTML = html;
}

// ============================================
// INIT
// ============================================
async function init() {
  try {
    SETTINGS = await Store.getSettings();
    PRODUCTS = await Store.getProducts();
    COUPONS = await Store.getCoupons();
    applyTheme();
    document.title = `${SETTINGS.storeName} — ${SETTINGS.tagline}`;

    // Check if user already logged in
    if (useFirebase && auth) {
      auth.onAuthStateChanged(async user => {
        if (user) {
          State.user = user;
          const profile = await Store.getCustomer(user.uid);
          State.userProfile = profile;
          if (profile) {
            State.form.name = profile.name || "";
            State.form.phone = profile.phone || "";
            State.form.address = profile.address || "";
          }
          // Load skin profile
          State.skinProfile = await Store.getSkinProfile(user.uid);
        } else {
          State.user = null;
          State.userProfile = null;
          State.skinProfile = null;
        }
        render();
      });
    } else {
      // Demo mode - check local storage
      const localUser = Store.getCurrentUser();
      if (localUser) {
        State.user = localUser;
        State.skinProfile = await Store.getSkinProfile(localUser.uid || localUser.email);
      }
      render();
    }
  } catch(e) {
    console.error("Init error:", e);
    document.getElementById("app").innerHTML = `<div class="loading">Error loading. Please refresh.</div>`;
  }
}

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
