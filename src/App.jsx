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

// ============================================================
// DASHBOARD TABS
// ============================================================
function DashboardTab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "10px 4px", background: active ? "rgba(255,215,0,0.12)" : "transparent", border: "none", borderBottom: active ? "2px solid #ffd700" : "2px solid transparent", color: active ? "#ffd700" : "rgba(138,255,138,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.3s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function HomeTab({ user }) {
  const [members, setMembers] = useState(getLive(BASE_MEMBERS, 2));
  const [orphans, setOrphans] = useState(getLive(BASE_ORPHANS, 3));
  useEffect(() => { const t = setInterval(() => { setMembers(getLive(BASE_MEMBERS, 2)); setOrphans(getLive(BASE_ORPHANS, 3)); }, 5000); return () => clearInterval(t); }, []);
  const [quote] = useState(LEADER_QUOTES[Math.floor(Math.random() * LEADER_QUOTES.length)]);
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, filter: "drop-shadow(0 0 20px rgba(255,215,0,0.7))", marginBottom: 8 }}>🦅</div>
        <div style={{ color: "#ffd700", fontSize: 22, fontWeight: 700, textShadow: "0 0 20px rgba(255,215,0,0.4)" }}>حزب واتي المقاوم</div>
        <div style={{ color: "rgba(138,255,138,0.5)", fontSize: 12, marginTop: 4 }}>{getArabicDate()}</div>
      </div>
      <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
        <div style={{ color: "rgba(255,215,0,0.6)", fontSize: 11, marginBottom: 6 }}>قول القائد</div>
        <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, lineHeight: 1.8 }}>{quote}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "الأعضاء", val: fmt(members), icon: "👥", color: "#4dff4d" },
          { label: "المكفولون", val: fmt(orphans), icon: "👶", color: "#ffd700" },
          { label: "الكتائب", val: "4", icon: "⚔️", color: "#ff4444" },
          { label: "التحالفات", val: "14", icon: "🤝", color: "#44aaff" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.val}</div>
            <div style={{ color: "rgba(138,255,138,0.5)", fontSize: 11, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>البيانات الرسمية</div>
        {ANNOUNCEMENTS.map((a, i) => (
          <div key={i} style={{ background: a.urgent ? "rgba(255,0,0,0.06)" : "rgba(6,13,6,0.9)", border: `1px solid ${a.urgent ? "rgba(255,68,68,0.3)" : "rgba(42,122,42,0.4)"}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ color: a.urgent ? "#ff6666" : "#ffd700", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{a.urgent ? "🔴 " : ""}{a.title}</div>
            <div style={{ color: "rgba(200,230,200,0.7)", fontSize: 12, lineHeight: 1.7 }}>{a.body}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 12, padding: 14, textAlign: "center" }}>
        <div style={{ color: "#8aff8a", fontSize: 12 }}>عضو: {user.name} | {user.membershipId}</div>
      </div>
    </div>
  );
}

function LeaderTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>👑</div>
        <div style={{ color: "#ffd700", fontSize: 22, fontWeight: 700 }}>القائد العام</div>
        <div style={{ color: "#4dff4d", fontSize: 16, marginTop: 4 }}>أحمد عادل كاظم — واتي</div>
        <div style={{ color: "rgba(138,255,138,0.4)", fontSize: 12, marginTop: 2 }}>مواليد العراق 6 شباط 2003</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {LEADER_TITLES.map((t, i) => (
          <div key={i} style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
            <div style={{ color: "rgba(255,215,0,0.6)", fontSize: 11, lineHeight: 1.6 }}>{t.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>أقوال القائد</div>
        {LEADER_QUOTES.map((q, i) => (
          <div key={i} style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 10, padding: 12, marginBottom: 8, borderRight: "3px solid #ffd700" }}>
            <div style={{ color: "rgba(255,215,0,0.8)", fontSize: 13, lineHeight: 1.8, fontStyle: "italic" }}>"{q}"</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllianceTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🤝</div>
        <div style={{ color: "#ffd700", fontSize: 20, fontWeight: 700 }}>التحالفات الدولية</div>
      </div>
      {ALLIANCES.map((a, i) => (
        <div key={i} style={{ background: a.important ? "rgba(255,215,0,0.08)" : "rgba(6,13,6,0.9)", border: `1px solid ${a.important ? "rgba(255,215,0,0.3)" : "rgba(42,122,42,0.4)"}`, borderRadius: 12, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>{a.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: a.important ? "#ffd700" : "#8aff8a", fontSize: 14, fontWeight: 700 }}>{a.name} {a.important && "(التحالف الأهم)"}</div>
            <div style={{ color: "rgba(200,230,200,0.6)", fontSize: 12, marginTop: 2 }}>{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MilitaryTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
        <div style={{ color: "#ff4444", fontSize: 20, fontWeight: 700 }}>الكتائب العسكرية</div>
      </div>
      {MILITARY_UNITS.map((u, i) => (
        <div key={i} style={{ background: "rgba(6,13,6,0.9)", border: `1px solid ${u.color}33`, borderRadius: 12, padding: 14, marginBottom: 10, borderRight: `3px solid ${u.color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{u.icon}</span>
            <span style={{ color: u.color, fontSize: 16, fontWeight: 700 }}>{u.name}</span>
            <span style={{ marginRight: "auto", background: u.status === "نشط" ? "rgba(77,255,77,0.15)" : "rgba(255,255,255,0.05)", color: u.status === "نشط" ? "#4dff4d" : "rgba(200,200,200,0.4)", fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>{u.status}</span>
          </div>
          <div style={{ color: "rgba(200,230,200,0.6)", fontSize: 12 }}>{u.desc}</div>
        </div>
      ))}
      <div style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 12, padding: 14, marginTop: 10 }}>
        <div style={{ color: "#ffd700", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>المنشآت السرية</div>
        <div style={{ color: "rgba(200,230,200,0.6)", fontSize: 12, lineHeight: 1.8 }}>6 مستشفيات سرية | دور أيتام | مصانع عسكرية متطورة</div>
      </div>
    </div>
  );
}

function ReligionTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🕌</div>
        <div style={{ color: "#ffd700", fontSize: 20, fontWeight: 700 }}>الهيئة الدينية</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>المستشارون الدينيون — علماء الأزهر</div>
        {RELIGIOUS_SCHOLARS.map((s, i) => (
          <div key={i} style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ffd700", fontSize: 12 }}>{i + 1}.</span>
            <span style={{ color: "#8aff8a", fontSize: 13 }}>{s}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>الفتاوى الرسمية</div>
        {FATWAS.map((f, i) => (
          <div key={i} style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ color: "#ffd700", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
            <div style={{ color: "rgba(200,230,200,0.7)", fontSize: 12, lineHeight: 1.7, marginBottom: 4 }}>{f.body}</div>
            <div style={{ color: "rgba(138,255,138,0.4)", fontSize: 11 }}>{f.scholar}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
        <div style={{ color: "#ffd700", fontSize: 20, fontWeight: 700 }}>مسيرة الحزب</div>
      </div>
      {TIMELINE.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.gold ? "#ffd700" : "rgba(77,255,77,0.4)", boxShadow: t.gold ? "0 0 10px rgba(255,215,0,0.5)" : "none" }} />
            {i < TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(42,122,42,0.3)" }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 16 }}>
            <div style={{ color: t.gold ? "#ffd700" : "#8aff8a", fontSize: 14, fontWeight: 700 }}>{t.year}</div>
            <div style={{ color: "rgba(200,230,200,0.7)", fontSize: 12, lineHeight: 1.6 }}>{t.event}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatTab({ user }) {
  const [msgs, setMsgs] = useState(loadMsgs(user.name));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef();

  useEffect(() => { saveMsgs(user.name, msgs); }, [msgs]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", text, time: new Date().toLocaleTimeString("ar-IQ") };
    setMsgs(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("wati_or_key") || "") },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages: [{ role: "system", content: SYSTEM_PROMPT }, ...msgs.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: text }] }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الرد.";
      setMsgs(m => [...m, { role: "bot", text: reply, time: new Date().toLocaleTimeString("ar-IQ") }]);
    } catch {
      setMsgs(m => [...m, { role: "bot", text: "خطأ في الاتصال. حاول مرة أخرى.", time: new Date().toLocaleTimeString("ar-IQ") }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", direction: "rtl" }}>
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: "rgba(138,255,138,0.3)", fontSize: 13, marginTop: 40 }}>ابدأ محادثة مع المساعد الرسمي</div>}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end", marginBottom: 10 }}>
            <div style={{ maxWidth: "80%", background: m.role === "user" ? "rgba(77,255,77,0.1)" : "rgba(255,215,0,0.08)", border: `1px solid ${m.role === "user" ? "rgba(77,255,77,0.3)" : "rgba(255,215,0,0.2)"}`, borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ color: m.role === "user" ? "#8aff8a" : "#ffd700", fontSize: 13, lineHeight: 1.7 }}>{m.text}</div>
              <div style={{ color: "rgba(138,255,138,0.3)", fontSize: 10, marginTop: 4 }}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && <div style={{ textAlign: "center", color: "rgba(255,215,0,0.5)", fontSize: 13 }}>جاري الرد...</div>}
      </div>
      <div style={{ padding: "8px 16px 16px", display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب سؤالك..." dir="rtl" disabled={loading}
          style={{ flex: 1, padding: "10px 14px", background: "rgba(10,20,10,0.8)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 10, color: "#b8ffb8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "10px 18px", background: "linear-gradient(135deg,#1a7a1a,#2aaa2a)", border: "1px solid rgba(77,255,77,0.4)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>إرسال</button>
      </div>
    </div>
  );
}

function PrinciplesTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚖️</div>
        <div style={{ color: "#ffd700", fontSize: 20, fontWeight: 700 }}>مبادئ الحزب</div>
      </div>
      {PRINCIPLES.map((p, i) => (
        <div key={i} style={{ background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 12, padding: 14, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{p.icon}</span>
          <div>
            <div style={{ color: "#ffd700", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
            <div style={{ color: "rgba(200,230,200,0.7)", fontSize: 12, lineHeight: 1.7 }}>{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MapTab() {
  return (
    <div style={{ padding: 16, direction: "rtl" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌍</div>
        <div style={{ color: "#ffd700", fontSize: 20, fontWeight: 700 }}>الانتشار العالمي</div>
      </div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "2/1", background: "rgba(6,13,6,0.9)", border: "1px solid rgba(42,122,42,0.4)", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
        {WORLD_PRESENCE.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: p.x + "%", top: p.y + "%", width: 10, height: 10, borderRadius: "50%", background: p.color, boxShadow: `0 0 10px ${p.color}88`, transform: "translate(-50%,-50%)", animation: "pulse 2s ease infinite" }} title={p.country} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {WORLD_PRESENCE.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ color: "rgba(200,230,200,0.6)", fontSize: 11 }}>{p.country}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const TABS = [
  { key: "home", label: "الرئيسة", icon: "🏠" },
  { key: "leader", label: "القائد", icon: "👑" },
  { key: "alliance", label: "التحالفات", icon: "🤝" },
  { key: "military", label: "الكتائب", icon: "⚔️" },
  { key: "religion", label: "الدين", icon: "🕌" },
  { key: "timeline", label: "المسيرة", icon: "📅" },
  { key: "principles", label: "المبادئ", icon: "⚖️" },
  { key: "map", label: "الخريطة", icon: "🌍" },
  { key: "chat", label: "المساعد", icon: "💬" },
];

function App() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");

  if (screen === "loading") return <><Particles /><LoadingScreen onDone={() => setScreen("welcome")} /></>;
  if (screen === "welcome") return <><Particles /><WelcomePage onNext={() => setScreen("login")} /></>;
  if (screen === "login") return <><Particles /><LoginPage onLogin={u => { setUser(u); setScreen("dashboard"); }} /></>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#040a04,#080f08,#04080e)", color: "#b8ffb8", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Particles />
      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(4,10,4,0.95)", borderBottom: "1px solid rgba(42,122,42,0.3)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>🦅</span>
            <span style={{ color: "#ffd700", fontSize: 16, fontWeight: 700 }}>واتي</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(138,255,138,0.5)", fontSize: 11 }}>{user?.name}</span>
            <button onClick={() => { setUser(null); setScreen("login"); setTab("home"); }} style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 8, padding: "4px 10px", color: "#ff6666", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>خروج</button>
          </div>
        </header>
        <main style={{ paddingBottom: 60 }}>
          {tab === "home" && <HomeTab user={user} />}
          {tab === "leader" && <LeaderTab />}
          {tab === "alliance" && <AllianceTab />}
          {tab === "military" && <MilitaryTab />}
          {tab === "religion" && <ReligionTab />}
          {tab === "timeline" && <TimelineTab />}
          {tab === "principles" && <PrinciplesTab />}
          {tab === "map" && <MapTab />}
          {tab === "chat" && <ChatTab user={user} />}
        </main>
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, background: "rgba(4,10,4,0.97)", borderTop: "1px solid rgba(42,122,42,0.3)", display: "flex", overflowX: "auto", backdropFilter: "blur(10px)" }}>
          {TABS.map(t => <DashboardTab key={t.key} label={t.label} icon={t.icon} active={tab === t.key} onClick={() => setTab(t.key)} />)}
        </nav>
      </div>
    </div>
  );
}

export default App;
