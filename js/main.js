/* Африка. Путь к независимости — логика главной страницы.
   Весь изменяемый контент лежит в content/*.json (их правит админка /admin).
   Здесь — только то, КАК его показать: язык, орбиты, хроника, выставки, публикации. */
(function () {
  'use strict';

  var LANGS = ['ru', 'en', 'fr', 'pt', 'sw'];
  var LANG_NAMES = { ru: 'Русский', en: 'English', fr: 'Français', pt: 'Português', sw: 'Kiswahili' };
  var CONTENT = ['ui', 'chronicle', 'orbits', 'exhibitions', 'publications', 'credits'];
  var MOBILE = window.matchMedia('(max-width: 760px)');

  var data = {};
  var state = { lang: 'ru', year: 0, photo: 0 };

  // ---------- помощники ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Текст на текущем языке. Если перевода нет — английский, затем русский.
  function tx(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v[state.lang] || v.en || v.ru || '';
  }
  function t(path) {
    var parts = path.split('.');
    var v = data.ui;
    for (var i = 0; i < parts.length && v; i++) v = v[parts[i]];
    return tx(v);
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  var ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ARROW14 = ARROW.replace(/16/g, '14');

  // ---------- язык ----------
  function initialLang() {
    var q = (location.search.match(/[?&]lang=(\w\w)/) || [])[1];
    if (q && LANGS.indexOf(q.toLowerCase()) >= 0) return q.toLowerCase();
    try {
      var v = (localStorage.getItem('cpa.lang') || '').toLowerCase();
      if (LANGS.indexOf(v) >= 0) return v;
    } catch (e) {}
    return 'ru';
  }
  function setLang(l) {
    state.lang = l;
    try { localStorage.setItem('cpa.lang', l.toUpperCase()); } catch (e) {}
    renderAll();
  }
  function renderLangButtons() {
    $$('[data-langs]').forEach(function (box) {
      box.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === state.lang) + '" aria-label="' + LANG_NAMES[l] + '" lang="' + l + '">' + l.toUpperCase() + '</button>';
      }).join('');
    });
  }

  // Простые тексты: data-t="группа.ключ", подсказки в полях: data-t-ph, подписи для экранных дикторов: data-t-aria
  function renderStaticTexts() {
    document.documentElement.lang = state.lang;
    document.title = t('hero.h1a') + ' ' + t('hero.h1b') + ' — ' + t('header.org') + ' ' + t('header.uni');
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $$('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-t-aria'))); });
    $$('[data-t-ph]').forEach(function (el) {
      var key = (MOBILE.matches && el.getAttribute('data-t-ph-mobile')) || el.getAttribute('data-t-ph');
      el.setAttribute('placeholder', t(key));
    });
    var band = (t('header.org') + ' ' + t('header.uni')).toUpperCase();
    $('[data-band]').textContent = band;
    $('[data-band-alt]').setAttribute('alt', band);
    // Почта: пока в поле заглушка «[...]» — ссылка ведёт к блоку «О Центре»
    var email = t('about.vEmail');
    var valid = /^[^\s@\[\]]+@[^\s@\[\]]+\.[^\s@\[\]]+$/.test(email);
    var mail = $('[data-email]');
    mail.textContent = email;
    mail.setAttribute('href', valid ? 'mailto:' + email : '#about');
    $$('[data-host-link]').forEach(function (a) {
      a.setAttribute('href', valid ? 'mailto:' + email + '?subject=' + encodeURIComponent(t('exhibitions.host')) : '#about');
    });
  }

  // ---------- логотип-транспарант (перенос Logo.dc.html) ----------
  var capRatio = 0.72; // высота заглавной буквы Oswald относительно размера шрифта; уточняется после загрузки шрифта
  var logoSeq = 0;
  function logoSVG() {
    var u = 'cpa' + (++logoSeq);
    var T = 163, B = 268, H = B - T, sag = 30, L = 2, R = 510, W = R - L;
    var t0 = T - sag * 0.55, b0 = B - sag * 0.55;
    function yT(x) { var s = (x - L) / W; return t0 + 4 * sag * s * (1 - s); }
    function yB(x) { var s = (x - L) / W; return b0 + 4 * sag * 0.92 * s * (1 - s); }
    function slope(x) { var s = (x - L) / W; return 4 * sag * (1 - 2 * s) / W; }
    var x, d = 'M' + L + ',' + t0.toFixed(1);
    for (x = L + 6; x <= R; x += 6) d += ' L' + x + ',' + yT(x).toFixed(1);
    d += ' L' + (R - 5) + ',' + ((t0 + b0) / 2).toFixed(1) + ' L' + R + ',' + b0.toFixed(1);
    for (x = R - 6; x >= L; x -= 6) d += ' L' + x + ',' + yB(x).toFixed(1);
    d += ' L' + (L + 5) + ',' + ((t0 + b0) / 2).toFixed(1) + ' Z';
    function arc(k) {
      function yy(x) { return yT(x) + (yB(x) - yT(x)) * k; }
      var p = 'M' + (L + 30) + ',' + yy(L + 30).toFixed(1);
      for (var x = L + 60; x <= R - 30; x += 30) p += ' L' + x + ',' + yy(x).toFixed(1);
      return p;
    }
    function ln(x1, y1, x2, y2) { return 'M' + x1 + ',' + y1.toFixed(1) + ' L' + x2 + ',' + y2.toFixed(1); }
    var f = {
      a0: arc(0.14), a1: arc(0.30), a2: arc(0.52), a3: arc(0.72), a4: arc(0.88),
      p0: ln(L + 8, t0 + 4, 120, yB(120) - 14), p1: ln(R - 8, t0 + 4, 392, yB(392) - 14),
      p2: ln(L + 14, t0 + 14, 90, yB(90) - 8), p3: ln(R - 14, t0 + 14, 422, yB(422) - 8)
    };
    var cap = H * 0.56;
    var fs = (cap / capRatio).toFixed(1);
    function letter(ch, x) {
      var mid = (yT(x) + yB(x)) / 2;
      var a = (Math.atan(slope(x)) * 180 / Math.PI).toFixed(2);
      return '<text x="' + x + '" y="' + (mid + cap / 2).toFixed(1) + '" transform="rotate(' + a + ' ' + x + ' ' + mid.toFixed(1) + ')" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="' + fs + '" fill="#F6F1E7">' + ch + '</text>';
    }
    function folds(white, op) {
      var w = white || '#fff';
      return '<g filter="url(#' + u + 'b)" fill="none" stroke-linecap="round"' + (op ? ' opacity="' + op + '"' : '') + '>' +
        '<path d="' + f.a0 + '" stroke="' + w + '" stroke-opacity="0.20" stroke-width="5"/>' +
        '<path d="' + f.a1 + '" stroke="#2a0503" stroke-opacity="0.30" stroke-width="7"/>' +
        '<path d="' + f.a2 + '" stroke="' + w + '" stroke-opacity="0.12" stroke-width="6"/>' +
        '<path d="' + f.a3 + '" stroke="#2a0503" stroke-opacity="0.28" stroke-width="8"/>' +
        (op ? '' : '<path d="' + f.a4 + '" stroke="#fff" stroke-opacity="0.10" stroke-width="5"/>') +
        '<path d="' + f.p0 + '" stroke="#2a0503" stroke-opacity="0.30" stroke-width="6"/>' +
        '<path d="' + f.p1 + '" stroke="#2a0503" stroke-opacity="0.30" stroke-width="6"/>' +
        (op ? '' : '<path d="' + f.p2 + '" stroke="#fff" stroke-opacity="0.18" stroke-width="4"/><path d="' + f.p3 + '" stroke="#fff" stroke-opacity="0.18" stroke-width="4"/>') +
        '</g>';
    }
    var ky = (t0 + 3).toFixed(1);
    // Буквы «ЦПА» на транспаранте — часть логотипа и не переводятся
    return '<svg viewBox="0 0 512 404" aria-hidden="true">' +
      '<defs>' +
      '<clipPath id="' + u + 'a"><rect x="0" y="0" width="512" height="159"/><rect x="0" y="275" width="512" height="130"/></clipPath>' +
      '<clipPath id="' + u + 'c"><path d="' + d + '"/></clipPath>' +
      '<linearGradient id="' + u + 'v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.10"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>' +
      '<linearGradient id="' + u + 'e" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.12" stop-color="#000" stop-opacity="0"/><stop offset="0.88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient>' +
      '<filter id="' + u + 'b" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="4.5"/></filter>' +
      '<filter id="' + u + 's" x="-5%" y="-30%" width="110%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/></filter>' +
      '</defs>' +
      '<image href="assets/logo_dark__fc87e939.png" x="0" y="0" width="512" height="404" clip-path="url(#' + u + 'a)"/>' +
      '<path d="M77,150 L434,150 L434,240 L423,276 L87,276 L77,240 Z" fill="#141414"/>' +
      '<path d="' + d + '" fill="#C8321B" filter="url(#' + u + 's)"/>' +
      '<g clip-path="url(#' + u + 'c)">' +
      '<rect x="0" y="100" width="512" height="230" fill="url(#' + u + 'v)"/>' +
      '<rect x="0" y="100" width="512" height="230" fill="url(#' + u + 'e)"/>' +
      folds('#fff') +
      letter('Ц', 256 - 112) + letter('П', 256) + letter('А', 256 + 112) +
      folds('#C8321B', '0.55') +
      '</g>' +
      '<circle cx="' + (L + 4) + '" cy="' + ky + '" r="3.4" fill="#C9A24A" stroke="#6b5420" stroke-width="1"/>' +
      '<circle cx="' + (R - 4) + '" cy="' + ky + '" r="3.4" fill="#C9A24A" stroke="#6b5420" stroke-width="1"/>' +
      '</svg>';
  }
  function renderLogo() { $$('[data-logo]').forEach(function (el) { el.innerHTML = logoSVG(); }); }
  function measureOswald() {
    if (!document.fonts || !document.fonts.load) return;
    document.fonts.load('600 100px Oswald').then(function () {
      try {
        var c = document.createElement('canvas').getContext('2d');
        c.font = '600 100px Oswald';
        var a = c.measureText('П').actualBoundingBoxAscent;
        if (a > 0) { capRatio = a / 100; renderLogo(); }
      } catch (e) {}
    });
  }

  // ---------- обложка: фото на трёх вложенных эллиптических орбитах ----------
  var JIT = [1, 0.93, 1.05, 0.96, 1.04, 0.91, 1.07];
  var RAT = [4 / 5, 1, 4 / 3, 3 / 4, 5 / 4];
  var ROT = [-3, 2, -1, 3, -2, 1];
  var FADE = 24; // секунды на полный цикл смены трёх фото в одной рамке
  // [радиус по X (vw), радиус по Y, фото на кольце, период (с), направление, ширина фото (px)]
  var RINGS_DESKTOP = [[43, 0.40, 7, 150, 1, 196], [29, 0.27, 5, 118, -1, 164], [15, 0.14, 3, 92, 1, 128]];
  var RINGS_MOBILE = [[36, 300, 5, 130, 1, 118], [25, 200, 4, 104, -1, 98], [12, 105, 3, 84, 1, 80]];
  var orbitMode = null;

  function buildOrbits() {
    var mobile = MOBILE.matches;
    orbitMode = mobile ? 'm' : 'd';
    var pool = data.orbits.orbit;
    if (!pool.length) { $('[data-orbits]').innerHTML = ''; return; }
    var orb = [];
    (mobile ? RINGS_MOBILE : RINGS_DESKTOP).forEach(function (ring, r) {
      var rx = ring[0], ry = ring[1], n = ring[2], per = ring[3], dir = ring[4], w = ring[5];
      for (var j = 0; j < n; j++) {
        var k = orb.length, jit = JIT[(k * 3) % 7];
        orb.push({
          rx: rx * jit,
          ry: mobile ? Math.round(ry * jit) + 'px' : 'min(calc((100vh - 73px) * ' + (ry * jit).toFixed(3) + '), ' + Math.round(820 * ry * jit) + 'px)',
          w: Math.round(w * JIT[(k + 2) % 7]), ratio: RAT[k % 5], per: per, ph: j / n + r * 0.17, rot: ROT[k % 6], dir: dir
        });
      }
    });
    $('[data-orbits]').innerHTML = orb.map(function (o, i) {
      var P = o.per, half = (P / 2).toFixed(2), d = -(o.ph * P);
      var imgs = [0, 1, 2].map(function (j) {
        var idx = (i + j * orb.length) % pool.length;
        return '<div class="orb-img" style="animation: cpaFade ' + FADE + 's linear ' + (-(j * FADE / 3) - i * 1.7).toFixed(2) + 's infinite">' +
          '<img src="' + esc(pool[idx].src) + '" alt="" decoding="async"><span class="cap" data-orbit-cap="' + idx + '"></span></div>';
      }).join('');
      return '<div class="orb-x" style="--rx: ' + o.rx.toFixed(2) + 'vw; animation: cpaX ' + half + 's ease-in-out ' + d.toFixed(2) + 's infinite ' + (o.dir < 0 ? 'alternate-reverse' : 'alternate') + '">' +
        '<div class="orb-y" style="--ry: ' + o.ry + '; animation: cpaY ' + half + 's ease-in-out ' + (d - P / 4).toFixed(2) + 's infinite alternate">' +
        '<figure class="orb-fig" style="width: ' + o.w + 'px; height: ' + Math.round(o.w / o.ratio) + 'px; transform: translate(-50%, -50%) rotate(' + o.rot + 'deg)">' + imgs + '</figure></div></div>';
    }).join('');
    renderOrbitCaptions();
  }
  function renderOrbitCaptions() {
    var pool = data.orbits.orbit;
    $$('[data-orbit-cap]').forEach(function (el) { el.textContent = tx(pool[+el.getAttribute('data-orbit-cap')].caption); });
  }
  // Неподвижная раскладка (для «уменьшить движение»): [слева %, сверху %, ширина %, высота %, поворот]
  var TILE_POS = [[3, 6, 15, 34, -3], [22, 3, 24, 26, 2], [52, 4, 13, 32, -2], [72, 7, 17, 33, 3], [1, 46, 17, 22, 2], [78, 46, 21, 22, -3], [6, 70, 14, 30, -2], [33, 74, 11, 22, 4], [55, 68, 14, 32, 2], [76, 74, 17, 24, -2]];
  function renderTiles() {
    $('[data-tiles]').innerHTML = (data.orbits.still || []).slice(0, TILE_POS.length).map(function (s, i) {
      var p = TILE_POS[i];
      return '<figure class="tile" style="left: ' + p[0] + '%; top: ' + p[1] + '%; width: ' + p[2] + '%; height: ' + p[3] + '%; transform: rotate(' + p[4] + 'deg)">' +
        '<img src="' + esc(s.src) + '" alt="' + esc(tx(s.caption)) + '" loading="lazy"><figcaption class="cap">' + esc(tx(s.caption)) + '</figcaption></figure>';
    }).join('');
  }

  // ---------- хроника ----------
  function renderYears() {
    var items = data.chronicle.items;
    $('[data-years]').innerHTML = items.map(function (y, i) {
      return '<button type="button" role="tab" class="year-tab" id="year-' + i + '" data-year="' + i + '" aria-selected="' + (i === state.year) + '" tabindex="' + (i === state.year ? 0 : -1) + '">' +
        '<span class="y">' + esc(y.year) + '</span><span class="p">' + esc(tx(y.place)) + '</span></button>';
    }).join('');
  }
  function selectYear(i, focus) {
    state.year = i; state.photo = 0;
    $$('.year-tab').forEach(function (b, k) {
      b.setAttribute('aria-selected', k === i);
      b.tabIndex = k === i ? 0 : -1;
    });
    var btn = $('#year-' + i);
    if (btn) {
      if (focus) btn.focus();
      // на телефоне — прокрутить ленту годов, чтобы выбранный был виден
      var bar = btn.parentNode;
      if (bar.scrollWidth > bar.clientWidth) {
        var left = btn.offsetLeft - bar.offsetLeft;
        if (left < bar.scrollLeft || left + btn.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = left - 16;
      }
    }
    renderStage();
  }
  function renderStage(focusThumb) {
    var y = data.chronicle.items[state.year];
    if (!y) { $('[data-tl-stage]').innerHTML = ''; return; }
    var photos = y.photos || [];
    var pi = Math.min(state.photo, Math.max(photos.length - 1, 0));
    var ph = photos[pi] || { src: '', caption: '' };
    var bw = ph.color ? '' : ' bw';
    var hasStory = !!(y.story && y.story.trim());
    $('[data-tl-stage]').innerHTML =
      '<img class="tl-bg" src="' + esc(ph.src) + '" alt="" aria-hidden="true">' +
      '<div class="tl-card" role="tabpanel" aria-labelledby="year-' + state.year + '">' +
        '<span class="tl-meta">' + esc(y.year) + ' · ' + esc(tx(y.place)) + '</span>' +
        '<span class="tl-ghost" aria-hidden="true">' + esc(y.year) + '</span>' +
        '<h3 class="tl-title">' + esc(tx(y.title)) + '</h3>' +
        '<p class="tl-text">' + esc(tx(y.text)) + '</p>' +
        '<a class="tl-cta" href="' + (hasStory ? esc(y.story) : '#timeline') + '"' + (hasStory ? '' : ' data-soon') + '>' + esc(t(hasStory ? 'chronicle.cta' : 'chronicle.soon')) + ARROW + '</a>' +
        '<div class="tl-thumbs" role="tablist" aria-label="' + esc(t('chronicle.photosLabel')) + '">' +
          photos.map(function (p, j) {
            return '<button type="button" role="tab" class="thumb" data-photo="' + j + '" aria-selected="' + (j === pi) + '" tabindex="' + (j === pi ? 0 : -1) + '" aria-label="' + esc(tx(p.caption)) + '">' +
              '<img src="' + esc(p.src) + '" alt=""' + (p.color ? '' : ' class="bw"') + '></button>';
          }).join('') +
          '<span class="tl-pos">' + (pi + 1) + ' / ' + photos.length + '</span>' +
        '</div>' +
      '</div>' +
      '<figure class="tl-photo">' +
        '<img src="' + esc(ph.src) + '" alt="' + esc(tx(ph.caption)) + '" class="' + bw.trim() + '">' +
        '<figcaption>' + esc(tx(ph.caption)) + '</figcaption>' +
      '</figure>';
    if (focusThumb) { var b = $('.thumb[data-photo="' + pi + '"]'); if (b) b.focus(); }
  }
  // Стрелки влево/вправо по вкладкам годов и миниатюрам
  function tabKeys(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    var yb = e.target.closest('.year-tab'), tb = e.target.closest('.thumb');
    if (!yb && !tb) return;
    e.preventDefault();
    var n = yb ? data.chronicle.items.length : (data.chronicle.items[state.year].photos || []).length;
    var cur = yb ? state.year : state.photo;
    var next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (cur + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    if (yb) selectYear(next, true); else { state.photo = next; renderStage(true); }
  }

  // ---------- выставки ----------
  function sampleTag() { return '<span class="tag tag-sample">' + esc(t('exhibitions.sample')) + '</span>'; }
  function linkOpen(link, cls) {
    return link ? '<a class="' + cls + '" href="' + esc(link) + '">' : '<a class="' + cls + '" href="#exhibitions" data-soon>';
  }
  function renderExhibitions() {
    var ex = data.exhibitions, now = ex.current;
    $('[data-ex-now]').innerHTML = now && now.city ? (
      linkOpen(now.link, 'ex-now') +
        '<img src="' + esc(now.photo) + '" alt="' + esc(tx(now.venue)) + '">' +
        '<div class="ex-now-card">' +
          '<span class="tags"><span class="tag">' + esc(t('exhibitions.now')) + '</span>' + (now.sample ? sampleTag() : '') + '</span>' +
          '<span class="ex-now-city">' + esc(tx(now.city)) + '</span>' +
          '<span class="ex-now-venue">' + esc(tx(now.venue)) + '</span>' +
          '<span class="ex-now-foot"><span>' + esc(now.date) + '</span><span class="more">' + esc(t('exhibitions.more')) + ' →</span></span>' +
        '</div></a>') : '';
    var cards = (ex.past || []).map(function (s, i) {
      return linkOpen(s.link, 'ex-card') +
        '<div class="ex-card-img"><img src="' + esc(s.photo) + '" alt="' + esc(tx(s.venue)) + '" loading="lazy">' +
          (s.sample ? '<span class="sample">' + esc(t('exhibitions.sample')) + '</span>' : '') + '</div>' +
        '<div class="ex-card-meta"><span>№ ' + pad2(i + 1) + '</span><span>' + esc(s.date) + '</span></div>' +
        '<span class="ex-card-city">' + esc(tx(s.city)) + '</span>' +
        '<span class="ex-card-venue">' + esc(tx(s.venue)) + '</span>' +
        '<span class="ex-card-more">' + esc(t('exhibitions.report')) + ARROW14 + '</span></a>';
    }).join('');
    var host = '<a href="#about" class="host-card" data-host-link>' +
      '<span class="host-kicker">' + esc(t('exhibitions.lPartners')) + '</span>' +
      '<span class="host-body"><span class="host-title">' + esc(t('exhibitions.hostTitle')) + '</span><span class="host-text">' + esc(t('exhibitions.hostText')) + '</span></span>' +
      '<span class="host-btn">' + esc(t('exhibitions.host')) + '</span></a>';
    $('[data-ex-grid]').innerHTML = cards + host;
  }

  // ---------- публикации ----------
  function renderPublications() {
    var ru = state.lang === 'ru';
    var list = (data.publications.items || []).filter(function (p) { return p.featured; }).slice(0, 3);
    $('[data-pubs]').innerHTML = list.map(function (p, i) {
      var journal = ru ? '«' + (p.journal.ru || p.journal.en) + '», ' + p.issue : (p.journal.en || p.journal.ru) + ', ' + String(p.issue).replace('№', 'no.');
      var title = ru ? (p.title.ru || p.title.en) : (p.title.en || p.title.ru);
      var author = ru ? (p.author.ru || p.author.en) : (p.author.en || p.author.ru);
      return '<div class="pub">' +
        '<span class="pub-n">№ ' + pad2(i + 1) + '</span>' +
        '<a class="pub-main" href="#publications" data-soon><span class="pub-by">' + esc(author) + ' · ' + esc(journal) + '</span>' +
        '<span class="pub-title"' + (ru || !p.title.en ? '' : ' lang="en"') + '>' + esc(title) + '</span></a>' +
        (p.pdf ? '<a class="pub-pdf" href="' + esc(p.pdf) + '" target="_blank" rel="noopener">' + esc(t('publications.pubRead')) + '</a>' : '<span></span>') +
        '</div>';
    }).join('');
  }

  // ---------- подвал: источники фото ----------
  function renderCredits() {
    var caps = {};
    (data.chronicle.items || []).forEach(function (y) { (y.photos || []).forEach(function (p) { if (!caps[p.src]) caps[p.src] = p.caption; }); });
    (data.orbits.orbit || []).concat(data.orbits.still || []).forEach(function (p) { if (!caps[p.src]) caps[p.src] = p.caption; });
    var ex = data.exhibitions;
    [ex.current].concat(ex.past || []).forEach(function (s) { if (s && !caps[s.photo]) caps[s.photo] = { ru: tx(s.venue) + ', ' + tx(s.city), en: '' }; });
    $('[data-credits]').innerHTML = (data.credits.items || []).map(function (c) {
      var name = tx(caps[c.src]) || c.src.split('/').pop();
      return '<li><b>' + esc(name) + '</b> — ' + esc(tx(c.credit)) + '</li>';
    }).join('');
  }

  // ---------- сообщение «появится на следующем этапе» ----------
  var toastTimer;
  function toast(msg) {
    var el = $('[data-toast]');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  // ---------- плавная прокрутка по якорям (0,32–0,65 с, ease-out) ----------
  function smoothTo(id) {
    var el = id ? document.getElementById(id) : null;
    if (!el) return false;
    var se = document.scrollingElement || document.documentElement;
    var start = se.scrollTop;
    var end = Math.max(0, el.getBoundingClientRect().top + start);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { se.scrollTop = end; }
    else {
      var dur = Math.min(650, Math.max(320, Math.abs(end - start) * 0.22));
      var t0 = performance.now();
      var step = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        se.scrollTop = start + (end - start) * (1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    return true;
  }

  // ---------- меню на телефоне ----------
  function setMenu(open) {
    var m = $('[data-mobile-menu]');
    m.hidden = !open;
    $('[data-burger]').setAttribute('aria-expanded', open);
  }

  // ---------- события ----------
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target : e.target.parentNode;
      var lb = el.closest('[data-lang]');
      if (lb) { setLang(lb.getAttribute('data-lang')); return; }
      if (el.closest('[data-burger]')) { setMenu($('[data-mobile-menu]').hidden); return; }
      var yb = el.closest('[data-year]');
      if (yb) { selectYear(+yb.getAttribute('data-year')); return; }
      var tb = el.closest('[data-photo]');
      if (tb) { state.photo = +tb.getAttribute('data-photo'); renderStage(true); return; }
      var soon = el.closest('[data-soon]');
      if (soon) { e.preventDefault(); toast(t('system.soonNotice')); return; }
      var a = el.closest('a[href^="#"]');
      if (a) {
        setMenu(false);
        if (smoothTo(a.getAttribute('href').slice(1))) e.preventDefault();
      }
    });
    document.addEventListener('keydown', tabKeys);
    // Поле «номер экспоната»: страницы экспонатов — следующий этап
    $('[data-numform]').addEventListener('submit', function (e) {
      e.preventDefault();
      toast(t('system.soonNotice'));
    });
    var onBreakpoint = function () {
      if ((MOBILE.matches ? 'm' : 'd') !== orbitMode) buildOrbits();
      renderStaticTexts();
      if (!MOBILE.matches) setMenu(false);
    };
    if (MOBILE.addEventListener) MOBILE.addEventListener('change', onBreakpoint); else MOBILE.addListener(onBreakpoint);
  }

  function renderAll() {
    renderLangButtons();
    renderStaticTexts();
    renderOrbitCaptions();
    renderTiles();
    renderYears();
    renderStage();
    renderExhibitions();
    renderPublications();
    renderCredits();
  }

  // ---------- загрузка контента ----------
  function load(name) {
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json: ' + r.status);
      return r.json();
    });
  }
  state.lang = initialLang();
  renderLogo();
  measureOswald();
  Promise.all(CONTENT.map(load)).then(function (res) {
    CONTENT.forEach(function (n, i) { data[n] = res[i]; });
    buildOrbits();
    renderAll();
    bindEvents();
  }).catch(function (err) {
    console.error(err);
    document.body.insertAdjacentHTML('afterbegin', '<p class="noscript">Не удалось загрузить содержимое сайта (' + esc(err.message) + '). Если вы открыли файл index.html двойным щелчком, запустите локальный сервер: см. ИНСТРУКЦИЯ.md.</p>');
  });
})();
