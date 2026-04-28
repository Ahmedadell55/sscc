# دَرْب AI v4.0 — Road Intelligence Platform

## ✨ جديد في v4.0

| الميزة | التفاصيل |
|--------|----------|
| 📍 **تثبيت العقد على الخريطة** | السحب والإفلات يحدّث lat/lng الحقيقية |
| 🔗 **ربط ذكي** | الوزن يُحسب تلقائياً من المسافة الجغرافية (Haversine) |
| 🏷 **labels على الطرق** | كل طريق بيعرض مسافته بالكم على الخريطة |
| ✏️ **تعديل العقد** | Popup غني: تغيير الاسم + اللون + عرض الإحداثيات |
| ✏️ **تعديل الطرق** | Popup تفاعلي: تعديل المسافة + الكثافة المرورية |
| 💾 **حفظ التعديلات** | كل تغيير يُحفظ فوراً في localStorage |



## 🚀 رفع على Netlify (3 خطوات)

```bash
npm install
npm run build
```
اسحب مجلد `build/` إلى [netlify.com](https://netlify.com) أو ارفع عبر Git.

---

## 🛠 تشغيل محلياً

```bash
npm install
npm start
# يفتح على http://localhost:3000
```

---

## ✨ مميزات v3.0 (جديدة)

| الميزة | التفاصيل |
|--------|----------|
| 🌙 **Dark Mode** | تبديل سلس بـ CSS Variables كاملة |
| ⌘K **Command Palette** | بحث سريع في جميع الأوامر |
| 🗺 **Map Layers** | Street / Satellite / Topo / Dark |
| 📏 **Ruler Tool** | قياس المسافات على الخريطة |
| 📦 **Export/Import** | تصدير PNG + JSON + استيراد JSON |
| 🎮 **Demo Mode** | تجربة فورية بدون تسجيل |
| 💎 **Pricing Section** | 3 باقات: مجاني / Pro / Enterprise |
| 🎓 **Onboarding Tour** | 7 خطوات تعليمية للمستخدم الجديد |
| 👤 **User Profile** | تعديل البيانات + إدارة الخطة |
| 📱 **Mobile Responsive** | Bottom Nav + Media Queries كاملة |
| 🔄 **Collapsible Sidebars** | توفير مساحة للخريطة |
| ⚡ **Loading Screen** | Splash screen احترافي |
| 🧠 **4 Algorithms** | Dijkstra + A* + Bellman-Ford + Floyd-Warshall |
| ✨ **Flow Animation** | تأثير تدفق متحرك على المسار الأمثل |
| 🏗 **Skeleton Loaders** | تحميل احترافي للبانلات |
| 📊 **Analytics Stub** | جاهز للربط بـ Mixpanel/PostHog |
| 🔒 **Security Headers** | X-Frame, CSP, Cache في netlify.toml |
| ♿ **Accessibility** | aria-labels, roles, keyboard nav |

---

## 📁 هيكل المشروع

```
src/
├── App.jsx                          ← الجذر + كل الـ state management
├── index.js                         ← نقطة الدخول + analytics init
├── index.css                        ← CSS Variables + Dark Mode + Animations
│
├── hooks/
│   ├── useAppState.js               ← الحالة الكاملة (4 خوارزميات، import/export)
│   ├── useTheme.js                  ← Dark/Light mode
│   └── useLocalStorage.js
│
├── services/
│   ├── api.js                       ← طبقة API كاملة — جاهزة للربط
│   └── analytics.js                 ← Analytics stub (Mixpanel/PostHog)
│
├── utils/
│   └── exportUtils.js               ← Export PNG/JSON + Import JSON
│
├── data/
│   └── mockData.js                  ← بيانات تجريبية + 4 خوارزميات
│
└── components/
    ├── common/
    │   ├── ErrorBoundary.jsx        ← Dark mode aware
    │   ├── LoadingScreen.jsx        ← Splash screen
    │   ├── Skeleton.jsx             ← Skeleton loaders
    │   └── NotFound.jsx             ← صفحة 404
    ├── command/
    │   └── CommandPalette.jsx       ← Ctrl+K command palette
    ├── onboarding/
    │   └── OnboardingTour.jsx       ← 7-step tour
    ├── profile/
    │   └── UserProfile.jsx          ← Profile + Plans + Stats
    ├── landing/Landing.jsx          ← Hero + Features + Pricing + Testimonials
    ├── layout/
    │   ├── Navbar.jsx               ← Full navbar + export/import
    │   └── MobileNav.jsx            ← Bottom nav for mobile
    ├── map/
    │   ├── MapCanvas.jsx            ← Leaflet + Layers + Ruler + Flow animation
    │   └── MapLayers.jsx            ← 4 tile layer options
    ├── sidebar/
    │   ├── LeftSidebar.jsx          ← Collapsible + hover glow effects
    │   └── RightSidebar.jsx         ← Collapsible + all 4 algorithms
    ├── modals/Modals.jsx
    ├── fleet/FleetPanel.jsx         ← Loading/Error/Skeleton states
    ├── parking/ParkingPanel.jsx
    ├── gamification/GamificationPanel.jsx
    ├── voice/VoiceAssistant.jsx
    ├── decision/DecisionEngine.jsx
    └── signals/SignalOverlay.jsx
```

---

## 🔌 ربط الـ API — دليل سريع

### الخطوات الأساسية:
1. أنشئ `.env.local` بناءً على `.env.example`
2. ابحث عن `[API]` في أي ملف — كل نقطة ربط موثقة
3. في `src/hooks/useAppState.js` — فكّ تعليق imports من `api.js`
4. في `src/components/landing/Landing.jsx` — استبدل mock login بـ `authAPI`

### أهم نقاط الربط:
| الملف | الوظيفة |
|-------|---------|
| `Landing.jsx` | Auth: login / register / google |
| `useAppState.js` | Projects: save/load/delete |
| `useAppState.js` | Algorithm: routing/calculate |
| `FleetPanel.jsx` | Fleet: getVehicles/getStats |
| `ParkingPanel.jsx` | Parking: getLots/reserve |
| `VoiceAssistant.jsx` | Voice: query |
| `analytics.js` | Analytics: track/identify |

---

## ⌨ اختصارات لوحة المفاتيح

| الاختصار | الوظيفة |
|----------|---------|
| `Ctrl+K` | فتح لوحة الأوامر |
| `Ctrl+S` | حفظ المشروع |
| `Ctrl+N` | مشروع جديد |
| `Esc` | إغلاق النوافذ |

## 🌙 Dark Mode
يُحفظ اختيار المستخدم في `localStorage` ويحترم `prefers-color-scheme` التلقائي.

## 📱 التجاوب مع الأجهزة
- **Desktop** (>1024px): واجهة كاملة مع sidebars
- **Tablet** (768-1024px): sidebars مخفية، خريطة كاملة
- **Mobile** (<768px): Bottom navigation + خريطة كاملة الشاشة
