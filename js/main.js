/* Африка. Путь к независимости — главная страница.
   Общая часть (язык, шапка, логотип) — в js/common.js. Контент — в content/*.json (правит админка /admin). */
(function () {
  'use strict';

  var $ = CPA.$, $$ = CPA.$$, esc = CPA.esc, tx = CPA.tx, t = CPA.t, pad2 = CPA.pad2;
  var data = CPA.data;
  var state = { year: 0, photo: 0 };

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
    var mobile = CPA.MOBILE.matches;
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
        if (left < bar.scrollLeft || left + btn.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = Math.min(left - 16, bar.scrollWidth - bar.clientWidth);
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
    var hasStory = !!(y.story && y.story.trim());
    $('[data-tl-stage]').innerHTML =
      '<img class="tl-bg" src="' + esc(ph.src) + '" alt="" aria-hidden="true">' +
      '<div class="tl-card" role="tabpanel" aria-labelledby="year-' + state.year + '">' +
        '<span class="tl-meta">' + esc(y.year) + ' · ' + esc(tx(y.place)) + '</span>' +
        '<span class="tl-ghost" aria-hidden="true">' + esc(y.year) + '</span>' +
        '<h3 class="tl-title">' + esc(tx(y.title)) + '</h3>' +
        '<p class="tl-text">' + esc(tx(y.text)) + '</p>' +
        '<a class="tl-cta" href="' + (hasStory ? esc(y.story) : '#timeline') + '"' + (hasStory ? '' : ' data-soon') + '>' + esc(t(hasStory ? 'chronicle.cta' : 'chronicle.soon')) + CPA.ARROW + '</a>' +
        '<div class="tl-thumbs" role="tablist" aria-label="' + esc(t('chronicle.photosLabel')) + '">' +
          photos.map(function (p, j) {
            return '<button type="button" role="tab" class="thumb" data-photo="' + j + '" aria-selected="' + (j === pi) + '" tabindex="' + (j === pi ? 0 : -1) + '" aria-label="' + esc(tx(p.caption)) + '">' +
              '<img src="' + esc(p.src) + '" alt=""' + (p.color ? '' : ' class="bw"') + '></button>';
          }).join('') +
          '<span class="tl-pos">' + (pi + 1) + ' / ' + photos.length + '</span>' +
        '</div>' +
      '</div>' +
      '<figure class="tl-photo">' +
        '<img src="' + esc(ph.src) + '" alt="' + esc(tx(ph.caption)) + '"' + (ph.color ? '' : ' class="bw"') + '>' +
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
  function renderExhibitions() {
    var ex = data.exhibitions, now = ex.current;
    var exLink = CPA.exLink;
    $('[data-ex-now]').innerHTML = now && now.city ? (
      '<a class="ex-now" href="' + esc(exLink(now)) + '">' +
        '<img src="' + esc(now.photo) + '" alt="' + esc(tx(now.venue)) + '">' +
        '<div class="ex-now-card">' +
          '<span class="tags"><span class="tag">' + esc(t('exhibitions.now')) + '</span>' + (now.tag && now.tag !== 'photo' && CPA.exTag(now) ? '<span class="tag tag-sample">' + esc(CPA.exTag(now)) + '</span>' : '') + '</span>' +
          '<span class="ex-now-city">' + esc(tx(now.city)) + '</span>' +
          '<span class="ex-now-venue">' + esc(tx(now.venue)) + '</span>' +
          '<span class="ex-now-foot"><span>' + esc(now.date) + '</span><span class="more">' + esc(t('exhibitions.more')) + ' →</span></span>' +
        '</div></a>') : '';
    var cards = (ex.past || []).map(function (s, i) {
      return '<a class="ex-card" href="' + esc(exLink(s)) + '">' +
        '<div class="ex-card-img"><img src="' + esc(s.photo) + '" alt="' + esc(tx(s.venue)) + '" loading="lazy">' +
          (CPA.exTag(s) ? '<span class="sample">' + esc(CPA.exTag(s)) + '</span>' : '') + '</div>' +
        '<div class="ex-card-meta"><span>№ ' + pad2(i + 1) + '</span><span>' + esc(s.date) + '</span></div>' +
        '<span class="ex-card-city">' + esc(tx(s.city)) + '</span>' +
        '<span class="ex-card-venue">' + esc(tx(s.venue)) + '</span>' +
        '<span class="ex-card-more">' + esc(t('exhibitions.report')) + CPA.ARROW14 + '</span></a>';
    }).join('');
    var host = '<a href="#about" class="host-card" data-host-link>' +
      '<span class="host-kicker">' + esc(t('exhibitions.lPartners')) + '</span>' +
      '<span class="host-body"><span class="host-title">' + esc(t('exhibitions.hostTitle')) + '</span><span class="host-text">' + esc(t('exhibitions.hostText')) + '</span></span>' +
      '<span class="host-btn">' + esc(t('exhibitions.host')) + '</span></a>';
    $('[data-ex-grid]').innerHTML = cards + host;
  }

  // ---------- публикации ----------
  function renderPublications() {
    var ru = CPA.state.lang === 'ru';
    var list = (data.publications.items || []).filter(function (p) { return p.featured; }).slice(0, 3);
    $('[data-pubs]').innerHTML = list.map(function (p, i) {
      var journal = ru ? '«' + (p.journal.ru || p.journal.en) + '», ' + p.issue : (p.journal.en || p.journal.ru) + ', ' + String(p.issue).replace('№', 'no.');
      var title = ru ? (p.title.ru || p.title.en) : (p.title.en || p.title.ru);
      var author = ru ? (p.author.ru || p.author.en) : (p.author.en || p.author.ru);
      return '<div class="pub">' +
        '<span class="pub-n">№ ' + pad2(i + 1) + '</span>' +
        '<a class="pub-main" href="publications.html#pub-' + esc(p.id) + '"><span class="pub-by">' + esc(author) + ' · ' + esc(journal) + '</span>' +
        '<span class="pub-title"' + (ru || !p.title.en ? '' : ' lang="en"') + '>' + esc(title) + '</span></a>' +
        (p.pdf ? '<a class="pub-pdf" href="' + esc(p.pdf) + '" target="_blank" rel="noopener">' + esc(t('publications.pubRead')) + '</a>' : '<span></span>') +
        '</div>';
    }).join('');
  }

  function render() {
    document.title = t('hero.h1a') + ' ' + t('hero.h1b') + ' — ' + t('header.org') + ' ' + t('header.uni');
    var band = (t('header.org') + ' ' + t('header.uni')).toUpperCase();
    $('[data-band]').textContent = band;
    $('[data-band-alt]').setAttribute('alt', band);
    renderOrbitCaptions();
    renderTiles();
    renderYears();
    renderStage();
    renderExhibitions();
    renderPublications();
  }

  function ready() {
    buildOrbits();
    document.addEventListener('click', function (e) {
      var yb = e.target.closest('[data-year]');
      if (yb) { selectYear(+yb.getAttribute('data-year')); return; }
      var tb = e.target.closest('[data-photo]');
      if (tb) { state.photo = +tb.getAttribute('data-photo'); renderStage(true); }
    });
    document.addEventListener('keydown', tabKeys);
    // На телефоне карточку хроники можно смахнуть влево/вправо — меняется год
    CPA.onSwipe('[data-swipe="tl"]', function (dir) {
      if (!CPA.MOBILE.matches) return;
      var n = data.chronicle.items.length;
      selectYear((state.year + dir + n) % n);
    });
    // Поле «номер экспоната» ведёт на страницу экспоната
    $('[data-numform]').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#exhibit-num').value.trim().replace(',', '.');
      location.href = 'exhibit.html' + (n ? '?n=' + encodeURIComponent(n) : '');
    });
  }

  CPA.start({
    content: ['chronicle', 'orbits', 'exhibitions', 'publications'],
    ready: ready,
    render: render,
    breakpoint: function () { if ((CPA.MOBILE.matches ? 'm' : 'd') !== orbitMode) buildOrbits(); }
  });
})();
