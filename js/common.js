/* Африка. Путь к независимости — общая часть всех страниц:
   язык, логотип-транспарант, шапка и меню, тексты из content/ui.json, сообщения, плавная прокрутка.
   Каждая страница подключает этот файл, а затем свой скрипт, который вызывает CPA.start({...}). */
(function () {
  'use strict';

  var LANGS = ['ru', 'en', 'fr', 'pt', 'sw'];
  var LANG_NAMES = { ru: 'Русский', en: 'English', fr: 'Français', pt: 'Português', sw: 'Kiswahili' };
  var MOBILE = window.matchMedia('(max-width: 760px)');

  var CPA = window.CPA = { LANGS: LANGS, MOBILE: MOBILE, data: {}, state: { lang: 'ru' } };
  var opts = {};

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
    if (typeof v !== 'object') return String(v);
    return v[CPA.state.lang] || v.en || v.ru || '';
  }
  function t(path) {
    var parts = path.split('.');
    var v = CPA.data.ui;
    for (var i = 0; i < parts.length && v; i++) v = v[parts[i]];
    return tx(v);
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  // «ВЫСТАВКА» → «Выставка» (для заголовка вкладки браузера)
  function cap(s) { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function param(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&#]*)'));
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  // Почта из «Тексты сайта → О Центре» — пока там заглушка «[...]», её не используем
  function email(v) {
    v = (v || '').trim();
    return /^[^\s@\[\]]+@[^\s@\[\]]+\.[^\s@\[\]]+$/.test(v) ? v : '';
  }
  var ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  CPA.$ = $; CPA.$$ = $$; CPA.esc = esc; CPA.tx = tx; CPA.t = t; CPA.pad2 = pad2; CPA.cap = cap; CPA.param = param; CPA.email = email;
  CPA.ARROW = ARROW;
  // Выставки: куда ведёт карточка и какая у неё плашка («Фото с открытия», «Иллюстрация», «Пример»)
  CPA.exLink = function (s) { return s.link || ('exhibition.html?id=' + encodeURIComponent(s.id || '')); };
  CPA.exTag = function (s) {
    var key = s.tag === 'photo' ? 'exhibitions.tagPhoto' : s.tag === 'illus' ? 'exhibitions.tagIllus' : (s.tag === 'sample' || s.sample) ? 'exhibitions.sample' : '';
    return key ? t(key) : '';
  };
  CPA.ARROW14 = ARROW.replace(/16/g, '14');

  // ---------- язык ----------
  function initialLang() {
    var q = param('lang').toLowerCase();
    if (LANGS.indexOf(q) >= 0) return q;
    try {
      var v = (localStorage.getItem('cpa.lang') || '').toLowerCase();
      if (LANGS.indexOf(v) >= 0) return v;
    } catch (e) {}
    return 'ru';
  }
  function setLang(l) {
    CPA.state.lang = l;
    try { localStorage.setItem('cpa.lang', l.toUpperCase()); } catch (e) {}
    renderAll();
  }
  // Телефонное меню: пять кнопок. Шапка на компьютере: выпадающий список.
  var CHEVRON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function renderLangButtons() {
    var cur = CPA.state.lang;
    $$('[data-langs]').forEach(function (box) {
      box.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === cur) + '" aria-label="' + LANG_NAMES[l] + '" lang="' + l + '">' + l.toUpperCase() + '</button>';
      }).join('');
    });
    $$('[data-lang-dd]').forEach(function (box) {
      var open = box.classList.contains('open');
      box.innerHTML =
        '<button type="button" class="lang-dd-btn" data-lang-toggle aria-haspopup="listbox" aria-expanded="' + open + '" aria-label="' + esc(t('header.langLabel') + ': ' + LANG_NAMES[cur]) + '">' + cur.toUpperCase() + CHEVRON + '</button>' +
        '<div class="lang-dd-list" role="listbox" aria-label="' + esc(t('header.langLabel')) + '"' + (open ? '' : ' hidden') + '>' +
        LANGS.map(function (l) {
          return '<button type="button" role="option" data-lang="' + l + '" aria-selected="' + (l === cur) + '" lang="' + l + '"><span>' + l.toUpperCase() + '</span><span class="nm">' + LANG_NAMES[l] + '</span></button>';
        }).join('') + '</div>';
    });
  }
  function setLangMenu(open) {
    $$('[data-lang-dd]').forEach(function (box) {
      box.classList.toggle('open', open);
      var b = box.querySelector('[data-lang-toggle]'), list = box.querySelector('.lang-dd-list');
      if (b) b.setAttribute('aria-expanded', open);
      if (list) list.hidden = !open;
    });
  }

  // ---------- меню: одно на все страницы ----------
  // Страница сообщает о себе через <body data-page="...">. На главной «Хроника», «Выставки» и «О Центре» — прокрутка к блокам.
  function renderNav() {
    var page = document.body.getAttribute('data-page') || '';
    var home = page === 'home';
    var items = [
      [home ? '#timeline' : 'index.html#timeline', 'header.navChron', ''],
      [home ? '#exhibitions' : 'index.html#exhibitions', 'header.navExh', 'exhibition'],
      ['publications.html', 'header.navPub', 'publications'],
      ['news.html', 'header.navNews', 'news'],
      ['master.html', 'header.navMaster', 'master'],
      [home ? '#about' : 'about.html', 'header.navAbout', 'about']
    ];
    if (page === 'story') items.splice(1, 0, ['#materials', 'header.navArch', '']);
    var html = items.map(function (it) {
      return '<a href="' + it[0] + '"' + (it[2] && it[2] === page ? ' aria-current="page"' : '') + '>' + esc(t(it[1])) + '</a>';
    }).join('');
    $$('[data-nav]').forEach(function (el) { el.innerHTML = html; el.setAttribute('aria-label', t('header.navLabel')); });
  }

  // Простые тексты: data-t="группа.ключ", подсказки в полях: data-t-ph, подписи для экранных дикторов: data-t-aria
  function renderStaticTexts() {
    document.documentElement.lang = CPA.state.lang;
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $$('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-t-aria'))); });
    // ссылки, адрес которых задаётся в админке (например, «Положение»), и строки, которые прячутся, если поле пустое
    $$('[data-t-href]').forEach(function (el) { el.setAttribute('href', t(el.getAttribute('data-t-href')) || '#'); });
    $$('[data-hide-empty]').forEach(function (el) { el.hidden = !t(el.getAttribute('data-hide-empty')).trim(); });
    $$('[data-t-ph]').forEach(function (el) {
      var key = (MOBILE.matches && el.getAttribute('data-t-ph-mobile')) || el.getAttribute('data-t-ph');
      el.setAttribute('placeholder', t(key));
    });
    var mail = email(t('about.vEmail'));
    $$('[data-email]').forEach(function (a) {
      a.textContent = t('about.vEmail');
      a.setAttribute('href', mail ? 'mailto:' + mail : 'index.html#about');
    });
    $$('[data-host-link]').forEach(function (a) {
      a.setAttribute('href', mail ? 'mailto:' + mail + '?subject=' + encodeURIComponent(t('exhibitions.host')) : 'index.html#about');
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

  // ---------- всплывающее сообщение ----------
  var toastTimer;
  CPA.toast = function (msg) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3600);
  };

  // ---------- плавная прокрутка по якорям (0,32–0,65 с, ease-out) ----------
  CPA.smoothTo = function (id) {
    var el = id ? document.getElementById(id) : null;
    if (!el) return false;
    var se = document.scrollingElement || document.documentElement;
    var start = se.scrollTop;
    var end = Math.max(0, el.getBoundingClientRect().top + start);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { se.scrollTop = end; }
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
    try { history.replaceState(null, '', location.pathname + location.search + '#' + id); } catch (e) {}
    return true;
  };

  // ---------- свайп пальцем (телефон) ----------
  // CPA.onSwipe('[data-swipe="shot"]', function (dir) { ... }) — dir = 1 (листнуть вперёд, палец влево) или -1 (назад).
  // Порог 40 px; вертикальная прокрутка страницы не мешает (touch-action: pan-y задан в CSS для [data-swipe]).
  CPA.onSwipe = function (selector, fn) {
    var start = null;
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest(selector);
      start = el && e.isPrimary ? { x: e.clientX, y: e.clientY, el: el } : null;
    });
    document.addEventListener('pointerup', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var el = start.el;
      start = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      el.setAttribute('data-swiped', '1');
      setTimeout(function () { el.removeAttribute('data-swiped'); }, 0);
      fn(dx < 0 ? 1 : -1, el);
    });
    document.addEventListener('pointercancel', function () { start = null; });
  };

  // ---------- меню на телефоне ----------
  function setMenu(open) {
    var m = $('[data-mobile-menu]');
    if (!m) return;
    m.hidden = !open;
    $('[data-burger]').setAttribute('aria-expanded', open);
  }

  function bindCommon() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target : e.target.parentNode;
      var lb = el.closest('[data-lang]');
      if (lb) { setLangMenu(false); setLang(lb.getAttribute('data-lang')); return; }
      if (el.closest('[data-lang-toggle]')) {
        var dd = el.closest('[data-lang-dd]');
        setLangMenu(!dd.classList.contains('open'));
        return;
      }
      if (!el.closest('[data-lang-dd]')) setLangMenu(false);
      if (el.closest('[data-burger]')) { setMenu($('[data-mobile-menu]').hidden); return; }
      var soon = el.closest('[data-soon]');
      if (soon) { e.preventDefault(); CPA.toast(t('system.soonNotice')); return; }
      var a = el.closest('a[href^="#"]');
      if (a) {
        setMenu(false);
        if (CPA.smoothTo(a.getAttribute('href').slice(1))) e.preventDefault();
      } else if (el.closest('[data-mobile-menu] a')) {
        setMenu(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var dd = $('[data-lang-dd].open');
      if (dd) { setLangMenu(false); var b = dd.querySelector('[data-lang-toggle]'); if (b) b.focus(); }
    });
    var onBreakpoint = function () {
      renderStaticTexts();
      if (!MOBILE.matches) setMenu(false);
      if (opts.breakpoint) opts.breakpoint();
    };
    if (MOBILE.addEventListener) MOBILE.addEventListener('change', onBreakpoint); else MOBILE.addListener(onBreakpoint);
  }

  function renderAll() {
    renderNav();
    renderLangButtons();
    renderStaticTexts();
    if (opts.render) opts.render();
  }

  // ---------- загрузка контента ----------
  function load(name) {
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json: ' + r.status);
      return r.json();
    });
  }

  // CPA.start({ content: ['chronicle', ...], ready: function () {...}, render: function () {...} })
  // ready — один раз после загрузки, render — после загрузки и при каждой смене языка.
  CPA.start = function (o) {
    opts = o || {};
    var names = ['ui'].concat(opts.content || []);
    CPA.state.lang = initialLang();
    renderLogo();
    measureOswald();
    Promise.all(names.map(load)).then(function (res) {
      names.forEach(function (n, i) { CPA.data[n] = res[i]; });
      if (opts.ready) opts.ready();
      renderAll();
      bindCommon();
      // переход по ссылке вида page.html#раздел — после того как раздел отрисован
      if (location.hash.length > 1) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }).catch(function (err) {
      console.error(err);
      document.body.insertAdjacentHTML('afterbegin', '<p class="noscript">Не удалось загрузить содержимое сайта (' + esc(err.message) + '). Если вы открыли файл двойным щелчком, запустите локальный сервер: см. ИНСТРУКЦИЯ.md.</p>');
    });
  };
})();
