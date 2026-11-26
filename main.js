/* ============================================================
   SETTINGS: edit this block, nothing else needs to change.
   (To turn the intro off, change data-intro="on" to "off" on the <html> tag in index.html.)
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
  // 5. false = every client name on the page becomes "Client name withheld".
  SHOW_CLIENT_NAMES: true,
  // 6. How long the intro plays before it lifts, in milliseconds.
  INTRO_MS: 2400
};

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
if (!CONFIG.SHOW_CLIENT_NAMES) $$('[data-client]').forEach(el => { el.textContent = 'Client name withheld'; });

/* ---------- WhatsApp links: add the traffic source so the reply knows where the lead came from ---------- */
(() => {
  const src = store.get('utm_source');
  $$('[data-wa]').forEach(a => {
    const base = (a.dataset.waText || 'Hi Skyrin, I would like a quote.').trim();
    a.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(base + (src ? ' (via website, source: ' + src + ')' : ' (via website)'));
    a.target = '_blank'; a.rel = 'noopener';
  });
})();

/* ============================================================
   INTRO
   ============================================================ */
const intro = $('#intro');
let introDone = !root.classList.contains('has-intro');
function endIntro() {
  if (!intro || introDone) return;
  introDone = true;
  intro.classList.add('done');
  root.classList.remove('intro-hold');           // page animations start as the curtain opens
  try { sessionStorage.setItem('skyrin_intro', '1'); } catch (e) {}
  setTimeout(() => root.classList.remove('has-intro'), 1000);
  if (current === 'home') countUp(panels.home);
}
if (root.classList.contains('has-intro')) {
  setTimeout(endIntro, CONFIG.INTRO_MS);
  intro.addEventListener('click', endIntro);
  $('#introSkip').addEventListener('click', endIntro);
  document.addEventListener('keydown', e => { if (['Escape', 'Enter', ' '].includes(e.key)) endIntro(); });
}

/* ============================================================
   TABS (the five main sections)
   ============================================================ */
const PANELS = ['home', 'services', 'projects', 'about', 'contact'];
const panels = Object.fromEntries(PANELS.map(n => [n, $('#' + n)]));
const main = $('#main');
const navLinks = $$('#tabs [data-go], #bnav [data-go]');
let current = null;

function place(container, el) {            // slide the gold indicator under the active tab
  if (!container || !el) return;
  container.style.setProperty('--x', el.offsetLeft + 'px');
  container.style.setProperty('--w', el.offsetWidth + 'px');
}
function placeAll() {
  place($('#tabs'), $('#tabs .tab.on'));
  place($('#bnav'), $('#bnav .bn.on'));
}
function parseHash() {
  const [name, ...rest] = decodeURIComponent(location.hash.slice(1)).split('-');
  return { name: PANELS.includes(name) ? name : null, sub: rest.join('-') };
}
function stagger(panel) { $$('.st', panel).forEach((el, i) => el.style.setProperty('--i', i)); }

function countUp(panel) {                  // numbers count up when Home appears
  $$('.num[data-count]', panel).forEach(el => {
    const end = +el.dataset.count;
    if (reduceMotion) { el.textContent = end; return; }
    const t0 = performance.now() + 200, dur = 1300;
    el.textContent = '0';
    const step = t => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function onShown(name) {
  if (name === 'home' && introDone) countUp(panels.home);
  if (name === 'projects') progress();
  tick();
}

function route() {
  const { name: hashName, sub } = parseHash();
  const name = hashName || current || 'home';
  if (name !== current) {
    const first = current === null;
    const dir = first ? 1 : Math.sign(PANELS.indexOf(name) - PANELS.indexOf(current));
    main.style.setProperty('--dx', (dir >= 0 ? 26 : -26) + 'px');     // slide in from the side you are moving toward
    PANELS.forEach(n => panels[n].classList.toggle('active', n === name));
    stagger(panels[name]);
    current = name;
    navLinks.forEach(a => {
      const on = a.dataset.go === name;
      a.classList.toggle('on', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    placeAll();
    document.title = panels[name].dataset.title;
    if (!first) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      panels[name].focus({ preventScroll: true });
    }
    onShown(name);
    track('virtual_pageview', { page_path: '/' + name, page_title: document.title });
  }
  if (sub) selectSub(panels[name], sub);
}
function go(name, sub = '') {
  const h = '#' + name + (sub ? '-' + sub : '');
  if (location.hash !== h) history.pushState(null, '', h);
  route();
}
window.addEventListener('popstate', route);
window.addEventListener('resize', () => { placeAll(); progress(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAll);

/* every link or button with data-go moves to that tab */
const isNarrow = () => matchMedia('(max-width: 900px)').matches;
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  if (a.closest('dialog')) a.closest('dialog').close();
  if (a.dataset.service) prefill(a.dataset.service);
  go(a.dataset.go, a.dataset.sub || '');
  if (a.dataset.go === 'contact' && (a.dataset.service || a.classList.contains('hq')) && isNarrow()) {
    setTimeout(() => $('#quote').scrollIntoView({ behavior: 'smooth', block: 'start' }), 380);
  }
});
function prefill(v) {
  const s = $('#f-service');
  if (s) { s.value = v; if (s.value !== v) s.value = 'Other'; }
  track('quote_start', { service: v });
}

/* ============================================================
   SUB-TABS (services list, about sections, offices)
   ============================================================ */
function activate(tab) {
  const wrap = tab.closest('[data-tabs]');
  $$('[role="tab"]', wrap).forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    const p = document.getElementById(t.getAttribute('aria-controls'));
    if (p) p.hidden = !on;
  });
  const list = tab.parentElement;                      // keep the chosen tab in view on narrow screens
  if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
}
function selectSub(panel, sub) {
  const t = $$('[role="tab"]', panel).find(x => x.dataset.sub === sub);
  if (t) activate(t);
}
$$('[data-tabs]').forEach(wrap => {
  const tabs = $$('[role="tab"]', wrap);
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { activate(t); track('tab_select', { tab: t.dataset.sub }); });
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      let n = null;
      if (k) n = tabs[(i + k + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); n.focus(); activate(n); }
    });
  });
});

/* ============================================================
   PROJECTS: filter, carousel, details window
   ============================================================ */
const trackEl = $('#track'), bar = $('#cprog');
function progress() {
  if (!trackEl.clientWidth) return;
  const vis = Math.min(1, trackEl.clientWidth / trackEl.scrollWidth);
  const max = trackEl.scrollWidth - trackEl.clientWidth;
  const p = max > 0 ? trackEl.scrollLeft / max : 0;
  bar.style.width = vis * 100 + '%';
  bar.style.transform = 'translateX(' + (p * (1 / vis - 1) * 100) + '%)';
}
trackEl.addEventListener('scroll', progress, { passive: true });
$$('[data-car]').forEach(b => b.addEventListener('click', () => {
  trackEl.scrollBy({ left: (b.dataset.car === 'next' ? 1 : -1) * trackEl.clientWidth * 0.8, behavior: 'smooth' });
}));
const filterBtns = $$('.filters button');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.setAttribute('aria-pressed', b === btn));
  const f = btn.dataset.filter;
  let i = 0;
  $$('.proj').forEach(p => {
    const show = f === 'all' || p.dataset.tags.split(' ').includes(f);
    p.hidden = !show;
    if (show) { p.style.setProperty('--i', i++); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
  });
  trackEl.scrollTo({ left: 0 });
  progress();
  track('project_filter', { filter: f });
}));

const lb = $('#lightbox');
function openProject(card) {
  const img = $('img', card);
  const li = $('.lb-img img', lb);
  li.src = img.src; li.alt = card.dataset.title;
  $('#lbC').textContent = card.dataset.client; $('#lbC').toggleAttribute('data-client', true);
  if (!CONFIG.SHOW_CLIENT_NAMES) $('#lbC').textContent = 'Client name withheld';
  $('#lbL').textContent = card.dataset.loc;
  $('#lbT').textContent = card.dataset.title;
  $('#lbD').textContent = card.dataset.desc;
  $('#lbQ').dataset.service = card.dataset.service;
  lb.showModal();
  track('project_view', { project: card.dataset.title });
}
$$('.proj').forEach(card => {
  $('.zoom', card).addEventListener('click', () => openProject(card));
  $('[data-details]', card).addEventListener('click', () => openProject(card));
});
$$('[data-open]').forEach(b => b.addEventListener('click', () => openProject($('.proj[data-id="' + b.dataset.open + '"]'))));
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
$('.lb-x', lb).addEventListener('click', () => lb.close());

/* ============================================================
   FAQ accordion
   ============================================================ */
$$('.acc-q').forEach(q => q.addEventListener('click', () => {
  const acc = q.parentElement, open = !acc.classList.contains('open');
  $$('.acc.open').forEach(a => { if (a !== acc) { a.classList.remove('open'); $('.acc-q', a).setAttribute('aria-expanded', 'false'); } });
  acc.classList.toggle('open', open);
  q.setAttribute('aria-expanded', open);
  if (open) track('faq_open', { question: q.textContent.trim() });
}));

/* ============================================================
   Button ripple
   ============================================================ */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn');
  if (!b || reduceMotion) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
  const sp = document.createElement('span');
  sp.className = 'rip';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp);
  setTimeout(() => sp.remove(), 650);
});

/* ---------- live clocks ---------- */
function tick() {
  $$('[data-tz]').forEach(el => {
    try {
      el.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).format(new Date());
    } catch (e) { el.textContent = ''; }
  });
}
setInterval(tick, 30000);

/* ============================================================
   QUOTE FORM
   ============================================================ */
const form = $('#quoteForm'), msg = $('#formMsg');
function showMsg(type, html) { msg.className = 'msg ' + type; msg.innerHTML = html; msg.focus(); }
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = Object.fromEntries(new FormData(form));
  if (data.botcheck) return;                       // spam trap, humans never fill this in
  UTM_KEYS.forEach(k => { data[k] = store.get(k); });
  data.landing_page = store.get('landing');
  data.referrer = store.get('referrer');
  data.page_url = location.href;
  const btn = $('button[type=submit]', form);
  btn.disabled = true;

  if (CONFIG.WEB3FORMS_KEY === 'YOUR_ACCESS_KEY_HERE') {
    // Fallback while no key is set: open the visitor's email app with everything filled in.
    const body = Object.entries(data).filter(([k, v]) => v && k !== 'botcheck').map(([k, v]) => k + ': ' + v).join('\n');
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
  $('#consentYes').addEventListener('click', () => {
    try { localStorage.setItem('skyrin_consent', 'yes'); } catch (e) {}
    banner.hidden = true; loadGTM();
    track('virtual_pageview', { page_path: '/' + current, page_title: document.title });
  });
  $('#consentNo').addEventListener('click', () => { try { localStorage.setItem('skyrin_consent', 'no'); } catch (e) {} banner.hidden = true; });
}

/* ---------- start ---------- */
$('#yr').textContent = new Date().getFullYear();
route();
tick();
