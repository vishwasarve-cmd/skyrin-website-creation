/* ============================================================
   SETTINGS: edit this block, nothing else needs to change.
   ============================================================ */
const CONFIG = {
  // 1. Contact form: get a free access key at web3forms.com (enter the email that should receive enquiries).
  //    While this says YOUR_ACCESS_KEY_HERE, the form opens the visitor's email app instead.
  WEB3FORMS_KEY: 'YOUR_ACCESS_KEY_HERE',
  // 2. Tracking: paste your Google Tag Manager ID (looks like GTM-XXXXXXX). Leave '' to run with no tracking.
  //    Google Analytics 4 and Microsoft Clarity are then added inside Tag Manager, with no code changes.
  GTM_ID: '',
  // 3. Where enquiries go if the form falls back to email.
  EMAIL_TO: 'sales@skyrinengineering.com',
  // 4. Main WhatsApp number (digits only, with country code).
  WHATSAPP: '919150081550',
  // 5. false = every client name on the page becomes "Client name withheld" and the client strip hides.
  SHOW_CLIENT_NAMES: true
};

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
window.dataLayer = window.dataLayer || [];
const consented = () => { try { return localStorage.getItem('skyrin_consent') === 'yes'; } catch (e) { return false; } };
// Events are only recorded when Tag Manager is set up and the visitor has accepted.
const track = (event, data = {}) => { if (CONFIG.GTM_ID && consented()) window.dataLayer.push({ event, ...data }); };

/* ---------- remember where the visitor came from (for the form and reports) ---------- */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const store = {
  get(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
};
(() => {
  const p = new URLSearchParams(location.search);
  UTM_KEYS.forEach(k => { if (p.get(k)) store.set(k, p.get(k)); });
  if (!store.get('landing')) store.set('landing', location.pathname + location.search);
  if (!store.get('referrer')) store.set('referrer', document.referrer || '(direct)');
})();

/* ---------- client names switch ---------- */
if (!CONFIG.SHOW_CLIENT_NAMES) {
  $$('[data-client]').forEach(el => { el.textContent = 'Client name withheld'; });
  const strip = $('#clients'); if (strip) strip.hidden = true;
}

/* ---------- mobile menu ---------- */
const menuBtn = $('#menuBtn'), nav = $('#mainNav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
$$('#mainNav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
}));

/* ---------- WhatsApp links: add the traffic source so the reply knows where the lead came from ---------- */
function buildWhatsApp() {
  const src = store.get('utm_source');
  $$('[data-wa]').forEach(a => {
    const base = (a.dataset.waText || 'Hi Skyrin, I would like a quote.').trim();
    const text = base + (src ? ' (via website, source: ' + src + ')' : ' (via website)');
    a.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(text);
    a.target = '_blank'; a.rel = 'noopener';
  });
}
buildWhatsApp();

/* ---------- pre-fill the quote form from any service button ---------- */
$$('[data-service]').forEach(el => el.addEventListener('click', () => {
  const sel = $('#f-service');
  if (sel) sel.value = el.dataset.service;
  track('quote_start', { service: el.dataset.service });
}));

/* ---------- project filter ---------- */
const filterBtns = $$('.filters button');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.setAttribute('aria-pressed', b === btn));
  const f = btn.dataset.filter;
  $$('.proj').forEach(p => { p.hidden = !(f === 'all' || p.dataset.tags.split(' ').includes(f)); });
  track('project_filter', { filter: f });
}));

/* ---------- image zoom ---------- */
const lb = $('#lightbox'), lbImg = $('img', lb);
$$('.zoom').forEach(b => b.addEventListener('click', () => {
  const im = $('img', b);
  lbImg.src = im.src; lbImg.alt = im.alt;
  lb.showModal();
  track('project_zoom', { project: im.alt });
}));
lb.addEventListener('click', () => lb.close());

/* ---------- live clocks ---------- */
function tick() {
  $$('[data-tz]').forEach(el => {
    try {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false
      }).format(new Date());
    } catch (e) { el.textContent = ''; }
  });
}
tick(); setInterval(tick, 30000);

/* ---------- quote form ---------- */
const form = $('#quoteForm'), msg = $('#formMsg');
function showMsg(type, html) { msg.className = 'msg ' + type; msg.innerHTML = html; msg.focus(); }

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = Object.fromEntries(new FormData(form));
  if (data.botcheck) return; // spam trap, humans never fill this in
  // attach where the visitor came from
  UTM_KEYS.forEach(k => { data[k] = store.get(k); });
  data.landing_page = store.get('landing');
  data.referrer = store.get('referrer');
  data.page_url = location.href;
  const btn = $('button[type=submit]', form);
  btn.disabled = true;

  if (CONFIG.WEB3FORMS_KEY === 'YOUR_ACCESS_KEY_HERE') {
    // Fallback while no key is set: open the visitor's email app with everything filled in.
    const body = Object.entries(data).filter(([k, v]) => v && !['botcheck'].includes(k)).map(([k, v]) => k + ': ' + v).join('\n');
    location.href = 'mailto:' + CONFIG.EMAIL_TO + '?subject=' + encodeURIComponent('Quote request: ' + data.service) + '&body=' + encodeURIComponent(body);
    track('quote_submit', { service: data.service, country: data.country, method: 'mailto' });
    showMsg('ok', 'Your email app should open with the details filled in. Press send and we reply within 24 hours.');
    btn.disabled = false; return;
  }
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: CONFIG.WEB3FORMS_KEY, subject: 'Skyrin website quote: ' + data.service, from_name: 'Skyrin website', ...data })
    });
    const out = await res.json();
    if (!out.success) throw new Error(out.message || 'Send failed');
    track('quote_submit', { service: data.service, country: data.country, method: 'form', source: store.get('utm_source') || '(none)' });
    form.reset();
    showMsg('ok', 'Thank you. We have your request and will reply within 24 hours.');
  } catch (err) {
    showMsg('err', 'Sorry, that did not send. Please email <a href="mailto:' + CONFIG.EMAIL_TO + '">' + CONFIG.EMAIL_TO + '</a> or use WhatsApp.');
  } finally { btn.disabled = false; }
});

/* ---------- click events for reports (phone, email, WhatsApp) ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return;
  if (a.hasAttribute('data-wa')) track('whatsapp_click', { location: a.dataset.where || 'page' });
  else if (a.href.startsWith('tel:')) track('phone_click', { number: a.href.slice(4) });
  else if (a.href.startsWith('mailto:')) track('email_click');
});

/* ---------- tracking: loads Tag Manager only after the visitor accepts ---------- */
const banner = $('#consent');
function loadGTM() {
  if (!CONFIG.GTM_ID || window.__gtm) return; window.__gtm = true;
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CONFIG.GTM_ID);
  document.head.appendChild(s);
}
if (CONFIG.GTM_ID) {
  let c = null; try { c = localStorage.getItem('skyrin_consent'); } catch (e) {}
  if (c === 'yes') loadGTM(); else if (c !== 'no') banner.hidden = false;
  $('#consentYes').addEventListener('click', () => { try { localStorage.setItem('skyrin_consent', 'yes'); } catch (e) {} banner.hidden = true; loadGTM(); });
  $('#consentNo').addEventListener('click', () => { try { localStorage.setItem('skyrin_consent', 'no'); } catch (e) {} banner.hidden = true; });
}

$('#yr').textContent = new Date().getFullYear();
