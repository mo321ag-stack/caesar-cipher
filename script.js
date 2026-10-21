/* Caesar Cipher Lab — vanilla JavaScript, no dependencies, works offline. */
'use strict';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Relative frequency (%) of letters A–Z in English text (used only for the brute-force heuristic)
const EN_FREQ = [8.167,1.492,2.782,4.253,12.702,2.228,2.015,6.094,6.966,0.153,0.772,4.025,2.406,
  6.749,7.507,1.929,0.095,5.987,6.327,9.056,2.758,0.978,2.360,0.150,1.974,0.074];

/* ================= CORE CIPHER (pure functions, also used by the self-tests) ================= */

// Reduce any integer key (negative or > 25 too) to 0..25
const normKey = k => ((k % 26) + 26) % 26;

/* Process text character by character. Returns one record per character:
   letters get {v: input value, raw: value before mod, r: output value, wrap}; others pass through. */
function transform(text, key, mode) {
  const k = normKey(key);
  return Array.from(text).map(ch => {            // Array.from keeps emojis (surrogate pairs) whole
    const up = ch >= 'A' && ch <= 'Z', lo = ch >= 'a' && ch <= 'z';
    if (!up && !lo) return { ch, out: ch, letter: false };      // spaces, digits, Arabic, emoji… unchanged
    const base = up ? 65 : 97, v = ch.charCodeAt(0) - base;      // A = 0 … Z = 25
    const raw = mode === 'enc' ? v + k : v - k + 26;             // C = (P+K) mod 26  |  P = (C−K+26) mod 26
    const r = raw % 26;
    return { ch, out: String.fromCharCode(base + r), letter: true, v, raw, r,
             wrap: mode === 'enc' ? raw >= 26 : v - k < 0 };
  });
}
const caesar = (text, key, mode) => transform(text, key, mode).map(s => s.out).join('');

// Count A–Z (case-insensitive); everything else is ignored
function letterCounts(text) {
  const c = new Array(26).fill(0);
  for (const ch of text.toUpperCase()) if (ch >= 'A' && ch <= 'Z') c[ch.charCodeAt(0) - 65]++;
  return c;
}

// Chi-squared distance from English letter statistics (lower = more English-like)
function chiSquare(text) {
  const c = letterCounts(text), n = c.reduce((a, b) => a + b, 0);
  if (!n) return Infinity;
  return c.reduce((s, o, i) => { const e = n * EN_FREQ[i] / 100; return s + (o - e) ** 2 / e; }, 0);
}

// All 26 possible decryptions
const bruteForce = text => Array.from({ length: 26 }, (_, k) => {
  const t = caesar(text, k, 'dec'); return { k, text: t, chi: chiSquare(t) };
});

/* Returns the most likely shift ONLY when the evidence is strong (enough letters and the best
   candidate is at least twice as "English" as the runner-up); otherwise null. Never guaranteed. */
function likelyShift(rows) {
  const n = letterCounts(rows[0].text).reduce((a, b) => a + b, 0);
  if (n < 25) return null;
  const s = [...rows].sort((a, b) => a.chi - b.chi);
  return s[1].chi >= 2 * s[0].chi ? s[0].k : null;
}

// Key must be a whole number 0–25 (returns null when invalid)
const parseKey = v => { v = String(v).trim(); return /^\d+$/.test(v) && +v <= 25 ? +v : null; };

const SAMPLE = caesar('Network security students learn that a Caesar cipher can be broken by trying every key or by counting letter frequencies.', 7, 'enc');

/* ================= SELF-TESTS ================= */
function selfTests() {
  const T = [];
  const eq = (name, a, b) => T.push([name, a === b]);
  eq('HELLO + 3 = KHOOR', caesar('HELLO', 3, 'enc'), 'KHOOR');
  eq('KHOOR − 3 = HELLO', caesar('KHOOR', 3, 'dec'), 'HELLO');
  eq('Wraparound: X + 5 = C', caesar('X', 5, 'enc'), 'C');
  eq('Wraparound: C − 5 = X', caesar('C', 5, 'dec'), 'X');
  eq('Lowercase preserved: xyz + 3 = abc', caesar('xyz', 3, 'enc'), 'abc');
  eq('Mixed case, spaces, punctuation, digits', caesar('Hello, World! 123', 3, 'enc'), 'Khoor, Zruog! 123');
  eq('Empty string', caesar('', 5, 'enc'), '');
  eq('Key 0 changes nothing', caesar('Test', 0, 'enc'), 'Test');
  eq('Key 26 ≡ key 0', caesar('Test', 26, 'enc'), 'Test');
  eq('Negative key −3 ≡ 23', caesar('abc', -3, 'enc'), caesar('abc', 23, 'enc'));
  eq('Arabic text and emoji unchanged', caesar('مرحبا 😀 abc', 1, 'enc'), 'مرحبا 😀 bcd');
  let ok = true;
  for (let k = 0; k < 26; k++) if (caesar(caesar('The Quick Brown Fox!', k, 'enc'), k, 'dec') !== 'The Quick Brown Fox!') ok = false;
  T.push(['Round-trip for all 26 keys', ok]);
  const orig = 'Attack at dawn at the north gate of the old castle';
  const rows = bruteForce(caesar(orig, 3, 'enc'));
  eq('Brute force contains the original at shift 3', rows[3].text, orig);
  eq('Brute force: 26 candidates', String(rows.length), '26');
  eq('Brute force identifies shift 3 on long text', String(likelyShift(rows)), '3');
  eq('Brute force makes no claim on short text', String(likelyShift(bruteForce('KHOOR'))), 'null');
  const c = letterCounts('Hello, World! 123');
  T.push(['Frequency counts ignore case/punctuation/digits', c[11] === 3 && c[14] === 2 && c[7] === 1 && c.reduce((a, b) => a + b) === 10]);
  return T;
}

/* ================= TRANSLATIONS (English / Arabic) ================= */
const I = {
en: {
  title:'Caesar Cipher Lab', lang:'العربية',
  n_home:'Home', n_enc:'Encrypt', n_dec:'Decrypt', n_brute:'Brute Force', n_freq:'Frequency Analysis', n_learn:'Learn Step by Step', n_quiz:'Quiz / Practice',
  hero_t:'Learn the oldest cipher in history — hands-on',
  hero_p:'Encrypt, decrypt, break and analyze Caesar ciphers in your browser. Everything runs offline.', start:'Start encrypting',
  ph:'Type your message here…', plain:'Plaintext', cipher:'Ciphertext', key:'Key (0–25)', doEnc:'Encrypt', doDec:'Decrypt',
  reset:'Reset', copy:'Copy', copied:'Copied!',
  note:'Only English letters A–Z / a–z are shifted. Case is kept; spaces, digits, punctuation, Arabic text and emojis stay unchanged.',
  errEmpty:'Please enter some text.', errKey:'The key must be a whole number from 0 to 25.',
  viz:'Rotating alphabet', vizP:'Original alphabet', vizC:'Shifted alphabet', tbl:'Character-by-character transformation',
  cChar:'Char', cVal:'Value', cCalc:'Calculation', cRes:'Result', same:'unchanged', wrap:'wraparound', trunc:'Showing the first 300 characters only.',
  bfIn:'Ciphertext to attack', bfGo:'Try all 26 shifts', bfShift:'Shift', bfText:'Candidate plaintext', bfLikely:'Most likely',
  bfOk:'Shift {k} is very likely correct: its letter statistics match English far better than every other shift.',
  bfNo:'No shift can be identified reliably (text too short or not English). Read the candidates and judge for yourself.',
  bfNote:'Automatic detection is only a statistical heuristic and is never guaranteed.', sample:'Load sample',
  frIn:'Text to analyze', frTotal:'Letters counted', frTop:'Most frequent letter', frEmpty:'Type some text to see the chart.',
  frGuess:'If this is English text shifted by a Caesar cipher, the most frequent letter probably stands for E, which suggests key = {k}. This is only a hint; short texts can mislead.',
  frWhy_t:'How frequency analysis attacks a Caesar cipher',
  frWhy:'In English, letters such as E, T, A and O are the most common. A Caesar shift moves every letter by the same amount, so the histogram keeps its shape and is only slid sideways. Compare the tallest bar with E to guess the key, then verify by decrypting — no need to try all keys.',
  lrnF:'Formulas', lrnWhere:'P = plaintext letter value, C = ciphertext letter value, K = key (A = 0 … Z = 25).', lrnMode:'Operation',
  lrnS1:'1. Letters → numbers (A = 0 … Z = 25)', lrnS2:'2. Apply the formula, then reduce mod 26', lrnS3:'3. Wraparound',
  lrnW:'mod 26 bends the alphabet into a circle. Example: X = 23, shift 5 → 23 + 5 = 28, and 28 mod 26 = 2 → C. When decrypting, C = 2 with key 5 → (2 − 5 + 26) mod 26 = 23 → X.',
  lrnWr:'{n} letter(s) wrapped around in this example (marked ↻).', lrnS4:'4. Final result',
  h_def_t:'What is the Caesar cipher?',
  h_def:'A substitution cipher that replaces every letter with the letter a fixed number of positions (the key) further along the alphabet. It is a monoalphabetic shift cipher.',
  h_hist_t:'History',
  h_hist:'Named after Julius Caesar, who according to Suetonius used a shift of 3 to protect military messages. Augustus used a similar shift of 1.',
  h_ex_t:'Examples',
  h_ex:'Encrypt (key 3): <code>ATTACK AT DAWN</code> → <code>DWWDFN DW GDZQ</code><br>Decrypt (key 3): <code>KHOOR ZRUOG</code> → <code>HELLO WORLD</code>',
  h_chr_t:'Character handling',
  h_chr:'The classic Caesar cipher works on the 26-letter English alphabet. Case is preserved; every other character, including Arabic letters and emojis, is left untouched.',
  h_work_t:'Worked example: HELLO with key 3', h_work:'Apply C = (P + K) mod 26 to each letter:',
  h_bf_t:'Brute-force attack',
  h_bf:'There are only 26 possible keys. An attacker simply tries every one and reads the results until one makes sense — it takes a computer microseconds.',
  h_pc_t:'Advantages and disadvantages',
  h_pro:'<b>Advantages:</b> extremely simple, needs no equipment, fast, ideal for teaching what a key is.',
  h_con:'<b>Disadvantages:</b> tiny key space, letter frequencies and word patterns survive, one key for every letter.',
  h_sec_t:'Why it is not secure today',
  h_sec:'With only 26 keys it falls to brute force instantly; frequency analysis breaks it even without trying keys; and one known plaintext letter pair reveals the key. Modern systems use algorithms such as AES or ChaCha20 with 128–256-bit keys.',
  stBtn:'Run self-tests', stPass:'{a} / {b} tests passed',
  qScore:'Score', qRestart:'Restart', qOk:'Correct!', qNo:'Not quite.'
},
ar: {
  title:'مختبر شيفرة قيصر', lang:'English',
  n_home:'الرئيسية', n_enc:'تشفير', n_dec:'فك التشفير', n_brute:'القوة الغاشمة', n_freq:'تحليل التكرار', n_learn:'تعلّم خطوة بخطوة', n_quiz:'اختبار / تدريب',
  hero_t:'تعلّم أقدم شيفرة في التاريخ عمليًا',
  hero_p:'شفّر وفُكّ وحلّل شيفرات قيصر داخل المتصفح. كل شيء يعمل دون اتصال بالإنترنت.', start:'ابدأ التشفير',
  ph:'اكتب رسالتك هنا…', plain:'النص الأصلي', cipher:'النص المشفّر', key:'المفتاح (0–25)', doEnc:'شفّر', doDec:'فُكّ التشفير',
  reset:'إعادة ضبط', copy:'نسخ', copied:'تم النسخ!',
  note:'تُزاح الحروف الإنجليزية A–Z / a–z فقط. تبقى حالة الحرف كما هي، وتبقى المسافات والأرقام وعلامات الترقيم والنص العربي والرموز التعبيرية دون تغيير.',
  errEmpty:'الرجاء إدخال نص.', errKey:'يجب أن يكون المفتاح عددًا صحيحًا بين 0 و25.',
  viz:'الأبجدية الدوّارة', vizP:'الأبجدية الأصلية', vizC:'الأبجدية المزاحة', tbl:'التحويل حرفًا بحرف',
  cChar:'الحرف', cVal:'القيمة', cCalc:'العملية الحسابية', cRes:'الناتج', same:'دون تغيير', wrap:'التفاف حول الأبجدية', trunc:'يعرض أول 300 حرف فقط.',
  bfIn:'النص المشفّر المراد كسره', bfGo:'جرّب الإزاحات الـ26', bfShift:'الإزاحة', bfText:'النص المحتمل', bfLikely:'الأرجح',
  bfOk:'الإزاحة {k} هي الأرجح: إحصاءات حروفها تطابق الإنجليزية أكثر بكثير من باقي الإزاحات.',
  bfNo:'تعذّر تحديد الإزاحة الصحيحة بشكل موثوق (النص قصير أو ليس إنجليزيًا). اقرأ الاحتمالات واحكم بنفسك.',
  bfNote:'الكشف التلقائي مجرد تقدير إحصائي ولا يُضمن دائمًا.', sample:'تحميل مثال',
  frIn:'النص المراد تحليله', frTotal:'عدد الحروف المحسوبة', frTop:'الحرف الأكثر تكرارًا', frEmpty:'اكتب نصًا لعرض المخطط.',
  frGuess:'إذا كان هذا نصًا إنجليزيًا مشفّرًا بشيفرة قيصر فالأرجح أن الحرف الأكثر تكرارًا يمثّل E، أي أن المفتاح ≈ {k}. هذه مجرد إشارة وقد تضلّل في النصوص القصيرة.',
  frWhy_t:'كيف يكسر تحليل التكرار شيفرة قيصر؟',
  frWhy:'في الإنجليزية تكثر حروف مثل E وT وA وO. وتزيح شيفرة قيصر كل الحروف بالمقدار نفسه، فيحتفظ المخطط بشكله وينزاح جانبًا فقط. قارن أعلى عمود بالحرف E لتخمين المفتاح ثم تحقّق بفك التشفير، دون الحاجة لتجربة كل المفاتيح.',
  lrnF:'الصيغ', lrnWhere:'P = قيمة حرف النص الأصلي، C = قيمة حرف النص المشفّر، K = المفتاح (A = 0 … Z = 25).', lrnMode:'العملية',
  lrnS1:'١. تحويل الحروف إلى أرقام (A = 0 … Z = 25)', lrnS2:'٢. تطبيق الصيغة ثم باقي القسمة على 26', lrnS3:'٣. الالتفاف حول الأبجدية',
  lrnW:'عملية mod 26 تلفّ الأبجدية على شكل دائرة. مثال: X = 23 والإزاحة 5 ← 23 + 5 = 28، و28 mod 26 = 2 ← C. وعند فك التشفير: C = 2 بالمفتاح 5 ← (2 − 5 + 26) mod 26 = 23 ← X.',
  lrnWr:'عدد الحروف التي حدث لها التفاف في هذا المثال: {n} (موسومة بـ ↻).', lrnS4:'٤. النتيجة النهائية',
  h_def_t:'ما هي شيفرة قيصر؟',
  h_def:'شيفرة استبدال تحلّ محل كل حرف الحرف الذي يبعد عنه عددًا ثابتًا من المواضع (المفتاح) في الأبجدية. وهي شيفرة إزاحة أحادية الأبجدية.',
  h_hist_t:'التاريخ',
  h_hist:'سُمّيت نسبة إلى يوليوس قيصر الذي استخدم، بحسب سويتونيوس، إزاحة بمقدار 3 لحماية رسائله العسكرية، واستخدم أغسطس إزاحة مشابهة بمقدار 1.',
  h_ex_t:'أمثلة',
  h_ex:'تشفير (المفتاح 3): <code dir="ltr">ATTACK AT DAWN</code> ← <code dir="ltr">DWWDFN DW GDZQ</code><br>فك التشفير (المفتاح 3): <code dir="ltr">KHOOR ZRUOG</code> ← <code dir="ltr">HELLO WORLD</code>',
  h_chr_t:'معالجة الحروف',
  h_chr:'تعمل شيفرة قيصر الكلاسيكية على الأبجدية الإنجليزية ذات الـ26 حرفًا. تُحفظ حالة الحرف، وتبقى كل الرموز الأخرى، ومنها الحروف العربية والرموز التعبيرية، دون تغيير.',
  h_work_t:'مثال محلول: HELLO بالمفتاح 3', h_work:'نطبّق C = (P + K) mod 26 على كل حرف:',
  h_bf_t:'هجوم القوة الغاشمة',
  h_bf:'عدد المفاتيح الممكنة 26 فقط. يجرّب المهاجم كلها ويقرأ النتائج حتى يجد نصًا مفهومًا، وهذا يستغرق من الحاسوب أجزاء من الثانية.',
  h_pc_t:'المزايا والعيوب',
  h_pro:'<b>المزايا:</b> بسيطة جدًا، لا تحتاج إلى معدات، سريعة، ومناسبة لشرح مفهوم المفتاح.',
  h_con:'<b>العيوب:</b> فضاء مفاتيح صغير جدًا، تبقى تكرارات الحروف وأنماط الكلمات ظاهرة، ومفتاح واحد لكل الحروف.',
  h_sec_t:'لماذا لا تُعد آمنة اليوم؟',
  h_sec:'مع 26 مفتاحًا فقط تُكسر فورًا بالقوة الغاشمة، ويكسرها تحليل التكرار دون تجربة المفاتيح، ويكفي زوج واحد من الحروف المعلومة لكشف المفتاح. تعتمد الأنظمة الحديثة خوارزميات مثل AES وChaCha20 بمفاتيح طولها 128–256 بتًا.',
  stBtn:'تشغيل الاختبارات الذاتية', stPass:'نجح {a} من {b} اختبارًا',
  qScore:'النتيجة', qRestart:'إعادة', qOk:'صحيح!', qNo:'غير صحيح.'
}};

/* ================= QUIZ DATA ================= */
// Q(questionEN, questionAR, optionsEN, optionsAR|null (same as EN), correctIndex, explanationEN, explanationAR)
const Q = (qe, qa, oe, oa, a, ee, ea) => ({ q: { en: qe, ar: qa }, o: { en: oe, ar: oa || oe }, a, e: { en: ee, ar: ea } });
const QUIZ = [
  Q('What is HELLO encrypted with key 3?', 'ما ناتج تشفير HELLO بالمفتاح 3؟', ['KHOOR','EBIIL','KHOOP','LIPPS'], null, 0,
    'H→K, E→H, L→O, L→O, O→R.', 'H→K وE→H وL→O وL→O وO→R.'),
  Q('How many keys (0–25) does the Caesar cipher have?', 'كم عدد مفاتيح شيفرة قيصر (من 0 إلى 25)؟', ['13','25','26','52'], null, 2,
    'Keys 0–25 give 26 possibilities, so brute force is trivial.', 'المفاتيح من 0 إلى 25 تعطي 26 احتمالًا، لذا القوة الغاشمة سهلة جدًا.'),
  Q('Which formula decrypts a letter?', 'أي صيغة تفك تشفير الحرف؟', ['P = (C + K) mod 26','P = (C − K + 26) mod 26','P = (C × K) mod 26','P = (C − K) / 26'], null, 1,
    'Adding 26 keeps the value non-negative before applying mod 26.', 'إضافة 26 تُبقي القيمة غير سالبة قبل تطبيق mod 26.'),
  Q('X (23) shifted by 5 becomes…', 'الحرف X (قيمته 23) بعد إزاحة 5 يصبح…', ['Z','B','C','D'], null, 2,
    '23 + 5 = 28, and 28 mod 26 = 2, which is C.', '23 + 5 = 28 وباقي قسمتها على 26 هو 2 أي الحرف C.'),
  Q('Which attack exploits the fact that E is the most common English letter?', 'أي هجوم يستغل أن E أكثر حرف شيوعًا في الإنجليزية؟',
    ['Frequency analysis','Replay attack','SQL injection','Phishing'], ['تحليل التكرار','هجوم إعادة الإرسال','حقن SQL','التصيّد الاحتيالي'], 0,
    'The most frequent ciphertext letter likely stands for E, which reveals the shift.', 'الحرف الأكثر تكرارًا في النص المشفّر يمثّل غالبًا E، فتنكشف الإزاحة.'),
  Q('Why is the Caesar cipher insecure?', 'لماذا شيفرة قيصر غير آمنة؟',
    ['Tiny key space and letter frequencies survive','It needs a quantum computer','It uses 256-bit keys','It only encrypts numbers'],
    ['فضاء المفاتيح صغير جدًا وتكرارات الحروف تبقى ظاهرة','تحتاج إلى حاسوب كمّي','تستخدم مفاتيح بطول 256 بتًا','تشفّر الأرقام فقط'], 0,
    'Only 26 keys, and the letter-frequency pattern is preserved.', 'لا توجد سوى 26 مفتاحًا، ونمط تكرار الحروف يبقى محفوظًا.')
];

/* ================= USER INTERFACE ================= */
function init() {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let lang = 'en';
  const refresh = [];                                                  // functions re-run on language change
  const t = (k, v = {}) => (I[lang][k] || k).replace(/\{(\w+)\}/g, (_, x) => v[x]);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';       // proper RTL layout for Arabic
    $$('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
    $$('[data-i18n-html]').forEach(e => e.innerHTML = t(e.dataset.i18nHtml));
    $$('[data-i18n-ph]').forEach(e => e.placeholder = t(e.dataset.i18nPh));
    document.title = t('title');
    refresh.forEach(f => f());
  }

  /* ---- Navigation ---- */
  const tabs = ['home','encrypt','decrypt','brute','freq','learn','quiz'];
  const navKeys = ['n_home','n_enc','n_dec','n_brute','n_freq','n_learn','n_quiz'];
  tabs.forEach((id, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.i18n = navKeys[i]; b.dataset.tab = id; b.onclick = () => show(id);
    $('#nav').append(b);
  });
  function show(id) {
    tabs.forEach(x => $('#' + x).classList.toggle('active', x === id));
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
    window.scrollTo({ top: 0 });
  }
  $$('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
  $('#lang').onclick = () => { lang = lang === 'en' ? 'ar' : 'en'; applyLang(); };
  refresh.push(() => $('#lang').textContent = t('lang'));

  /* ---- Toast + clipboard ---- */
  function toast(msg) { const e = $('#toast'); e.textContent = msg; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 1300); }
  async function copyText(s) {
    if (!s) return;
    try { await navigator.clipboard.writeText(s); }
    catch (e) { const x = document.createElement('textarea'); x.value = s; document.body.append(x); x.select(); document.execCommand('copy'); x.remove(); }
    toast(t('copied'));
  }

  /* ---- Step table shared by Encrypt, Decrypt, Learn and the Home worked example ---- */
  function stepsTable(text, key, mode) {
    const k = normKey(key), st = transform(text, k, mode);
    const sign = mode === 'enc' ? '+' : '−', tail = mode === 'enc' ? '' : ' + 26';
    let rows = st.slice(0, 300).map(s => {
      if (!s.letter) return `<tr class="mute"><td>${esc(s.ch)}</td><td>–</td><td>${t('same')}</td><td>${esc(s.ch)}</td></tr>`;
      const p = mode === 'enc' ? s.v : s.r;                              // plaintext index (for highlighting)
      return `<tr class="${s.wrap ? 'wrap' : ''}" data-p="${p}"><td>${esc(s.ch)} </td><td>${s.v}</td>` +
        `<td dir="ltr">(${s.v} ${sign} ${k}${tail}) mod 26 = ${s.raw} mod 26 = ${s.r}</td>` +
        `<td>${s.out} (${s.r})${s.wrap ? ' <em title="' + t('wrap') + '">↻</em>' : ''}</td></tr>`;
    }).join('');
    if (st.length > 300) rows += `<tr class="mute"><td colspan="4">${t('trunc')}</td></tr>`;
    return {
      st, out: st.map(s => s.out).join(''), wraps: st.filter(s => s.wrap).length,
      html: `<thead><tr><th>${t('cChar')}</th><th>${t('cVal')}</th><th>${t('cCalc')}</th><th>${t('cRes')}</th></tr></thead><tbody>${rows}</tbody>`
    };
  }

  /* ---- Rotating alphabet: top row fixed, bottom strip (alphabet twice) slides by the key ---- */
  function makeViz(box) {
    box.innerHTML = `<div class="scroll"><div class="vzin"><small data-i18n="vizP"></small>
      <div class="r26 top">${[...A].map(c => `<i>${c}</i>`).join('')}</div>
      <small data-i18n="vizC"></small>
      <div class="clip"><div class="strip">${[...(A + A)].map(c => `<i>${c}</i>`).join('')}</div></div></div></div>`;
    const top = $('.top', box).children, strip = $('.strip', box);
    let k = 3;
    return {
      set(n) { k = n; strip.style.transform = `translateX(calc(var(--w) * -${n}))`; },
      hl(ps) {                                                           // highlight matching letters in both rows
        [...top, ...strip.children].forEach(e => e.classList.remove('hl'));
        [...ps].forEach(p => { top[p].classList.add('hl'); strip.children[p + k].classList.add('hl'); });
      }
    };
  }

  /* ---- Encrypt / Decrypt panels (same template, different mode) ---- */
  function panel(id, mode, sampleText) {
    const sec = $('#' + id); sec.append($('#cipherTpl').content.cloneNode(true));
    const q = s => $(s, sec), ta = q('textarea'), kn = q('.kn'), ks = q('.ks'), err = q('.err'), out = q('.out'), tb = q('.tbl');
    q('.lIn').dataset.i18n = mode === 'enc' ? 'plain' : 'cipher';
    q('.lOut').dataset.i18n = mode === 'enc' ? 'cipher' : 'plain';
    q('.go').dataset.i18n = mode === 'enc' ? 'doEnc' : 'doDec';
    const viz = makeViz(q('.viz'));
    let ran = false, ps = [];
    ta.value = sampleText;

    function clear() { out.textContent = ''; tb.innerHTML = ''; ps = []; viz.hl(ps); ran = false; }
    function run() {                                                     // validate → transform → render
      err.textContent = '';
      if (!ta.value.trim()) { err.textContent = t('errEmpty'); return clear(); }
      const k = parseKey(kn.value);
      if (k === null) { err.textContent = t('errKey'); return clear(); }
      const r = stepsTable(ta.value, k, mode);
      out.textContent = r.out; tb.innerHTML = r.html;
      viz.set(k);
      ps = new Set(r.st.filter(s => s.letter).map(s => mode === 'enc' ? s.v : s.r));
      viz.hl(ps); ran = true;
    }
    const keyChanged = k => { viz.set(k); ran ? run() : viz.hl([]); };
    kn.oninput = () => {                                                 // number box → slider
      const k = parseKey(kn.value);
      if (k === null) { err.textContent = t('errKey'); return; }
      err.textContent = ''; ks.value = k; keyChanged(k);
    };
    ks.oninput = () => { kn.value = ks.value; err.textContent = ''; keyChanged(+ks.value); };  // slider → number box
    q('.go').onclick = run;
    q('.cp').onclick = () => copyText(out.textContent);
    q('.rs').onclick = () => { ta.value = ''; kn.value = ks.value = 3; err.textContent = ''; viz.set(3); clear(); };
    tb.onmouseover = e => { const tr = e.target.closest('tr[data-p]'); if (tr) viz.hl([+tr.dataset.p]); };
    tb.onmouseleave = () => viz.hl(ps);
    refresh.push(() => { if (ran || err.textContent) run(); });
    viz.set(3); run();
  }
  panel('encrypt', 'enc', 'Hello, World! 😀');
  panel('decrypt', 'dec', 'Khoor, Zruog! 😀');

  /* ---- Brute force ---- */
  const bIn = $('#bfIn'), bOut = $('#bfOut'), bMsg = $('#bfMsg');
  function brute(explicit) {
    if (!bIn.value.trim()) { bOut.innerHTML = ''; bMsg.textContent = explicit === true ? t('errEmpty') : ''; bMsg.className = 'msg warn'; return; }
    const rows = bruteForce(bIn.value), best = likelyShift(rows);
    bMsg.textContent = best === null ? t('bfNo') : t('bfOk', { k: best });
    bMsg.className = 'msg ' + (best === null ? 'warn' : '');
    bOut.innerHTML = `<thead><tr><th>${t('bfShift')}</th><th>${t('bfText')}</th><th></th></tr></thead><tbody>` +
      rows.map(r => `<tr class="${r.k === best ? 'best' : ''}"><td>${r.k}</td><td dir="auto">${esc(r.text)}</td><td>${r.k === best ? '★ ' + t('bfLikely') : ''}</td></tr>`).join('') + '</tbody>';
  }
  $('#bfGo').onclick = () => brute(true);
  bIn.oninput = () => brute(false);
  refresh.push(() => brute(false));

  /* ---- Frequency analysis ---- */
  const fIn = $('#frIn'), fChart = $('#frChart'), fInfo = $('#frInfo');
  function freq() {
    const c = letterCounts(fIn.value), n = c.reduce((a, b) => a + b, 0), max = Math.max(...c, 1);
    fChart.innerHTML = [...A].map((L, i) =>
      `<div class="b" title="${L}: ${c[i]}${n ? ' (' + (100 * c[i] / n).toFixed(1) + '%)' : ''}"><span>${c[i] || ''}</span>` +
      `<div class="col"><div class="fill" style="height:${100 * c[i] / max}%"></div></div><b>${L}</b></div>`).join('');
    if (!n) { fInfo.textContent = t('frEmpty'); return; }
    const top = c.indexOf(Math.max(...c));
    fInfo.textContent = `${t('frTotal')}: ${n} — ${t('frTop')}: ${A[top]} (${c[top]}). ` + t('frGuess', { k: normKey(top - 4) });
  }
  fIn.oninput = freq; refresh.push(freq);

  /* ---- Learn step by step (live) ---- */
  const lMode = $('#lMode'), lIn = $('#lIn'), lKey = $('#lKey'), lOut = $('#lOut');
  function learn() {
    const k = parseKey(lKey.value), mode = lMode.value;
    if (!lIn.value.trim()) { lOut.innerHTML = `<p class="err">${t('errEmpty')}</p>`; return; }
    if (k === null) { lOut.innerHTML = `<p class="err">${t('errKey')}</p>`; return; }
    const r = stepsTable(lIn.value, k, mode);
    const conv = r.st.filter(s => s.letter).slice(0, 60).map(s => `${s.ch}=${s.v}`).join(', ');
    lOut.innerHTML = `<h3>${t('lrnS1')}</h3><p><code>${esc(conv) || '–'}</code></p>` +
      `<h3>${t('lrnS2')}</h3><div class="formula">${mode === 'enc' ? 'C = (P + K) mod 26' : 'P = (C − K + 26) mod 26'}, K = ${k}</div>` +
      `<div class="tw"><table class="tbl">${r.html}</table></div>` +
      `<h3>${t('lrnS3')}</h3><p>${t('lrnW')}</p><p class="msg">${t('lrnWr', { n: r.wraps })}</p>` +
      `<h3>${t('lrnS4')}</h3><div class="out" dir="auto">${esc(r.out)}</div>`;
  }
  [lMode, lIn, lKey].forEach(e => e.oninput = learn);
  refresh.push(learn);

  /* ---- Home: worked example + self-tests ---- */
  refresh.push(() => $('#workedTbl').innerHTML = stepsTable('HELLO', 3, 'enc').html);
  $('#stBtn').onclick = () => {
    const r = selfTests(), pass = r.filter(x => x[1]).length;
    $('#stOut').innerHTML = `<p class="msg ${pass === r.length ? '' : 'warn'}">${t('stPass', { a: pass, b: r.length })}</p>` +
      '<ul>' + r.map(([n, ok]) => `<li>${ok ? '✔' : '✘'} ${esc(n)}</li>`).join('') + '</ul>';
  };

  /* ---- Sample buttons ---- */
  $$('[data-sample]').forEach(b => b.onclick = () => {
    const el = $('#' + b.dataset.sample); el.value = SAMPLE; el.dispatchEvent(new Event('input'));
    if (b.dataset.sample === 'bfIn') brute(true);
  });

  /* ---- Quiz ---- */
  const ans = [], qBox = $('#quizBox');
  function quiz() {
    qBox.innerHTML = QUIZ.map((q, i) => {
      const a = ans[i], done = a !== undefined;
      return `<div class="card"><h3>${i + 1}. ${esc(q.q[lang])}</h3>` +
        q.o[lang].map((o, j) => `<button type="button" class="opt ${!done ? '' : j === q.a ? 'right' : j === a ? 'bad' : ''}" dir="auto" data-q="${i}" data-o="${j}" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('') +
        (done ? `<p class="msg ${a === q.a ? '' : 'warn'}">${a === q.a ? t('qOk') : t('qNo')} ${esc(q.e[lang])}</p>` : '') + '</div>';
    }).join('');
    $('#quizScore').textContent = `${t('qScore')}: ${ans.filter((a, i) => a === QUIZ[i].a).length} / ${QUIZ.length}`;
  }
  qBox.onclick = e => { const b = e.target.closest('.opt'); if (b && !b.disabled) { ans[+b.dataset.q] = +b.dataset.o; quiz(); } };
  $('#qRestart').onclick = () => { ans.length = 0; quiz(); };
  refresh.push(quiz);

  applyLang();
  const h = location.hash.slice(1); show(tabs.includes(h) ? h : 'home');
}

/* Browser: start the UI. Node: export the pure functions so they can be tested. */
if (typeof document === 'undefined') module.exports = { caesar, transform, bruteForce, likelyShift, letterCounts, selfTests, normKey, parseKey, SAMPLE };
else document.addEventListener('DOMContentLoaded', init);
