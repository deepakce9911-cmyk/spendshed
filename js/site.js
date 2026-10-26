// Spendshed motion, measured on dextr.ai and testmuai.com: fade-ups with expo-out easing,
// linear progress and dash loops, no bounces. Plain CSS transitions driven by IntersectionObserver.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATIC = /[?&]static=1/.test(location.search) || RM;
  if (STATIC) document.documentElement.classList.add('static');
  const wait = (ms, fn) => STATIC ? fn() : setTimeout(fn, ms);

  /* ---------- helpers ---------- */
  const fmtIN = n => { n = Math.round(n); const s = String(n); if (s.length <= 3) return s; const last = s.slice(-3); let rest = s.slice(0, -3); rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + ',' + last; };
  const fmtLakh = n => n >= 1e7 ? (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr' : n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : fmtIN(n);
  const countUp = (el, dur = 1400) => {
    const to = +el.dataset.count, fmt = el.dataset.format === 'in' ? fmtIN : v => Math.round(v);
    if (STATIC) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / dur); const k = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * k); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- hero counters (entrance itself is CSS) ---------- */
  wait(900, () => $$('.card3d [data-count]').forEach(el => countUp(el, 1400)));

  /* ---------- estimate slider ---------- */
  const team = $('#team');
  if (team) {
    const upd = () => { const n = +team.value; $('#teamOut').textContent = n; const spend = n * 10000; $('#estSpend').textContent = fmtLakh(spend); $('#estWaste').textContent = fmtLakh(spend * .25); };
    team.addEventListener('input', upd); upd();
  }

  /* ---------- audit form ---------- */
  const files = $('#files'), drop = $('#drop'), hint = $('#dropHint');
  if (files) {
    const show = () => { const n = files.files.length; drop.classList.toggle('has', n > 0); hint.textContent = n ? (n === 1 ? files.files[0].name : n + ' files ready') : 'PDF or CSV · last 3 months · up to 10 files'; };
    files.addEventListener('change', show);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
    if (/[?&]sent=1/.test(location.search)) { $('#sent').hidden = false; $('#auditForm button[type=submit]').textContent = 'Sent'; }
  }

  /* ---------- seats art ---------- */
  const sg = $('.seat-grid');
  if (sg) for (let i = 0; i < 18; i++) { const d = document.createElement('i'); d.className = 'seat'; sg.appendChild(d); }

  /* ---------- reveal on view ---------- */
  // siblings inside a stagger group get 90ms steps
  $$('[data-stagger]').forEach(g => $$('[data-reveal]', g).forEach((el, i) => el.style.transitionDelay = (i * 90) + 'ms'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target); }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- product panel ---------- */
  const panel = $('#panel');
  if (panel) {
    const run = () => {
      $('#report').classList.add('in');
      $$('.row[data-row]').forEach((r, i) => wait(400 + i * 110, () => r.classList.add('in')));
      wait(900, () => $$('.report-side [data-count]').forEach(el => countUp(el, 1600)));
      wait(1700, () => { const sc = $('#scan'); sc.classList.add('done'); sc.lastChild.textContent = 'Scan complete · 14 found'; });
      $$('.float-note').forEach((n, i) => wait(1800 + i * 250, () => n.classList.add('in')));
    };
    const pio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; pio.disconnect(); run(); }), { threshold: .25 });
    pio.observe(panel);
  }

  /* ---------- features: seats switch off, chat plays ---------- */
  const feats = $('#features');
  if (feats) {
    const run = () => {
      const seats = $$('.seat');
      for (let k = 1; k <= 9; k++) wait(500 + k * 140, () => seats[18 - k].classList.add('off'));
      const b = $$('.chat .bubble');
      wait(300, () => b[0].classList.add('in'));
      wait(1100, () => b[1].classList.add('in'));
      wait(1900, () => b[2].classList.add('in'));
      wait(3400, () => { b[2].classList.remove('in'); b[2].classList.add('gone'); b[3].classList.add('in'); });
    };
    const fio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; fio.disconnect(); run(); }), { threshold: .3 });
    fio.observe(feats);
  }

  /* ---------- how it works: progress line follows scroll ---------- */
  const stepsEl = $('#steps'), steps = $$('.step');
  if (stepsEl) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const r = stepsEl.getBoundingClientRect(); const mid = innerHeight * .6;
      const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      stepsEl.style.setProperty('--prog', (p * 100) + '%');
      const k = Math.min(steps.length - 1, Math.floor(p * steps.length + .15));
      steps.forEach((s, i) => s.classList.toggle('on', i <= k));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- anchors: offset for the fixed nav ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 72, behavior: STATIC ? 'auto' : 'smooth' });
  }));
})();
