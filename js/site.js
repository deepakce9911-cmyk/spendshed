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

  /* ---------- the story: a self-running loop (read → match → cut) ---------- */
  const story = $('#product');
  if (story) {
    const device = $('#device'), lines = $('#stmtLines'), saas = $$('.sl[data-tool]', lines), readline = $('.readline');
    const tiles = $$('.fg-tile'), flRows = $$('.fl-row'), beats = $$('.beat'), dots = $$('.story-dots i');
    const foundN = $('#foundN'), totalN = $('#totalN'), backN = $('#backN'), st = $('#stmtState'), fprog = $('#fprog');
    const TOTAL = 412000, BACK = 131000;
    const T = { s0: 600, s1: 6400, r0: 6800, r1: 8900, c0: 9600, c1: 11800, hold: 15000, end: 15700 };
    const easeIO = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    let range = 0, readY = 0, lastBeat = -1;
    const measure = () => { readY = readline.offsetTop; const last = saas[saas.length - 1]; range = Math.max(0, last.offsetTop + last.offsetHeight + 28 - readY); };
    const setBeat = b => { if (b === lastBeat) return; lastBeat = b; beats.forEach((el, i) => el.classList.toggle('on', i === b)); };
    const frame = t => {
      const s = easeIO(clamp((t - T.s0) / (T.s1 - T.s0)));
      const ty = -s * range; lines.style.transform = 'translate3d(0,' + ty + 'px,0)';
      let n = 0;
      saas.forEach((r, i) => { const hit = r.offsetTop + r.offsetHeight * .5 + ty <= readY; r.classList.toggle('hit', hit); if (hit) n++; if (tiles[i]) tiles[i].classList.toggle('in', hit); });
      foundN.textContent = n; fprog.style.width = (n / saas.length * 100) + '%';
      const done = t >= T.s1; st.classList.toggle('done', done); st.lastChild.textContent = done ? 'Read' : 'Reading';
      const rr = clamp((t - T.r0) / (T.r1 - T.r0));
      flRows.forEach((r, i) => r.classList.toggle('in', rr > i / flRows.length));
      story.classList.toggle('rows', rr > 0);
      const c = easeOut(clamp((t - T.c0) / (T.c1 - T.c0)));
      story.classList.toggle('cut', c > 0);
      totalN.textContent = fmtIN(TOTAL - BACK * c); backN.textContent = fmtIN(BACK * c);
      setBeat(t < T.r0 - 400 ? 0 : t < T.c0 - 400 ? 1 : 2);
      const segs = [[0, T.r0], [T.r0, T.c0], [T.c0, T.hold]];
      dots.forEach((d, i) => d.style.setProperty('--f', clamp((t - segs[i][0]) / (segs[i][1] - segs[i][0])).toFixed(3)));
      device.classList.toggle('fade', t > T.hold);
    };
    const reset = t => { device.classList.add('noanim'); frame(t); void device.offsetHeight; device.classList.remove('noanim'); };
    let t0 = null, offset = 0, running = false, raf = 0, visible = false;
    const loop = now => {
      if (!running) return;
      if (t0 === null) t0 = now - offset;
      let t = now - t0;
      if (t >= T.end) { reset(0); t0 = now; t = 0; }
      frame(t); raf = requestAnimationFrame(loop);
    };
    const start = () => { if (running || STATIC) return; running = true; t0 = null; raf = requestAnimationFrame(loop); };
    const stop = () => { if (!running) return; running = false; cancelAnimationFrame(raf); if (t0 !== null) offset = Math.min(performance.now() - t0, T.hold - 1); };
    const jump = i => { const starts = [0, T.r0 - 300, T.c0 - 300]; stop(); offset = starts[i]; reset(offset); start(); };
    dots.forEach((d, i) => { d.addEventListener('click', () => jump(i)); d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(i); } }); });
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if (STATIC) { frame(T.hold - 1); }
    else {
      const vio = new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible && !document.hidden) start(); else stop(); }), { threshold: .25 });
      vio.observe(device);
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });
    }
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
