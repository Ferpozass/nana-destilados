/* NÄNÄ ナナ — interacción de la landing */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Idioma ES / 日本語 ---------- */
  function setLang(l) {
    root.dataset.l = l; root.lang = l;
    document.querySelectorAll('.tg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.set === l); });
    store.set('nana-lang', l);
  }
  document.querySelectorAll('.tg button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.set); }); });
  setLang(store.get('nana-lang') === 'ja' ? 'ja' : 'es');

  /* ---------- Verificación de edad ---------- */
  var gate = document.getElementById('gate');
  function lock(on) {
    document.body.style.overflow = on ? 'hidden' : '';
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el !== gate && !/^(SCRIPT|CANVAS)$/.test(el.tagName)) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
    });
  }
  function openSite() {
    store.sset('nana-age', '1');
    gate.classList.add('out'); lock(false);
    setTimeout(function () { gate.hidden = true; }, 700);
    startHero();
  }
  if (!gate) { /* páginas internas */ }
  else if (store.sget('nana-age') === '1') { gate.hidden = true; startHero(); }
  else { lock(true); document.getElementById('yes').focus(); }
  if (gate) {
    document.getElementById('yes').addEventListener('click', openSite);
    document.getElementById('no').addEventListener('click', function () { document.getElementById('nomsg').hidden = false; });
  }

  /* ---------- Hero: flotación + inclinación 3D con el puntero ---------- */
  function startHero() {
    var stage = document.getElementById('stage'), bottle = document.getElementById('heroBottle');
    if (!stage || reduce) return;
    setTimeout(function () { stage.classList.add('float'); }, 1700);
    if (!matchMedia('(pointer: fine)').matches) return;
    var hero = document.getElementById('inicio'), raf = 0;
    hero.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        bottle.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg');
        bottle.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      });
    });
    hero.addEventListener('pointerleave', function () { bottle.style.setProperty('--ry', '0deg'); bottle.style.setProperty('--rx', '0deg'); });
  }

  /* ---------- Barra superior: estado al hacer scroll + sección activa ---------- */
  var top = document.getElementById('top'), night = document.getElementById('tokio'), stats = document.querySelector('.stats');
  function onScroll() {
    top.classList.toggle('scrolled', scrollY > 30);
    var probe = 50, dark = false;
    [night, stats].forEach(function (s) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top < probe && r.bottom > probe) dark = true; });
    top.classList.toggle('on-dark', dark);
    if (!('animationTimeline' in document.documentElement.style)) {
      var p = scrollY / (document.documentElement.scrollHeight - innerHeight);
      document.querySelector('.progress').style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
    }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var links = document.querySelectorAll('.menu a');
  var secIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(function (a) { var h = a.getAttribute('href'); if (h.charAt(0) !== '#') return; var s = document.querySelector(h); if (s) secIO.observe(s); });

  /* Menú móvil */
  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  function setMenu(o) { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Revelados + contadores ---------- */
  var rvIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(count);
      rvIO.unobserve(en.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { rvIO.observe(el); });

  function count(el) {
    var end = +el.dataset.count, sep = el.dataset.sep, t0 = null, dur = 1600;
    function fmt(n) { return sep ? n.toLocaleString('en-US') : String(n); }
    if (reduce || end === 0) { el.textContent = fmt(end); return; }
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(end * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Escena nocturna */
  if (night) new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) night.classList.add('in-view'); }); }, { threshold: .25 }).observe(night);

  /* ---------- Ruta Querétaro → Tokio: el barco sigue la curva real ---------- */
  var route = document.querySelector('.route');
  function setRoute() {
    if (!route) return;
    var svg = route.querySelector('svg'), r = svg.getBoundingClientRect(), rr = route.getBoundingClientRect();
    var sx = r.width / 1000, sy = r.height / 220, ox = r.left - rr.left, oy = r.top - rr.top;
    function p(x, y) { return (ox + x * sx).toFixed(1) + ' ' + (oy + y * sy).toFixed(1); }
    route.style.setProperty('--route', 'path("M ' + p(60, 170) + ' C ' + p(300, 10) + ', ' + p(700, 10) + ', ' + p(940, 120) + '")');
  }
  setRoute(); addEventListener('resize', setRoute, { passive: true });

  /* ---------- Precio en tres monedas ---------- */
  var P = { jpy: '¥9,745', mxn: '$1,299 MXN', usd: '$64.97 USD' }, price = document.getElementById('price');
  if (price) document.querySelectorAll('.cur button').forEach(function (b) {
    b.addEventListener('click', function () {
      price.textContent = P[b.dataset.c];
      price.classList.remove('flip'); void price.offsetWidth; price.classList.add('flip');
      document.querySelectorAll('.cur button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  });

  /* ---------- Vista ampliada ---------- */
  var lb = document.getElementById('lightbox') || document.createElement('div'), lbImg = lb.querySelector('img'), lbClose = lb.querySelector('.lb-close'), last = null;
  if (lbImg) {
  function openLb(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden'; lbClose.focus();
  }
  function closeLb() {
    lb.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 300);
    if (last) last.focus();
  }
  document.querySelectorAll('.zoom').forEach(function (z) {
    z.addEventListener('click', function () { last = z; var im = z.querySelector('img'); openLb(z.dataset.full || im.src, im.alt); });
  });
  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  }

  /* ---------- Formularios (abren el correo, como en el documento original) ---------- */
  var ja = function () { return root.dataset.l === 'ja'; };
  function mail(s, b) { location.href = 'mailto:contacto@nana-agave.jp?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(b); }
  function check(form) {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (i) {
      var bad = !i.value.trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value));
      i.parentNode.classList.toggle('bad', bad); i.setAttribute('aria-invalid', bad);
      if (bad && ok) { i.focus(); ok = false; }
    });
    return ok;
  }
  var rate = 0;
  document.querySelectorAll('#st button').forEach(function (b, i) {
    b.addEventListener('click', function () {
      rate = i + 1;
      document.querySelectorAll('#st button').forEach(function (x, j) { x.classList.toggle('on', j <= i); x.setAttribute('aria-pressed', j <= i); });
    });
  });
  var fn = document.getElementById('fn');
  if (fn) fn.addEventListener('submit', function (e) {
    e.preventDefault(); var i = document.getElementById('fne'), m = document.getElementById('fnm');
    var bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value);
    i.parentNode.classList.toggle('bad', bad);
    if (bad) { m.textContent = ja() ? 'メールアドレスを確認してください。' : 'Escribe un correo válido.'; i.focus(); return; }
    mail('Club ナナ', i.value);
    m.textContent = ja() ? 'ありがとうございます！' : '¡Gracias! Se abrirá tu app de correo.';
  });
  var fm = document.getElementById('fm'), fc = document.getElementById('fc');
  if (fm) fm.addEventListener('submit', function (e) {
    e.preventDefault(); var m = document.getElementById('fmm');
    if (!check(this)) { m.textContent = ja() ? '必須項目を入力してください。' : 'Revisa los campos marcados.'; return; }
    mail('NÄNÄ — ' + document.getElementById('mn').value, document.getElementById('mm').value + '\n\n' + document.getElementById('me').value + (rate ? '\n★ ' + rate + '/5' : ''));
    m.textContent = ja() ? 'メールアプリが開きます。送信をお願いします。' : 'Se abrirá tu app de correo; solo presiona enviar.';
  });
  if (fc) fc.addEventListener('submit', function (e) {
    e.preventDefault(); var m = document.getElementById('fcm');
    if (!check(this)) { m.textContent = ja() ? 'メールアドレスを確認してください。' : 'Escribe un correo válido.'; return; }
    mail('Club ナナ', document.getElementById('ce').value + ' · ' + document.getElementById('cr').value);
    m.textContent = ja() ? 'ありがとうございます！' : '¡Gracias! Se abrirá tu app de correo.';
  });
  document.querySelectorAll('.field input, .field textarea').forEach(function (i) {
    i.addEventListener('input', function () { i.parentNode.classList.remove('bad'); i.removeAttribute('aria-invalid'); });
  });

  /* ---------- Atmósfera: hojas de agave y polvo dorado (del documento original) ---------- */
  (function () {
    var c = document.getElementById('atmos'); if (!c || reduce) return;
    var ctx = c.getContext('2d'), w = 0, h = 0, f = 0, ps = [], run = true;
    function size() {
      var d = Math.min(devicePixelRatio || 1, 1.6); w = innerWidth; h = innerHeight;
      c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      var n = w < 700 ? 28 : 55;
      ps = Array.from({ length: n }, function () { return { x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.4, s: .15 + Math.random() * .55, dr: (Math.random() - .5) * .35, ph: Math.random() * 6.28 }; });
    }
    function leaf(x, y, len, ang, wd, a, ph) {
      ang += Math.sin(f * .006 + ph) * .07; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a;
      var g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, 'rgba(38,73,48,.02)'); g.addColorStop(.3, 'rgba(48,85,54,.18)'); g.addColorStop(.75, 'rgba(115,143,83,.22)'); g.addColorStop(1, 'rgba(184,146,63,.22)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wd * .7, -len * .32, wd * .28, -len * .56); ctx.quadraticCurveTo(wd * .15, -len * .86, 0, -len);
      ctx.quadraticCurveTo(-wd * .1, -len * .83, -wd * .22, -len * .55); ctx.quadraticCurveTo(-wd * .8, -len * .25, 0, 0); ctx.fill(); ctx.restore();
    }
    function draw() {
      if (document.hidden) { run = false; return; }
      f++; ctx.clearRect(0, 0, w, h);
      leaf(w * .04, h * 1.04, h * .8, -.3, w * .26, .35, 0); leaf(w * .96, h * 1.04, h * .78, .32, w * .25, .33, 2.1);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]; p.y -= p.s; p.x += p.dr + Math.sin(f * .009 + p.ph) * .22;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        var pu = .45 + .55 * Math.sin(f * .02 + p.ph);
        ctx.globalAlpha = .18 + .5 * pu; ctx.fillStyle = '#b8923f';
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, p.r * pu), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1; requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size, { passive: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !run) { run = true; requestAnimationFrame(draw); } });
    requestAnimationFrame(draw);
  })();
})();
