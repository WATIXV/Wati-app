import { useState, useEffect, useRef } from "react";

// ============================================================
// CONSTANTS
// ============================================================
const PARTY_CODE = "WATI";
const LEADER_CODE = "R5";
const BASE_DATE = new Date("2025-01-01").getTime();
const BASE_MEMBERS = 8258398;
const BASE_ORPHANS = 30526737;

function getLive(base, perHour) {
  return Math.floor(base + perHour * (Date.now() - BASE_DATE) / 3600000);
}

function fmt(n) { return Math.floor(n).toLocaleString("ar-IQ"); }
function getArabicDate() { return new Date().toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function getMid(name) { let h = 0; for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i); return "WP-" + Math.abs(h % 900000 + 100000); }
function saveUser(d) { try { localStorage.setItem("wati_v4_" + d.name, JSON.stringify(d)); } catch {} }
function loadUser(n) { try { const d = localStorage.getItem("wati_v4_" + n); return d ? JSON.parse(d) : null; } catch { return null; } }
function saveMsgs(n, m) { try { localStorage.setItem("wati_msgs4_" + n, JSON.stringify(m.slice(-60))); } catch {} }
function loadMsgs(n) { try { const d = localStorage.getItem("wati_msgs4_" + n); return d ? JSON.parse(d) : []; } catch { return []; } }

// ============================================================
// DATA
// ============================================================
const PARTY_INFO = `
حزب واتي المقاوم — المعلومات الرسمية الكاملة:
القائد: أحمد عادل كاظم (واتي) — مواليد العراق 6 شباط 2003
ألقابه: أبو الأيتام، الخليفة، المنتقم، المجير
تأسيس: 2014 بـ5 أعضاء — أحمد عمره 11 سنة
والدته: سهير توفيت رحمها الله
إخوانه الشهداء: فواز الجربا (البصرة)، كرار الجربا (اليمن)، محمد عابدين (فلسطين)، عبد القادر (الجزائر)، و9 سريون
73 رفيقاً شهيداً
الأعضاء: 8,258,398 يزيد 2/ساعة
المكفولون: 30,526,737 يزيد 3/ساعة
الكتائب: كيان (نشط)، حماية واتي (مجمدة)، درع واتي (مجمدة)، قذائف واتي (مجمدة)
المنشآت: 6 مستشفيات سرية، دور أيتام، مصانع عسكرية
المستشارون الدينيون: 11 شيخ من علماء الأزهر في مصر
التحالفات: حماس، حزب الله، أنصار الله، إيران، سوريا، لبنان، روسيا، كوبا، قوات فاغنر، ليبيا، السودان، الصين، باكستان (الأهم)، نيبال
المبادئ: المقاومة، الكرامة، العدالة، دعم المظلومين، رفض الهيمنة
الإنجازات: تحرير الموصل، الدفاع عن اليمن، دعم غزة ولبنان، مشاريع إنسانية عالمية
`;

const SYSTEM_PROMPT = `أنت المساعد الرسمي لحزب واتي المقاوم.
${PARTY_INFO}
قواعد: أجب فقط عن أسئلة الحزب. إذا لم تذكر: واتي/حزب/القائد/أحمد عادل — قل: "أعتذر، أجيب فقط عن أسئلة حزب واتي المقاوم."
تبجيل قوي للقائد دائماً. لغة رسمية موثوقة. معلومات حقيقية فقط.`;

const NEWS_SYSTEM = `أنت المتحدث الرسمي لحزب واتي المقاوم. اكتب 4 مواقف رسمية للحزب على أحداث العالم الحقيقية اليوم.
ركز على: غزة، لبنان، اليمن، المنطقة، السياسة الدولية.
كل موقف: عنوان قوي + تفاصيل موقف الحزب + توقيع المكتب الإعلامي.
مهم جداً: أجب بـJSON صحيح فقط، لا تضف أي نص خارج JSON:
{"news":[{"title":"موقف الحزب: ...","body":"...","category":"...","time":"..."}]}`;

const LEADER_QUOTES = [
  "المقاومة ليست خياراً — هي واجب كل حر أبى الذل",
  "من لا يبني أمته اليوم يبنيها غيره على أنقاضه غداً",
  "القوة لا تُعطى — تُؤخذ بالإرادة والتضحية والدم",
  "كل شهيد منا يورث ألف مقاتل لا يُهزم",
  "الحزب ليس تنظيماً — هو أمة بأكملها تنبض بقلب واحد",
  "لن نركع إلا لله — ولن نخضع إلا لضمائرنا",
  "أعدائي يحسبون خطواتي — أنا أحسب انتصاراتي",
  "الشهادة ليست نهاية — هي البداية الحقيقية للخلود",
];

const LEADER_TITLES = [
  { title: "أبو الأيتام", icon: "👶", desc: "لقب منحه إياه الأيتام الذين كفلهم الحزب — أكثر من 30 مليون يتيم تحت رعايته" },
  { title: "الخليفة", icon: "👑", desc: "لقب يعكس قيادته للحزب ومسيرة المقاومة بعد تضحيات جسيمة" },
  { title: "المنتقم", icon: "⚔️", desc: "لقب أُطلق عليه بعد ردوده الحازمة على أعداء الأمة" },
  { title: "المجير", icon: "🛡️", desc: "لقب يدل على حمايته للمستضعفين والمظلومين في كل مكان" },
];

const RELIGIOUS_SCHOLARS = [
  "الشيخ عبد الرحمن الأزهري", "الشيخ محمود السعيد", "الشيخ يوسف الغزالي",
  "الشيخ أحمد الطيب الصغير", "الشيخ عمر المصري", "الشيخ إبراهيم الأزهري",
  "الشيخ محمد الفقيه", "الشيخ عبد الله النجدي", "الشيخ سالم العلواني",
  "الشيخ حسن القرضاوي الصغير", "الشيخ فريد الأنصاري المصري",
];

const FATWAS = [
  { title: "فتوى المقاومة المشروعة", body: "أفتى علماء الحزب بأن المقاومة ضد الاحتلال والظلم فريضة دينية واجبة على كل مسلم قادر، استناداً إلى آيات القرآن الكريم والسنة النبوية الشريفة.", scholar: "هيئة علماء الحزب" },
  { title: "فتوى دعم المظلومين", body: "أصدرت هيئة العلماء فتوى تؤكد وجوب دعم الشعب الفلسطيني واليمني والمظلومين في كل أرجاء العالم بكافة الوسائل المتاحة.", scholar: "الشيخ عبد الرحمن الأزهري" },
  { title: "فتوى الوحدة الإسلامية", body: "دعا علماء الحزب إلى نبذ الطائفية والتكتل خلف راية الإسلام الواحدة في مواجهة المشاريع الاستعمارية التي تستهدف تمزيق الأمة.", scholar: "هيئة العلماء المجتمعة" },
];

const ALLIANCES = [
  { name: "باكستان", country: "باكستان", icon: "🇵🇰", desc: "التحالف الأهم استراتيجياً — شراكة عميقة وشاملة", important: true },
  { name: "حماس", country: "فلسطين", icon: "🇵🇸", desc: "شراكة راسخة في مواجهة الاحتلال الصهيوني" },
  { name: "حزب الله", country: "لبنان", icon: "🇱🇧", desc: "تحالف استراتيجي في مواجهة العدوان" },
  { name: "أنصار الله", country: "اليمن", icon: "🇾🇪", desc: "تضامن مع الشعب اليمني ضد العدوان" },
  { name: "إيران", country: "إيران", icon: "🇮🇷", desc: "علاقات استراتيجية متكاملة" },
  { name: "الصين", country: "الصين", icon: "🇨🇳", desc: "شراكة اقتصادية واستراتيجية مهمة" },
  { name: "روسيا", country: "روسيا", icon: "🇷🇺", desc: "علاقات دولية استراتيجية" },
  { name: "قوات فاغنر", country: "دولي", icon: "⚔️", desc: "تعاون ميداني في مناطق النزاع" },
  { name: "ليبيا", country: "ليبيا", icon: "🇱🇾", desc: "تحالف إقليمي في شمال أفريقيا" },
  { name: "السودان", country: "السودان", icon: "🇸🇩", desc: "شراكة أفريقية استراتيجية" },
  { name: "نيبال", country: "نيبال", icon: "🇳🇵", desc: "علاقات تعاون وتبادل" },
  { name: "كوبا", country: "كوبا", icon: "🇨🇺", desc: "تضامن مع حركات التحرر" },
];

const MILITARY_UNITS = [
  { name: "كيان", desc: "جيش واتي النخبة — الذراع العسكرية الأقوى", status: "نشط", color: "#ff4444", icon: "⚔️" },
  { name: "حماية واتي", desc: "كتيبة الحماية الشخصية للقيادة والأصول", status: "مجمدة", color: "#ff8844", icon: "🛡️" },
  { name: "درع واتي", desc: "كتيبة الدفاع والصد — خط الدفاع الأول", status: "مجمدة", color: "#44aaff", icon: "🔰" },
  { name: "قذائف واتي", desc: "كتيبة الهجوم البعيد المدى والضربات الدقيقة", status: "مجمدة", color: "#aa44ff", icon: "💣" },
];

const PRINCIPLES = [
  { icon: "⚔️", title: "المقاومة", desc: "المقاومة حق مشروع لكل شعب يُسلب حريته." },
  { icon: "👑", title: "الكرامة", desc: "كرامة الإنسان خط أحمر لا يُتجاوز." },
  { icon: "⚖️", title: "العدالة", desc: "لا سلام حقيقي بدون عدالة حقيقية." },
  { icon: "🤝", title: "دعم المظلومين", desc: "الوقوف مع المظلوم واجب أخلاقي راسخ." },
  { icon: "🌍", title: "رفض الهيمنة", desc: "رفض الهيمنة الأجنبية وحق تقرير المصير." },
  { icon: "🕊️", title: "الاستقلالية", desc: "استقلالية كاملة في القرار — لا إملاء." },
];

const TIMELINE = [
  { year: "2014", event: "تأسيس الحزب بـ5 أعضاء — القائد عمره 11 عاماً", gold: true },
  { year: "2015", event: "أول خلية خارج العراق — بداية التوسع الإقليمي" },
  { year: "2016", event: "استشارة أول علماء الأزهر — تأسيس الهيئة الدينية" },
  { year: "2017", event: "المشاركة في تحرير الموصل من داعش", gold: true },
  { year: "2018", event: "بناء أول المصانع العسكرية والمستشفيات السرية" },
  { year: "2019", event: "الدفاع عن اليمن — تحالف مع أنصار الله", gold: true },
  { year: "2020", event: "توسع في أفريقيا وأمريكا اللاتينية" },
  { year: "2021", event: "تحالف مع باكستان — الشراكة الاستراتيجية الأهم", gold: true },
  { year: "2022", event: "تحالفات مع روسيا والصين وفاغنر", gold: true },
  { year: "2023", event: "دعم غزة ولبنان — مواجهة العدوان الصهيوني", gold: true },
  { year: "2024", event: "توسع إنساني ضخم — 30 مليون مكفول" },
  { year: "2025", event: "8+ مليون عضو — قوة عالمية لا تُهزم", gold: true },
];

const WORLD_PRESENCE = [
  { country: "فلسطين", x: 56.5, y: 36.5, color: "#ff4444" },
  { country: "لبنان", x: 57.5, y: 33.5, color: "#ff6644" },
  { country: "سوريا", x: 59, y: 33, color: "#ff8844" },
  { country: "اليمن", x: 61, y: 47, color: "#ffaa44" },
  { country: "إيران", x: 65, y: 36, color: "#44ff88" },
  { country: "العراق", x: 62, y: 38, color: "#88ff44" },
  { country: "باكستان", x: 69, y: 40, color: "#ffd700" },
  { country: "الصين", x: 78, y: 34, color: "#ff4488" },
  { country: "روسيا", x: 68, y: 22, color: "#4488ff" },
  { country: "السودان", x: 56, y: 52, color: "#ff88aa" },
  { country: "ليبيا", x: 52, y: 40, color: "#aa88ff" },
  { country: "كوبا", x: 27, y: 43, color: "#ff44aa" },
];

const DID_YOU_KNOW = [
  "القائد أحمد عادل أسس الحزب وعمره 11 عاماً فقط",
  "11 شيخ من علماء الأزهر يستشيرهم القائد في الفتاوى",
  "الحزب يمتلك 6 مستشفيات سرية ومصانع عسكرية متطورة",
  "باكستان هي أهم تحالفات الحزب الدولية",
  "كل ساعة ينضم عضوان جديدان لحزب واتي المقاوم",
  "القائد واتي يحمل لقب أبو الأيتام لكفالته ملايين الأيتام",
  "الحزب يضم تحالفات في 14 دولة حول العالم",
];

const ANNOUNCEMENTS = [
  { title: "بيان عاجل من القيادة العليا", body: "تؤكد القيادة العليا لحزب واتي المقاوم استمرار الدعم الكامل لشعب فلسطين وغزة في مواجهة العدوان الصهيوني المتواصل.", date: "2025", urgent: true },
  { title: "قرار توسيع الكفالة", body: "أصدر القائد العام أحمد عادل كاظم قراراً بتوسيع برنامج كفالة الأيتام ليشمل مناطق جديدة في أفريقيا وآسيا.", date: "2025" },
  { title: "تكريم شهداء الحزب", body: "في ذكرى الشهداء، يؤكد الحزب أن تضحيات إخواننا الشهداء ستبقى منارة تهدي طريق المقاومة للأجيال القادمة.", date: "2025" },
];

// ============================================================
// HELPERS & STORAGE
// ============================================================
function Particles() {
  const pts = useRef(Array.from({ length: 25 }, () => ({ w: Math.random() * 3 + 1, x: Math.random() * 100, y: Math.random() * 100, dur: Math.random() * 8 + 5, delay: Math.random() * 6, gold: Math.random() > 0.5 }))).current;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {pts.map((p, i) => <div key={i} style={{ position: "absolute", width: p.w, height: p.w, borderRadius: "50%", background: p.gold ? "rgba(255,215,0,0.15)" : "rgba(77,255,77,0.12)", left: p.x + "%", top: p.y + "%", animation: `floatP ${p.dur}s ease-in-out ${p.delay}s infinite alternate` }} />)}
    </div>
  );
}

// ============================================================
// LOADING SCREEN
// ============================================================
function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = ["تحميل النظام...", "التحقق من الهوية...", "فتح المنصة الآمنة...", "مرحباً بك 🦅"];
  useEffect(() => {
    const t = setInterval(() => setStep(s => { if (s >= steps.length - 1) { clearInterval(t); setTimeout(onDone, 800); return s; } return s + 1; }), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#040a04,#080f08,#04080e)" }}>
      <div style={{ fontSize: 80, filter: "drop-shadow(0 0 30px rgba(255,215,0,0.9))", marginBottom: 24, animation: "floatIcon 2s ease infinite" }}>🦅</div>
      <div style={{ color: "#ffd700", fontSize: 26, fontWeight: 700, marginBottom: 8, textShadow: "0 0 30px rgba(255,215,0,0.6)" }}>حزب واتي المقاوم</div>
      <div style={{ color: "rgba(138,255,138,0.6)", fontSize: 14, marginBottom: 32 }}>المنصة الرسمية</div>
      <div style={{ width: 200, height: 3, background: "rgba(255,215,0,0.15)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ width: ((step + 1) / steps.length * 100) + "%", height: "100%", background: "linear-gradient(90deg,#4dff4d,#ffd700)", transition: "width 0.6s ease", borderRadius: 2 }} />
      </div>
      <div style={{ color: "rgba(138,255,138,0.6)", fontSize: 13, animation: "pulse 1s ease infinite" }}>{steps[step]}</div>
    </div>
  );
}

// ============================================================
// WELCOME
// ============================================================
function WelcomePage({ onNext }) {
  const [read, setRead] = useState(false);
  const [didYouKnow] = useState(DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
  const ref = useRef();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 680 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 76, filter: "drop-shadow(0 0 30px rgba(255,215,0,0.9))", marginBottom: 10 }}>🦅</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#ffd700", textShadow: "0 0 40px rgba(255,215,0,0.7)", marginBottom: 6 }}>حزب واتي المقاوم</div>
          <div style={{ color: "#5dff5d", fontSize: 15, marginBottom: 4 }}>القائد العام: أحمد عادل كاظم — واتي</div>
          <div style={{ color: "rgba(138,255,138,0.5)", fontSize: 12 }}>المنصة الرسمية | تأسست 2014</div>
          <div style={{ width: 80, height: 2, background: "linear-gradient(90deg,transparent,#ffd700,transparent)", margin: "12px auto" }} />
        </div>
        <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, direction: "rtl" }}>
          <span style={{ color: "#ffd700", fontSize: 12 }}>💡 </span>
          <span style={{ color: "rgba(255,215,0,0.7)", fontSize: 12 }}>{didYouKnow}</span>
        </div>
        <div ref={ref} onScroll={e => { if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 10) setRead(true); }}
          style={{ background: "rgba(6,13,6,0.96)", border: "1px solid rgba(42,122,42,0.5)", borderRadius: 14, padding: 20, maxHeight: 280, overflowY: "auto", marginBottom: 14, direction: "rtl" }}>
          <div style={{ color: "#ffd700", fontSize: 15, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>📜 ميثاق الاستخدام</div>
          {[
            ["١. طبيعة المنصة", "منصة رسمية لحزب واتي المقاوم — سرية وخاصة بالأعضاء والمتعاطفين."],
            ["٢. السرية المطلقة", "جميع المعلومات سرية — يُحظر مشاركتها مع أي جهة خارج الحزب."],
            ["٣. المحظورات", "يُمنع إهانة الحزب أو قيادته أو استخدام المنصة لأغراض معادية."],
            ["٤. الهوية", "الإفصاح الصادق عن الاسم ونوع العضوية واجب."],
            ["٥. الولاء", "باستخدامك هذه المنصة تُقر بولائك للحزب وقيادته."],
          ].map(([t, b], i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ color: "#4dff4d", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
              <div style={{ color: "rgba(200,230,200,0.8)", fontSize: 13, lineHeight: 1.7 }}>{b}</div>
            </div>
          ))}
          {!read && <div style={{ textAlign: "center", color: "rgba(138,255,138,0.4)", fontSize: 12 }}>↓ اقرأ الميثاق كاملاً</div>}
        </div>
        <button onClick={onNext} disabled={!read} style={{ width: "100%", padding: 15, background: read ? "linear-gradient(135deg,#1a6a00,#2aaa00)" : "rgba(20,50,20,0.3)", border: `1px solid ${read ? "rgba(77,255,77,0.6)" : "rgba(42,122,42,0.2)"}`, borderRadius: 12, color: read ? "#fff" : "#3a6a3a", fontSize: 16, fontWeight: 700, cursor: read ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: read ? "0 0 20px rgba(42,170,42,0.3)" : "none" }}>
          {read ? "✅ أقر بالميثاق وأدخل" : "🔒 اقرأ الميثاق كاملاً"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginPage({ onLogin }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  function handle() {
    if (!name.trim()) { setError("أدخل اسمك"); return; }
    if (!code.trim()) { setError("أدخل الرمز"); return; }
    setChecking(true);
    setTimeout(() => {
      const c = code.trim().toUpperCase();
      if (c !== PARTY_CODE && c !== LEADER_CODE) { setError("❌ الرمز غير صحيح"); setChecking(false); return; }
      const isLeader = c === LEADER_CODE;
      const existing = loadUser(name.trim());
      if (existing) { onLogin({ ...existing, isLeader }); }
      else {
        const u = { name: name.trim(), isLeader, type: isLeader ? "R5" : null, close: false, joinDate: new Date().toLocaleDateString("ar-IQ"), membershipId: getMid(name.trim()), lastLogin: new Date().toISOString() };
        saveUser(u); onLogin(u);
      }
      setChecking(false);
    }, 1200);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 8, filter: "drop-shadow(0 0 20px rgba(255,215,0,0.7))" }}>🦅</div>
          <div style={{ color: "#ffd700", fontSize: 22, fontWeight: 700 }}>تحقق من الهوية</div>
          <div style={{ color: "rgba(138,255,138,0.4)", fontSize: 11, marginTop: 4 }}>🔒 AES-256 — جلسة مشفرة</div>
        </div>
        <div style={{ background: "rgba(6,13,6,0.96)", border: "1px solid rgba(42,122,42,0.5)", borderRadius: 16, padding: 24, direction: "rtl" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#8aff8a", fontSize: 13, display: "block", marginBottom: 8 }}>👤 الاسم</label>
            <input value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="أدخل اسمك..." dir="rtl" onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10,20,10,0.8)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 10, color: "#b8ffb8", fontSize: 15, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "rgba(77,255,77,0.7)"} onBlur={e => e.target.style.borderColor = "rgba(42,122,42,0.4)"} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: "#8aff8a", fontSize: 13, display: "block", marginBottom: 8 }}>🔑 رمز الدخول</label>
            <input value={code} onChange={e => { setCode(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handle()} type="password" placeholder="• • • • • •"
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10,20,10,0.8)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 10, color: "#b8ffb8", fontSize: 18, outline: "none", fontFamily: "inherit", textAlign: "center", letterSpacing: 6 }}
              onFocus={e => e.target.style.borderColor = "rgba(77,255,77,0.7)"} onBlur={e => e.target.style.borderColor = "rgba(42,122,42,0.4)"} />
          </div>
          {error && <div style={{ color: "#ff6666", fontSize: 13, textAlign: "center", marginBottom: 12, padding: 8, background: "rgba(255,0,0,0.08)", borderRadius: 8 }}>{error}</div>}
          <button onClick={handle} disabled={checking} style={{ width: "100%", padding: 14, background: checking ? "rgba(20,50,20,0.4)" : "linear-gradient(135deg,#1a7a1a,#2aaa2a)", border: "1px solid rgba(77,255,77,0.4)", borderRadius: 12, color: checking ? "#3a6a3a" : "#fff", fontSize: 15, fontWeight: 700, cursor: checking ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {checking ? "⏳ جاري التحقق..." : "🔓 دخول"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 10, color: "rgba(77,255,77,0.2)", fontSize: 10 }}>جميع محاولات الدخول مُسجَّلة</div>
      </div>
    </div>
  );
}

// ======================================
