// Spendshed motion: CSS transitions driven by IntersectionObserver and one scroll-driven story.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATIC = /[?&]static=1/.test(location.search) || RM;
  if (STATIC) document.documentElement.classList.add('static');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------- helpers ---------- */
  const fmtIN = n => { n = Math.round(n); const s = String(n); if (s.length <= 3) return s; const last = s.slice(-3); let rest = s.slice(0, -3); rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + ',' + last; };
  const fmtLakh = n => n >= 1e7 ? (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr' : n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : fmtIN(n);
  const countUp = (el, dur = 1400) => {
    const to = +el.dataset.count, fmt = el.dataset.format === 'in' ? fmtIN : v => Math.round(v);
    if (STATIC) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => { const p = clamp((now - t0) / dur); el.textContent = fmt(to * easeOut(p)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- hero counters ---------- */
  if (STATIC) $$('.card3d [data-count]').forEach(el => countUp(el)); else setTimeout(() => $$('.card3d [data-count]').forEach(el => countUp(el, 1400)), 900);

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

  /* ---------- seats avatars ---------- */
  const avs = $('#avs');
  if (avs) {
    const names = ['AR', 'PK', 'SM', 'DJ', 'NT', 'RV', 'KI', 'MB', 'AS', 'TG', 'VR', 'LP', 'HN', 'JD', 'SK', 'RM', 'AP', 'GS'];
    const cols = ['#0A0A0A', '#3B4FD8', '#1B7F4B', '#B7791F', '#7A3E9D', '#0B5CFF', '#D7263D', '#0C7C8A', '#5E6AD2'];
    names.forEach((n, i) => { const d = document.createElement('i'); d.className = 'av' + (i >= 9 ? ' idle' : ''); d.style.setProperty('--i', i); if (i < 9) d.style.background = cols[i % cols.length]; d.textContent = n; avs.appendChild(d); });
  }

  /* ---------- reveal on view ---------- */
  $$('[data-stagger]').forEach(g => $$('[data-reveal]', g).forEach((el, i) => el.style.transitionDelay = (i * 90) + 'ms'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target); }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- the story: statement → found → cut ---------- */
  const story = $('#product');
  if (story) {
    const view = $('.stmt-view'), lines = $('#stmtLines'), rows = $$('.sl', lines), saas = rows.filter(r => r.dataset.tool);
    const scan = $('.scanline'), tiles = $$('.fg-tile'), flRows = $$('.fl-row'), beats = $$('.beat'), dots = $$('.story-dots i');
    const foundN = $('#foundN'), totalN = $('#totalN'), backN = $('#backN');
    const TOTAL = 412000, BACK = 131000;
    let range = 0, scanY = 0, lastBeat = -1;
    const measure = () => { scanY = scan.offsetTop; range = Math.max(0, lines.scrollHeight - scanY + 16); };
    const render = p => {
      const b = p < .36 ? 0 : p < .7 ? 1 : 2;
      if (b !== lastBeat) { beats.forEach((el, i) => el.classList.toggle('on', i === b)); dots.forEach((d, i) => d.classList.toggle('on', i <= b)); lastBeat = b; }
      // beat 1: the statement scrolls under the reading line
      const p1 = clamp(p / .4);
      const ty = -p1 * range;
      lines.style.transform = `translate3d(0,${ty}px,0)`;
      let n = 0;
      saas.forEach((r, i) => { const hit = r.offsetTop + r.offsetHeight * .5 + ty <= scanY; r.classList.toggle('hit', hit); if (hit) n++; if (tiles[i]) tiles[i].classList.toggle('in', hit); });
      foundN.textContent = n;
      // beat 2: the rows with seats and usage
      const p2 = clamp((p - .36) / .3);
      flRows.forEach((r, i) => r.classList.toggle('in', p2 > i / flRows.length));
      // beat 3: cut idle seats, money comes back
      const p3 = easeOut(clamp((p - .7) / .24));
      story.classList.toggle('cut', p3 > .02);
      totalN.textContent = fmtIN(TOTAL - BACK * p3);
      backN.textContent = fmtIN(BACK * p3);
    };
    const pinned = () => matchMedia('(min-width:1101px)').matches;
    let playing = false, observed = false;
    const onS = () => { if (!pinned()) return; const r = story.getBoundingClientRect(); render(clamp(-r.top / (r.height - innerHeight))); };
    const play = () => { // phones and tablets: play once when the device is in view
      if (playing) return; playing = true; const t0 = performance.now(), dur = 7000;
      const step = now => { const p = clamp((now - t0) / dur); render(p); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const sync = () => {
      measure();
      if (STATIC) { render(1); return; }
      if (pinned()) onS();
      else if (!observed) { observed = true; const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { sio.disconnect(); play(); } }), { threshold: .35 }); sio.observe($('#device')); }
    };
    sync();
    if (!STATIC) addEventListener('scroll', onS, { passive: true });
    addEventListener('resize', sync);
    addEventListener('load', sync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  }

  /* ---------- how it works: progress line follows scroll ---------- */
  const stepsEl = $('#steps'), steps = $$('.step');
  if (stepsEl) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const r = stepsEl.getBoundingClientRect(); const mid = innerHeight * .6;
      const p = clamp((mid - r.top) / r.height);
      stepsEl.style.setProperty('--prog', (p * 100) + '%');
      const k = Math.min(steps.length - 1, Math.floor(p * steps.length + .15));
      steps.forEach((s, i) => s.classList.toggle('on', i <= k));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
    if (STATIC) steps.forEach(s => s.classList.add('on'));
  }

  /* ---------- anchors: offset for the fixed nav ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 72, behavior: STATIC ? 'auto' : 'smooth' });
  }));
})();
