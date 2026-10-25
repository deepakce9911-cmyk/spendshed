// Spendshed motion. GSAP + ScrollTrigger (loaded from cdnjs). Falls back to static if GSAP is missing.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const STATIC = /[?&]static=1/.test(location.search) || RM || typeof gsap === 'undefined';
  if (STATIC) document.documentElement.classList.add('static');

  /* ---------- helpers ---------- */
  const fmtIN = n => { n = Math.round(n); const s = String(n); if (s.length <= 3) return s; const last = s.slice(-3); let rest = s.slice(0, -3); rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + ',' + last; };
  const fmtLakh = n => n >= 1e7 ? (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr' : n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : fmtIN(n);

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- magnetic buttons ---------- */
  if (!STATIC && FINE) $$('.mag').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .28, duration: .5, ease: 'power3.out' }); });
    b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.45)' }));
  });

  /* ---------- counters ---------- */
  const countUp = (el, dur = 1.6) => {
    const to = +el.dataset.count, fmt = el.dataset.format === 'in' ? fmtIN : v => Math.round(v);
    if (STATIC) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), ms = dur * 1000;
    const step = now => { const p = Math.min(1, (now - t0) / ms); const k = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * k); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- estimate slider ---------- */
  const team = $('#team');
  if (team) {
    const upd = () => { const n = +team.value; $('#teamOut').textContent = n; const spend = n * 10000; const waste = spend * .25; $('#estSpend').textContent = fmtLakh(spend); $('#estWaste').textContent = fmtLakh(waste); };
    team.addEventListener('input', upd); upd();
  }

  /* ---------- audit form ---------- */
  const files = $('#files'), drop = $('#drop'), hint = $('#dropHint');
  if (files) {
    const show = () => { const n = files.files.length; drop.classList.toggle('has', n > 0); hint.textContent = n ? (n === 1 ? files.files[0].name : n + ' files ready') : 'PDF or CSV · last 3 months · up to 10 files'; };
    files.addEventListener('change', show);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
    if (/[?&]sent=1/.test(location.search)) { $('#sent').hidden = false; $('#auditForm').querySelector('button[type=submit]').textContent = 'Sent'; }
  }

  /* ---------- seats art ---------- */
  const sg = $('.seat-grid');
  if (sg) { for (let i = 0; i < 18; i++) { const d = document.createElement('i'); d.className = 'seat'; sg.appendChild(d); } }

  if (STATIC) {
    $$('[data-count]').forEach(el => countUp(el));
    $$('.seat').forEach((s, i) => { if (i >= 9) s.classList.add('off'); });
    $$('.step').forEach(s => s.classList.add('on'));
    const sc = $('#scan'); if (sc) { sc.classList.add('done'); sc.lastChild.textContent = 'Scan complete'; }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* ---------- hero: entrance is CSS; GSAP adds parallax and the counters ---------- */
  setTimeout(() => $$('.card3d [data-count]').forEach(el => countUp(el, 1.4)), 900);
  setTimeout(() => $$('.tag').forEach(t => t.classList.add('idle')), 2200);
  const stage = $('#stage');
  if (FINE && stage) {
    const qx = gsap.quickTo('#cardw', 'rotateY', { duration: .9, ease: 'power3.out' });
    const qy = gsap.quickTo('#cardw', 'rotateX', { duration: .9, ease: 'power3.out' });
    const tags = $$('.tagw').map(t => ({ x: gsap.quickTo(t, 'x', { duration: 1.1 }), y: gsap.quickTo(t, 'y', { duration: 1.1 }) }));
    $('#hero').addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      qx(px * 14); qy(-py * 10);
      tags.forEach((t, i) => { const d = (i + 1) * 9; t.x(px * d); t.y(py * d); });
    });
  }

  /* ---------- generic reveals ---------- */
  $$('[data-reveal]').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } }));

  /* ---------- product panel: window rises, rows type in, numbers count ---------- */
  const panel = $('#panel');
  if (panel) {
    gsap.from('#report', { y: 80, scale: .96, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 78%', once: true } });
    ScrollTrigger.create({
      trigger: panel, start: 'top 60%', once: true, onEnter: () => {
        gsap.to('.row[data-row]', { opacity: 1, y: 0, duration: .6, stagger: .12, delay: .3 });
        gsap.delayedCall(.9, () => $$('.report-side [data-count]').forEach(el => countUp(el, 1.8)));
        gsap.delayedCall(1.5, () => { const sc = $('#scan'); sc.classList.add('done'); sc.lastChild.textContent = 'Scan complete · 14 found'; });
        gsap.to('.float-note', { opacity: 1, y: 0, duration: .8, stagger: .25, delay: 1.6, ease: 'back.out(1.6)', startAt: { y: 16 } });
      }
    });
    // subtle parallax of the notes against scroll
    $$('.float-note').forEach((n, i) => gsap.to(n, { y: i ? -40 : -24, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 1 } }));
  }

  /* ---------- features ---------- */
  ScrollTrigger.create({
    trigger: '#features', start: 'top 70%', once: true, onEnter: () => {
      // seats switch off one by one
      const seats = $$('.seat');
      gsap.to({}, { duration: 1.4, delay: .4, onUpdate() { const k = Math.floor(this.progress() * 9); seats.forEach((s, i) => s.classList.toggle('off', i >= 18 - k)); } });
      // chat plays
      const b = $$('.chat .bubble');
      const ct = gsap.timeline({ delay: .3 });
      ct.to(b[0], { opacity: 1, y: 0, duration: .5 }).to(b[1], { opacity: 1, y: 0, duration: .5 }, '+=.5').to(b[2], { opacity: 1, y: 0, duration: .4 }, '+=.5').to(b[2], { opacity: 0, duration: .2, display: 'none' }, '+=1.4').to(b[3], { opacity: 1, y: 0, duration: .5 }, '<');
    }
  });

  /* ---------- how it works: progress line + active step ---------- */
  const steps = $$('.step'), stepsEl = $('#steps');
  if (stepsEl) {
    ScrollTrigger.create({
      trigger: stepsEl, start: 'top 60%', end: 'bottom 60%', scrub: true,
      onUpdate: self => { stepsEl.style.setProperty('--prog', (self.progress * 100) + '%'); const k = Math.min(steps.length - 1, Math.floor(self.progress * steps.length + .2)); steps.forEach((s, i) => s.classList.toggle('on', i <= k)); }
    });
    steps[0].classList.add('on');
  }

  /* ---------- pricing cards lift in ---------- */
  gsap.utils.toArray('.price').forEach((p, i) => gsap.from(p, { y: 40, duration: 1, delay: i * .08, scrollTrigger: { trigger: '#pricing', start: 'top 70%', once: true } }));

  /* ---------- FAQ: smooth open ---------- */
  $$('.faq details').forEach(d => {
    const p = $('p', d);
    d.addEventListener('toggle', () => { if (d.open) gsap.from(p, { opacity: 0, y: -6, duration: .4 }); });
  });

  /* ---------- audit card ---------- */
  gsap.from('.audit-form', { y: 30, opacity: 0, duration: 1, delay: .2, scrollTrigger: { trigger: '#audit', start: 'top 70%', once: true } });

  /* ---------- nav links: smooth scroll offset ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    const y = t.getBoundingClientRect().top + scrollY - 72; window.scrollTo({ top: y, behavior: 'smooth' });
  }));
})();
