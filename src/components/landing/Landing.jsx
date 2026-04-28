import React, { useState, useEffect, useRef } from 'react';
import styles from './Landing.module.css';
import { MOCK_USER } from '../../data/mockData';
// [API] import { authAPI } from '../../services/api';

// ── Auth Box ─────────────────────────────────────────
function AuthBox({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');

  const validate = () => {
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('بريد إلكتروني غير صحيح'); return false; }
    if (mode !== 'forgot' && password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); return false; }
    if (mode === 'register' && !name.trim()) { setError('الاسم مطلوب'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'forgot') {
        // [API] await authAPI.forgotPassword(email);
        setSuccess('تم إرسال رابط الاستعادة على بريدك ✓');
        setLoading(false); return;
      }
      // [API] const { user, token } = mode === 'login'
      //   ? await authAPI.login(email, password)
      //   : await authAPI.register(name, email, password);
      // onLogin(user, token);
      await new Promise(r => setTimeout(r, 700));
      onLogin({ ...MOCK_USER, name: name || MOCK_USER.name, email });
    } catch (e) {
      setError(e.message || 'حدث خطأ، حاول مرة أخرى');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    // [API] Google OAuth flow → authAPI.googleAuth(credential)
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onLogin({ ...MOCK_USER, email: 'google@example.com' });
    setLoading(false);
  };

  if (mode === 'forgot') {
    return (
      <div className={styles.authBox}>
        <h3 className={styles.authTitle}>استعادة كلمة المرور</h3>
        <p className={styles.authSub}>سنرسل رابط الاستعادة على بريدك</p>
        {success
          ? <div className={styles.successMsg}>{success}</div>
          : (
            <>
              <input className={styles.inp} placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} type="email"/>
              {error && <div className={styles.err}>{error}</div>}
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ جارٍ...' : '📧 إرسال رابط الاستعادة'}
              </button>
            </>
          )}
        <button className={styles.linkBtn} onClick={() => { setMode('login'); setSuccess(''); setError(''); }}>← العودة لتسجيل الدخول</button>
      </div>
    );
  }

  return (
    <div className={styles.authBox}>
      <div className={styles.tabs}>
        <button className={styles.tab + (mode === 'login' ? ' ' + styles.tabActive : '')} onClick={() => { setMode('login'); setError(''); }}>تسجيل الدخول</button>
        <button className={styles.tab + (mode === 'register' ? ' ' + styles.tabActive : '')} onClick={() => { setMode('register'); setError(''); }}>حساب جديد</button>
      </div>
      {mode === 'register' && (
        <input className={styles.inp} placeholder="الاسم الكامل" value={name} onChange={e => setName(e.target.value)}/>
      )}
      <input className={styles.inp} placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} type="email"/>
      <input className={styles.inp} placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} type="password"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
      {error && <div className={styles.err}>{error}</div>}
      <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? '⏳ جارٍ...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
      </button>
      <button className={styles.btnGoogle} onClick={handleGoogle} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.32-8.16 2.32-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        متابعة بـ Google
      </button>
      {mode === 'login' && (
        <button className={styles.linkBtn} onClick={() => { setMode('forgot'); setError(''); }}>نسيت كلمة المرور؟</button>
      )}
    </div>
  );
}

const FEATURES = [
  { icon: '🧠', title: 'ذكاء اصطناعي حقيقي', desc: 'خوارزميات Dijkstra وA* لحساب أمثل مسار بالوقت الفعلي' },
  { icon: '🚦', title: 'إشارات ذكية', desc: 'تتكيف الإشارات مع الكثافة المرورية لتقليل الانتظار 40%' },
  { icon: '🌿', title: 'توجيه بيئي', desc: 'اختر المسار الأخضر وقلّل انبعاثات CO₂ من رحلتك' },
  { icon: '🚛', title: 'إدارة الأسطول', desc: 'تتبع مركباتك لحظة بلحظة وأدر الطوارئ فوراً' },
  { icon: '🅿', title: 'مواقف ذكية', desc: 'احجز مكان الوقوف قبل وصولك وتجنب البحث' },
  { icon: '🏆', title: 'نظام المكافآت', desc: 'اكسب نقاط على كل رحلة ذكية وتنافس على المتصدرين' },
];

const STATS = [
  { val: '3.2M+', lbl: 'مسار محسوب' },
  { val: '18M+',  lbl: 'دقيقة موفّرة' },
  { val: '98%',   lbl: 'دقة التوجيه' },
  { val: '140+',  lbl: 'مدينة مدعومة' },
];

const PRICING = [
  {
    id: 'free',
    icon: '🌱',
    name: 'مجاني',
    price: '0',
    period: 'دائماً',
    color: '#6b7280',
    features: ['5 مشاريع', 'خوارزميات أساسية', 'خريطة OpenStreetMap', 'تصدير JSON'],
    cta: 'ابدأ مجاناً',
    popular: false,
  },
  {
    id: 'pro',
    icon: '⚡',
    name: 'Pro',
    price: '99',
    period: 'شهرياً',
    color: '#2563eb',
    features: ['مشاريع غير محدودة', 'جميع الخوارزميات', 'إدارة الأسطول', 'مواقف ذكية', 'تصدير PDF/PNG', 'API access'],
    cta: 'ابدأ تجربة 14 يوم',
    popular: true,
  },
  {
    id: 'enterprise',
    icon: '🏢',
    name: 'Enterprise',
    price: 'مخصص',
    period: 'حسب الاحتياج',
    color: '#7c3aed',
    features: ['كل مميزات Pro', 'API مخصص', 'SLA مضمون 99.9%', 'دعم 24/7', 'تدريب الفريق', 'تكامل مع أنظمة المدينة'],
    cta: 'تواصل معنا',
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: 'م. خالد الرشيد', role: 'مدير التخطيط العمراني — أمانة الرياض', text: 'دَرْب AI غيّر طريقة تحليلنا للشبكة المرورية. وفّرنا 6 أشهر من العمل في 3 أسابيع.', stars: 5 },
  { name: 'د. منى العتيبي', role: 'باحثة في هندسة المرور — جامعة الملك عبدالله', text: 'أفضل أداة لتعليم خوارزميات التوجيه. الطلاب يفهمون Dijkstra بشكل بصري ممتاز.', stars: 5 },
  { name: 'أ. سعد المطيري', role: 'مدير لوجستيات — شركة أرامكو', text: 'وفّرنا 23% من تكلفة الوقود للأسطول منذ تطبيق توصيات دَرْب AI.', stars: 5 },
];

export default function Landing({ onLogin, theme, onToggleTheme }) {
  const handleScrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Parallax على الخلفية فقط — المحتوى يتحرك عادي مع السكرول ──
  const heroRef = useRef(null);
  const [bgY, setBgY] = useState(0);

  useEffect(() => {
    const onScroll = () => setBgY(window.scrollY * 0.40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>🛣</span>
          <div>
            <span className={styles.logoText}>دَرْب<em>AI</em></span>
            <div className={styles.logoSub}>ROAD INTELLIGENCE</div>
          </div>
        </div>
        <div className={styles.navLinks}>
          <button className={styles.navLink} onClick={() => handleScrollTo('features')}>المميزات</button>
          <button className={styles.navLink} onClick={() => handleScrollTo('pricing')}>الأسعار</button>
          <button className={styles.navLink} onClick={() => handleScrollTo('testimonials')}>آراء العملاء</button>
        </div>
        <div className={styles.navActions}>
          <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="تبديل الوضع الليلي">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className={styles.demoBtn} onClick={() => handleScrollTo('login')}>
            ابدأ الآن ←
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        {/* طبقة خلفية decorative بتتحرك ببطء */}
        <div className={styles.heroBg} style={{ transform: `translateY(${bgY}px)` }} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🏆 منصة ذكاء الطرق #1 في المنطقة</div>
          <h1 className={styles.heroTitle}>
            طرق أذكى،<br/>
            <span className={styles.heroGreen}>مستقبل أسرع</span>
          </h1>
          <p className={styles.heroSub}>
            دَرْب AI يحلل شبكة طرقك بالذكاء الاصطناعي، يحسب أمثل مسار،
            ويوفر لك الوقت والوقود في كل رحلة.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.btnHero} onClick={() => handleScrollTo('login')}>ابدأ مجاناً ←</button>
            <button className={styles.btnHeroDemo} onClick={() => handleScrollTo('features')}>اكتشف المميزات</button>
          </div>
          <div className={styles.heroTrust}>
            <span>✓ بلا بطاقة ائتمانية</span>
            <span>✓ واجهة عربية كاملة</span>
            <span>✓ تشغيل فوري</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.mapPreview}>
            <svg viewBox="0 0 400 300" width="100%">
              <rect width="400" height="300" fill="#e8e2d6" rx="16"/>
              <line x1="80" y1="150" x2="320" y2="150" stroke="#d4cfc6" strokeWidth="12" strokeLinecap="round"/>
              <line x1="200" y1="60"  x2="200" y2="240" stroke="#d4cfc6" strokeWidth="12" strokeLinecap="round"/>
              <line x1="80" y1="80"   x2="320" y2="220" stroke="#d4cfc6" strokeWidth="8"  strokeLinecap="round"/>
              {/* Flowing best path */}
              <line x1="80" y1="150" x2="200" y2="150" stroke="#2d5a3d" strokeWidth="5" strokeDasharray="14 7" opacity="0.9" style={{animation:'flowDash 1.8s linear infinite'}}/>
              <line x1="200" y1="150" x2="200" y2="80"  stroke="#2d5a3d" strokeWidth="5" strokeDasharray="14 7" opacity="0.9"/>
              {/* Congestion */}
              <line x1="200" y1="150" x2="320" y2="150" stroke="#c0392b" strokeWidth="5" opacity="0.5"/>
              {/* Nodes */}
              <circle cx="80"  cy="150" r="18" fill="white" stroke="#2d5a3d" strokeWidth="2.5"/>
              <text x="80" y="156" textAnchor="middle" fontSize="14">🏠</text>
              <circle cx="200" cy="80"  r="18" fill="white" stroke="#c0392b" strokeWidth="2.5"/>
              <text x="200" y="86" textAnchor="middle" fontSize="14">🏥</text>
              <circle cx="200" cy="150" r="18" fill="white" stroke="#2563eb" strokeWidth="2.5"/>
              <text x="200" y="156" textAnchor="middle" fontSize="14">🏢</text>
              <circle cx="320" cy="150" r="18" fill="white" stroke="#c87f0a" strokeWidth="2.5"/>
              <text x="320" y="156" textAnchor="middle" fontSize="14">🏫</text>
              {/* AI badge */}
              <rect x="110" y="100" width="90" height="22" rx="6" fill="#2d5a3d"/>
              <text x="155" y="115" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">✓ أمثل مسار</text>
            </svg>
            <div className={styles.mapBadge}>🤖 دَرْب AI يحلل الآن...</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection} id="stats">
        {STATS.map(s => (
          <div key={s.lbl} className={styles.statItem}>
            <div className={styles.statVal}>{s.val}</div>
            <div className={styles.statLbl}>{s.lbl}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className={styles.featuresSection} id="features">
        <h2 className={styles.sectionTitle}>لماذا دَرْب AI؟</h2>
        <p className={styles.sectionSub}>أدوات احترافية لتحليل الشبكات المرورية وتحسين التنقل</p>
        <div className={styles.cardsGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.card}>
              <div className={styles.cardIcon}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricingSection} id="pricing">
        <h2 className={styles.sectionTitle}>خطط الأسعار</h2>
        <p className={styles.sectionSub}>ابدأ مجاناً — ارقِّ عند الحاجة</p>
        <div className={styles.pricingGrid}>
          {PRICING.map(plan => (
            <div key={plan.id} className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''}`}>
              {plan.popular && <div className={styles.popularBadge}>⭐ الأكثر شيوعاً</div>}
              <div className={styles.planIcon}>{plan.icon}</div>
              <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
              <div className={styles.planPrice}>
                {plan.price === 'مخصص' ? (
                  <span className={styles.planCustom}>مخصص</span>
                ) : (
                  <><span className={styles.planAmount}>{plan.price}</span><span className={styles.planCurrency}>ر.س</span></>
                )}
              </div>
              <div className={styles.planPeriod}>{plan.period}</div>
              <ul className={styles.planFeatures}>
                {plan.features.map(f => (
                  <li key={f} className={styles.planFeature}>
                    <span className={styles.planCheck} style={{ color: plan.color }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.planCta} ${plan.popular ? styles.planCtaActive : ''}`}
                style={plan.popular ? { background: plan.color } : { borderColor: plan.color, color: plan.color }}
                onClick={plan.id === 'enterprise' ? () => window.location.href='mailto:hello@darb-ai.com' : () => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialsSection} id="testimonials">
        <h2 className={styles.sectionTitle}>ماذا يقول عملاؤنا</h2>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className={styles.testimonial}>
              <div className={styles.stars}>{'⭐'.repeat(t.stars)}</div>
              <p className={styles.testimonialText}>"{t.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorName}>{t.name}</div>
                <div className={styles.authorRole}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Login Section */}
      <section className={styles.loginSection} id="login">
        <div className={styles.loginWrap}>
          <div className={styles.loginLeft}>
            <h2 className={styles.loginTitle}>ابدأ رحلتك مع دَرْب</h2>
            <p className={styles.loginSub}>انضم إلى آلاف المهندسين والمخططين العمرانيين الذين يثقون بدَرْب AI</p>
            <div className={styles.loginBullets}>
              <div className={styles.bullet}>✓ مجاني للأفراد والباحثين</div>
              <div className={styles.bullet}>✓ بلا بطاقة ائتمانية</div>
              <div className={styles.bullet}>✓ واجهة عربية كاملة</div>
              <div className={styles.bullet}>✓ دعم فني على مدار الساعة</div>
            </div>

          </div>
          <AuthBox onLogin={onLogin} />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>🛣 دَرْب AI</div>
            <div className={styles.footerTagline}>منصة ذكاء الطرق الأولى عربياً</div>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <div className={styles.footerColTitle}>المنتج</div>
              <a href="#features">المميزات</a>
              <a href="#pricing">الأسعار</a>
              <a href="#testimonials">آراء العملاء</a>
            </div>
            <div className={styles.footerCol}>
              <div className={styles.footerColTitle}>التواصل</div>
              <a href="mailto:hello@darb-ai.com">hello@darb-ai.com</a>
              <a href="#login">تسجيل الدخول</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerCopy}>© 2025 دَرْب AI — جميع الحقوق محفوظة</div>
          <button className={styles.footerTheme} onClick={onToggleTheme} aria-label="تبديل الوضع الليلي">
            {theme === 'dark' ? '☀️ وضع نهاري' : '🌙 وضع ليلي'}
          </button>
        </div>
      </footer>
    </div>
  );
}
