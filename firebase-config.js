// ============================================
// B HAN - Firebase Configuration
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAoq6DJOtwHKdIpR2pRN8EJ43Wa7lFkj7Q",
  authDomain: "bhan-app.firebaseapp.com",
  projectId: "bhan-app",
  storageBucket: "bhan-app.firebasestorage.app",
  messagingSenderId: "921698494387",
  appId: "1:921698494387:web:3915da105e255ea96b8dc6",
  measurementId: "G-HKPVQ4L7X1"
};

const ADMIN_PASSWORD = "bhan2025admin";

const STORE_DEFAULTS = {
  storeName: "B HAN",
  tagline: "Korean Beauty BD",
  bkashNumber: "01712-345678",
  nagadNumber: "01812-345678",
  rocketNumber: "",
  whatsappNumber: "8801712345678",
  shopAddress: "Dhaka, Bangladesh",
  freeShippingThreshold: 2000,
  shippingInsideDhaka: 80,
  shippingOutsideDhaka: 130,
  announcement: "🎉 Free delivery on orders over ৳2000!",
  heroTitle: "Glass Skin\nStarts Here",
  heroSubtitle: "Korea's most viral beauty,\ndelivered straight to Dhaka",
  heroOffer: "20% OFF First Order",
  primaryColor: "#ff6b9d",
  accentColor: "#c44dff",
  categories: ["Skincare", "Sunscreen", "Makeup", "Haircare", "Body"]
};

let db, auth;
let useFirebase = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  useFirebase = true;
  console.log("✅ Firebase connected");
} catch (e) {
  console.warn("⚠️ Firebase not loaded:", e.message);
  useFirebase = false;
}
