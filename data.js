// ============================================
// B HAN — Data Layer v2
// ============================================

const DEFAULT_PRODUCTS = [
  {id:"p1",cat:"Skincare",name:"Bio-Collagen Real Deep Mask",brand:"Biodance",price:520,oldPrice:650,krw:"14,000",cost:380,stock:50,rating:4.9,reviews:3421,tag:"Viral",featured:true,emoji:"🧖‍♀️",bg:"#fde8f0",images:[],desc:"TikTok-viral overnight hydrogel mask delivering glass-skin results while you sleep. Potent collagen, peptides, niacinamide.",howTo:"1. Cleanse face\n2. Apply mask\n3. Leave overnight\n4. Rinse",ingredients:["Collagen","Peptides","Hyaluronic Acid","Niacinamide"],benefits:["Glass skin","Fine lines","Hydration","Plumps"],variants:["1 Sheet","Pack of 4","Pack of 10"],skinTags:["dry","normal","dullness","wrinkles","dryness"]},
  {id:"p2",cat:"Skincare",name:"Heartleaf 77% Soothing Toner",brand:"Anua",price:1650,oldPrice:2100,krw:"22,000",cost:1100,stock:100,rating:4.9,reviews:15632,tag:"Best Seller",featured:true,emoji:"🌿",bg:"#e8f5e8",images:[],desc:"Most loved K-beauty toner. 77% Heartleaf extract calms irritated, sensitive skin.",howTo:"Apply with cotton pad or hands. AM/PM.",ingredients:["Heartleaf 77%","Panthenol","Allantoin","PHA"],benefits:["Calms redness","Balances oil","Soothes acne","pH balanced"],variants:["250ml","500ml"],skinTags:["sensitive","oily","combination","acne","redness","pores"]},
  {id:"p3",cat:"Skincare",name:"Snail 96 Mucin Power Essence",brand:"COSRX",price:1850,oldPrice:2300,krw:"24,500",cost:1200,stock:75,rating:4.9,reviews:58923,tag:"Icon",featured:true,emoji:"🐌",bg:"#f0e8ff",images:[],desc:"Holy grail Korean essence. 96.3% snail mucin clinically proven to hydrate, repair, improve elasticity.",howTo:"2-3 drops after toner. Pat gently AM/PM.",ingredients:["Snail Mucin 96.3%","Hyaluronic Acid","Panthenol"],benefits:["Repairs skin","Fades scars","Hydration","Plumps"],variants:["100ml"],skinTags:["all","dry","normal","sensitive","acne","spots","wrinkles","dryness"]},
  {id:"p4",cat:"Skincare",name:"DIVE-IN Hyaluronic Acid Serum",brand:"Torriden",price:1450,oldPrice:1800,krw:"20,000",cost:950,stock:70,rating:4.8,reviews:23876,tag:"Best Seller",featured:true,emoji:"💧",bg:"#e0f0ff",images:[],desc:"5 molecular weights of HA for deep hydration. Olive Young #1 best seller.",howTo:"2-3 drops after toner. Pat until absorbed.",ingredients:["5D Hyaluronic Acid","Allantoin","Panthenol"],benefits:["Deep hydration","Plumps","Lightweight","Glass skin"],variants:["50ml","100ml"],skinTags:["dry","normal","sensitive","combination","dryness","dullness"]},
  {id:"p5",cat:"Skincare",name:"Madagascar Centella Ampoule",brand:"SKIN1004",price:1750,oldPrice:2200,krw:"25,000",cost:1150,stock:60,rating:4.8,reviews:34512,tag:"Popular",featured:true,emoji:"🌱",bg:"#e8f8ed",images:[],desc:"100% pure Madagascar Centella. Holy grail for sensitive skin.",howTo:"3-4 drops after toner. Press into face.",ingredients:["Centella 100%","Madecassoside"],benefits:["Heals barrier","Calms redness","Anti-inflammatory","Gentle"],variants:["55ml","100ml"],skinTags:["sensitive","acne","redness","combination","oily"]},
  {id:"p6",cat:"Skincare",name:"Dynasty Cream",brand:"Beauty of Joseon",price:1650,oldPrice:2000,krw:"22,000",cost:1100,stock:80,rating:4.9,reviews:36234,tag:"Icon",featured:true,emoji:"👑",bg:"#f5e8d0",images:[],desc:"Royal Korean beauty ritual. Traditional hanbang herbs + modern peptides.",howTo:"Final step AM/PM. Press onto face and neck.",ingredients:["Red Ginseng","Peptides","Niacinamide"],benefits:["Anti-aging","Brightens","Nourishes","Royal glow"],variants:["50ml"],skinTags:["dry","normal","dullness","wrinkles","spots","melasma","dryness"]},
  {id:"p7",cat:"Sunscreen",name:"Relief Sun Rice + Probiotic SPF50+",brand:"Beauty of Joseon",price:1350,oldPrice:1700,krw:"18,000",cost:900,stock:120,rating:4.9,reviews:82453,tag:"Viral",featured:true,emoji:"☀️",bg:"#fff0d0",images:[],desc:"Internet's favorite Korean sunscreen. 82,000+ five-star reviews. Zero white cast.",howTo:"Apply 2-finger length 15min before sun. Reapply every 2hr.",ingredients:["Rice Extract","Niacinamide","Probiotics"],benefits:["SPF50+","No white cast","Brightens","Dewy"],variants:["50ml"],skinTags:["all","oily","combination","normal","dry","sensitive","melasma","spots"]},
  {id:"p8",cat:"Makeup",name:"Juicy Lasting Tint",brand:"rom&nd",price:1250,oldPrice:1600,krw:"17,000",cost:800,stock:150,rating:4.9,reviews:95632,tag:"Icon",featured:true,emoji:"💋",bg:"#ffd0d0",images:[],desc:"Viral K-beauty lip tint. 30+ shades. Juicy gel texture. Non-drying.",howTo:"Apply directly. Layer for intensity.",ingredients:["Castor Oil","Vitamin E","Shea Butter"],benefits:["12hr wear","Juicy","Non-drying","Buildable"],variants:["Figfig","Cherry Bomb","Ploggie","Mulled Peach"],skinTags:["all","makeup"]},
  {id:"p9",cat:"Makeup",name:"Kill Cover Fixer Cushion SPF50+",brand:"CLIO",price:3850,oldPrice:4800,krw:"52,000",cost:2500,stock:35,rating:4.8,reviews:24523,tag:"Best Seller",featured:true,emoji:"💄",bg:"#ffe0e8",images:[],desc:"Korean celebrity glass skin secret. 12-hour wear cushion with SPF50+.",howTo:"Tap puff lightly. Pat onto face.",ingredients:["Niacinamide","SPF50+","Hyaluronic Acid"],benefits:["12hr wear","SPF50+","Buildable","Glass skin"],variants:["#02 Lingerie","#03 Linen","#04 Ginger"],skinTags:["all","makeup","spots","melasma"]},
  {id:"p10",cat:"Makeup",name:"Ink Velvet Lip Tint",brand:"peripera",price:1150,oldPrice:1450,krw:"15,000",cost:750,stock:110,rating:4.8,reviews:48765,tag:"Viral",featured:true,emoji:"🌹",bg:"#ffd0e0",images:[],desc:"TikTok's #1 Korean lip tint. Featherlight velvet matte.",howTo:"Swipe on lips. Blot for gradient.",ingredients:["Jojoba Oil","Vitamin E","Squalane"],benefits:["Velvet","Weightless","10hr wear","Transfer-proof"],variants:["Good Brick","Pink Moment","Rosy Punch"],skinTags:["all","makeup"]},
  {id:"p11",cat:"Haircare",name:"Perfect Serum Original",brand:"Mise-en-Scène",price:1650,oldPrice:2100,krw:"22,000",cost:1100,stock:95,rating:4.8,reviews:36543,tag:"Best Seller",featured:false,emoji:"💁‍♀️",bg:"#ffe0c0",images:[],desc:"Korea's #1 hair serum with 7 precious oils. Mirror-shine hair.",howTo:"2-3 drops to hair ends. Do not rinse.",ingredients:["Argan Oil","Camellia Oil","Keratin"],benefits:["Frizz control","Shine","Heat protection","Lightweight"],variants:["80ml","150ml"],skinTags:["haircare"]},
  {id:"p12",cat:"Body",name:"Snail Repair Hand Cream",brand:"LAIKOU",price:850,oldPrice:1100,krw:"12,000",cost:550,stock:180,rating:4.7,reviews:22876,tag:"Best Seller",featured:false,emoji:"🤲",bg:"#f0e8ff",images:[],desc:"Luxurious hand cream with snail mucin and shea butter.",howTo:"Apply whenever hands need moisture.",ingredients:["Snail Mucin","Shea Butter","Vitamin E"],benefits:["Anti-aging","Hydration","Repairs","Non-greasy"],variants:["50g","100g"],skinTags:["body","dry","dryness"]}
];

// ============================================
// STORE DATA API
// ============================================
const Store = {
  async getSettings() {
    if (useFirebase) {
      try {
        const doc = await db.collection("config").doc("settings").get();
        if (doc.exists) return { ...STORE_DEFAULTS, ...doc.data() };
      } catch(e) {}
    }
    const local = localStorage.getItem("bhan_settings");
    return local ? { ...STORE_DEFAULTS, ...JSON.parse(local) } : { ...STORE_DEFAULTS };
  },

  async saveSettings(settings) {
    localStorage.setItem("bhan_settings", JSON.stringify(settings));
    if (useFirebase) {
      try { await db.collection("config").doc("settings").set(settings, {merge: true}); }
      catch(e) { console.error(e); }
    }
    return true;
  },

  async getProducts() {
    if (useFirebase) {
      try {
        const snap = await db.collection("products").orderBy("createdAt", "desc").get();
        if (!snap.empty) {
          const products = [];
          snap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
          return products;
        } else {
          for (const p of DEFAULT_PRODUCTS) {
            await db.collection("products").doc(p.id).set({...p, createdAt: Date.now()});
          }
          return DEFAULT_PRODUCTS;
        }
      } catch(e) { console.error(e); }
    }
    const local = localStorage.getItem("bhan_products");
    return local ? JSON.parse(local) : DEFAULT_PRODUCTS;
  },

  async saveProduct(product) {
    product.updatedAt = Date.now();
    if (!product.createdAt) product.createdAt = Date.now();
    if (useFirebase) {
      try { await db.collection("products").doc(product.id).set(product); }
      catch(e) { console.error(e); }
    }
    const products = await this.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) products[idx] = product;
    else products.unshift(product);
    localStorage.setItem("bhan_products", JSON.stringify(products));
    return true;
  },

  async deleteProduct(id) {
    if (useFirebase) {
      try { await db.collection("products").doc(id).delete(); }
      catch(e) { console.error(e); }
    }
    const products = await this.getProducts();
    localStorage.setItem("bhan_products", JSON.stringify(products.filter(p => p.id !== id)));
    return true;
  },

  async getOrders() {
    if (useFirebase) {
      try {
        const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
        const orders = [];
        snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
        return orders;
      } catch(e) { console.error(e); }
    }
    const local = localStorage.getItem("bhan_orders");
    return local ? JSON.parse(local) : [];
  },

  async createOrder(order) {
    order.id = "BHN" + Date.now().toString().slice(-7);
    order.createdAt = Date.now();
    order.status = "pending";
    if (useFirebase) {
      try { await db.collection("orders").doc(order.id).set(order); }
      catch(e) { console.error(e); }
    }
    const orders = await this.getOrders();
    orders.unshift(order);
    localStorage.setItem("bhan_orders", JSON.stringify(orders));
    return order;
  },

  async updateOrderStatus(orderId, status) {
    const update = { status, updatedAt: Date.now() };
    if (useFirebase) {
      try { await db.collection("orders").doc(orderId).update(update); }
      catch(e) { console.error(e); }
    }
    const orders = await this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) { Object.assign(order, update); localStorage.setItem("bhan_orders", JSON.stringify(orders)); }
    return true;
  },

  async getCoupons() {
    if (useFirebase) {
      try {
        const snap = await db.collection("coupons").get();
        if (!snap.empty) {
          const coupons = [];
          snap.forEach(doc => coupons.push({ id: doc.id, ...doc.data() }));
          return coupons;
        }
      } catch(e) {}
    }
    const local = localStorage.getItem("bhan_coupons");
    return local ? JSON.parse(local) : [
      { id:"BHAN20", code:"BHAN20", type:"percent", discount:20, minOrder:1000, active:true },
      { id:"NEW200", code:"NEW200", type:"amount", discount:200, minOrder:2000, active:true }
    ];
  },

  async saveCoupon(coupon) {
    if (useFirebase) {
      try { await db.collection("coupons").doc(coupon.id).set(coupon); }
      catch(e) {}
    }
    const coupons = await this.getCoupons();
    const idx = coupons.findIndex(c => c.id === coupon.id);
    if (idx >= 0) coupons[idx] = coupon; else coupons.push(coupon);
    localStorage.setItem("bhan_coupons", JSON.stringify(coupons));
    return true;
  },

  async deleteCoupon(id) {
    if (useFirebase) {
      try { await db.collection("coupons").doc(id).delete(); }
      catch(e) {}
    }
    const coupons = await this.getCoupons();
    localStorage.setItem("bhan_coupons", JSON.stringify(coupons.filter(c => c.id !== id)));
    return true;
  },

  // Customer Auth
  async loginWithEmail(email, password) {
    if (useFirebase) {
      try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: result.user };
      } catch(e) {
        if (e.code === 'auth/user-not-found') {
          try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            return { success: true, user: result.user, isNew: true };
          } catch(e2) {
            return { success: false, error: e2.message };
          }
        }
        return { success: false, error: e.message };
      }
    }
    // Demo mode — local login
    const key = "bhan_user_" + email;
    const existing = localStorage.getItem(key);
    if (existing) {
      const user = JSON.parse(existing);
      if (user.password === password) return { success: true, user, isNew: false };
      return { success: false, error: "Wrong password" };
    }
    const newUser = { email, password, name: "", phone: "", uid: "local_" + Date.now() };
    localStorage.setItem(key, JSON.stringify(newUser));
    localStorage.setItem("bhan_current_user", JSON.stringify(newUser));
    return { success: true, user: newUser, isNew: true };
  },

  async logout() {
    if (useFirebase) {
      try { await auth.signOut(); } catch(e) {}
    }
    localStorage.removeItem("bhan_current_user");
    localStorage.removeItem("bhan_customer_phone");
    return true;
  },

  getCurrentUser() {
    if (useFirebase && auth.currentUser) return auth.currentUser;
    const local = localStorage.getItem("bhan_current_user");
    return local ? JSON.parse(local) : null;
  },

  async getCustomer(uid) {
    if (useFirebase) {
      try {
        const doc = await db.collection("customers").doc(uid).get();
        if (doc.exists) return doc.data();
      } catch(e) {}
    }
    const local = localStorage.getItem("bhan_profile_" + uid);
    return local ? JSON.parse(local) : null;
  },

  async saveCustomer(uid, data) {
    data.updatedAt = Date.now();
    if (useFirebase) {
      try { await db.collection("customers").doc(uid).set(data, {merge: true}); }
      catch(e) {}
    }
    localStorage.setItem("bhan_profile_" + uid, JSON.stringify(data));
    return true;
  },

  async getMyOrders(uid) {
    const allOrders = await this.getOrders();
    return allOrders.filter(o => o.uid === uid || o.customer?.email === uid);
  },

  // Skin Profile
  async saveSkinProfile(uid, profile) {
    profile.updatedAt = Date.now();
    if (useFirebase) {
      try { await db.collection("skin_profiles").doc(uid).set(profile, {merge: true}); }
      catch(e) {}
    }
    localStorage.setItem("bhan_skin_" + uid, JSON.stringify(profile));
    return true;
  },

  async getSkinProfile(uid) {
    if (!uid) return null;
    if (useFirebase) {
      try {
        const doc = await db.collection("skin_profiles").doc(uid).get();
        if (doc.exists) return doc.data();
      } catch(e) {}
    }
    const local = localStorage.getItem("bhan_skin_" + uid);
    return local ? JSON.parse(local) : null;
  },

  // Get personalized recommendations based on skin profile
  getRecommendations(products, profile) {
    if (!profile || (!profile.skinType && (!profile.concerns || !profile.concerns.length))) {
      return [];
    }
    const userTags = new Set();
    if (profile.skinType) userTags.add(profile.skinType.toLowerCase());
    if (profile.concerns) profile.concerns.forEach(c => userTags.add(c.toLowerCase()));

    // Score each product based on matching tags
    const scored = products.map(p => {
      const productTags = (p.skinTags || []).map(t => t.toLowerCase());
      let score = 0;
      productTags.forEach(t => {
        if (userTags.has(t)) score += 2;
        if (t === "all") score += 1;
      });
      return { ...p, score };
    });

    return scored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
  },

  async getStats() {
    const orders = await this.getOrders();
    const products = await this.getProducts();
    const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s,o) => s + (o.total||0), 0);
    const pending = orders.filter(o => o.status === "pending").length;
    const lowStock = products.filter(p => p.stock < 10).length;
    const customers = new Set(orders.map(o => o.uid || o.customer?.email).filter(Boolean)).size;
    return { totalRevenue, totalOrders: orders.length, pending, totalProducts: products.length, lowStock, customers };
  }
};
