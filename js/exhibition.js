/* Страница выставки (exhibition.html?id=jhb, ?id=dar). Данные — content/exhibitions.json, сюжеты и их материалы — content/stories.json. */
(function () {
  'use strict';

  var $ = CPA.$, $$ = CPA.$$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var state = { shot: 0, xOpen: false, xFilter: 'all' };
  var ex = null, isNow = false;

  function gallery() {
    var g = (ex.gallery || []).filter(function (s) { return s.src; });
    return g.length ? g : [{ src: ex.photo, caption: ex.venue, credit: '' }];
  }
  function story(id) { return (CPA.data.stories.items || []).filter(function (x) { return x.id === id; })[0]; }

  function renderShot() {
    var g = gallery();
    var s = g[state.shot] || g[0];
    var box = $('[data-shot]');
    if (!box) return;
    // подпись: «что на фото · чьё фото» (автор у снимка или общий для выставки)
    var credit = s.credit || tx(ex.photoCredit).replace(/^[^:]+:\s*/, '');
    var cap = tx(s.caption) + (credit ? ' · ' + credit : '');
    box.innerHTML =
      '<img class="xb-shot-bg" src="' + esc(s.src) + '" alt="" aria-hidden="true">' +
      '<figure class="xb-shot-fig"><img src="' + esc(s.src) + '" alt="' + esc(tx(s.caption)) + '"><figcaption>' + esc(cap) + '</figcaption></figure>' +
      (g.length > 1 ? '<button type="button" class="xb-arrow left" data-shot-step="-1" aria-label="' + esc(t('exhibition.prev')) + '">←</button>' +
        '<button type="button" class="xb-arrow right" data-shot-step="1" aria-label="' + esc(t('exhibition.next')) + '">→</button>' : '');
    $('[data-shot-pos]').textContent = (state.shot + 1) + ' / ' + g.length;
    $$('[data-shot-pick]').forEach(function (b, i) { b.setAttribute('aria-selected', i === state.shot); });
  }

  // ---------- «Экспонаты»: материалы сюжетов, по умолчанию один ряд из 4 карточек ----------
  function exhibitItems() {
    return (ex.exhibits || []).map(function (ref) {
      var st = story(ref.story);
      if (!st) return null;
      var it = (st.items || []).filter(function (x) { return x.code === ref.code; })[0];
      return it ? { story: st, item: it } : null;
    }).filter(Boolean);
  }
  function renderExhibits() {
    var box = $('[data-exhibits]');
    if (!box) return;
    var all = exhibitItems();
    if (!all.length) { box.hidden = true; return; }
    var mobile = CPA.MOBILE.matches;
    var open = state.xOpen || mobile;
    var f = open ? state.xFilter : 'all';
    var list = all.filter(function (e) { return f === 'all' || e.story.id === f; });
    if (!open) list = list.slice(0, 4);
    var storyIds = [];
    all.forEach(function (e) { if (storyIds.indexOf(e.story.id) < 0) storyIds.push(e.story.id); });
    var filters = open ? '<div class="chips xb-x-filters noscroll" role="group" aria-label="' + esc(t('exhibition.exH')) + '">' +
      [['all', t('exhibition.exAll'), all.length]].concat(storyIds.map(function (id) {
        return [id, tx(story(id).title), all.filter(function (e) { return e.story.id === id; }).length];
      })).map(function (o) {
        return '<button type="button" class="chip" data-xfilter="' + esc(o[0]) + '" aria-pressed="' + (f === o[0]) + '">' + esc(o[1]) + ' <span class="cnt">' + o[2] + '</span></button>';
      }).join('') + '</div>' : '';
    var cards = list.map(function (e) {
      var it = e.item, doc = it.type === 'doc';
      return '<a class="xb-x-card" href="story.html?id=' + encodeURIComponent(e.story.id) + '&open=' + encodeURIComponent(it.code) + '#materials">' +
        '<div class="xb-x-img' + (doc ? ' doc' : '') + '"><img src="' + esc(it.src) + '" alt="' + esc(tx(it.title)) + '" loading="lazy"' + (doc || it.color ? '' : ' class="bw"') + '>' +
          '<span class="xb-x-kind' + (doc ? ' doc' : '') + '">' + esc(t(doc ? 'exhibition.exDoc' : 'exhibition.exPhoto')) + '</span></div>' +
        '<div class="xb-x-meta"><span>' + esc(it.code) + '</span><span>' + esc(tx(it.date)) + '</span></div>' +
        '<span class="xb-x-title">' + esc(tx(it.title)) + '</span>' +
        '<span class="xb-x-open">' + esc(t('exhibition.exOpen')) + ' →</span></a>';
    }).join('');
    box.hidden = false;
    box.innerHTML =
      '<div class="wrap xb-x-inner">' +
        '<div class="section-head"><div class="xb-x-headtext"><h2 class="h2-sm">' + esc(t('exhibition.exH')) + '</h2>' +
          '<span class="tag tag-sample">' + esc(t('exhibition.exNote')) + '</span></div>' +
          '<p class="section-hint">' + esc(t('exhibition.exHint')) + '</p></div>' +
        filters +
        '<span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span>' +
        '<div class="xb-x-grid noscroll">' + cards + '</div>' +
        (mobile ? '' : '<button type="button" class="btn-outline xb-x-toggle" data-xtoggle aria-expanded="' + open + '">' +
          esc(open ? t('exhibition.exLess') + ' ↑' : t('exhibition.exMore') + ' · ' + all.length + ' ↓') + '</button>') +
      '</div>';
  }

  function render() {
    var data = CPA.data.exhibitions;
    var all = [data.current].concat(data.past || []).filter(Boolean);
    var id = CPA.param('id');
    ex = all.filter(function (x) { return x.id === id; })[0] || (id ? null : data.current);
    var main = $('[data-exhibition]');
    if (!ex) {
      document.title = t('exhibition.notFound');
      main.innerHTML = '<section class="wrap notfound"><h1 class="h2">' + esc(t('exhibition.notFound')) + '</h1><a class="btn-dark" href="index.html#exhibitions">' + esc(t('header.navExh')) + ' →</a></section>';
      return;
    }
    isNow = ex === data.current;
    // название и описание — свои у каждой выставки; если не заполнены, общие из «Текстов сайта»
    var title = tx(ex.title) || (t('hero.h1a') + ' ' + t('hero.h1b'));
    var kicker = tx(ex.kicker) || (t('exhibition.word') + (isNow ? ' · ' + t('exhibition.latest') : ''));
    document.title = CPA.cap(t('exhibition.word')) + ': ' + tx(ex.city) + ' — ' + title;

    var meta = [[t('exhibition.lDates'), ex.date], [t('exhibition.lPlace'), tx(ex.address)], [t('exhibition.lHours'), tx(ex.hours)], [t('exhibition.lEntry'), tx(ex.entry)]]
      .filter(function (m) { return m[1]; })
      .map(function (m) { return '<div><dt>' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>'; }).join('');
    var stats = (ex.stats || []).map(function (s) { return '<div><span class="xb-stat-n">' + esc(s.value) + '</span><span class="xb-stat-l">' + esc(tx(s.label)) + '</span></div>'; }).join('');
    var sections = (ex.sections || []).map(function (s, i) {
      var st = story(s.story);
      if (!st) return '';
      return '<a class="xb-sec" href="story.html?id=' + encodeURIComponent(st.id) + '"><img src="' + esc(s.photo || st.card) + '" alt="" loading="lazy">' +
        '<div class="xb-sec-glass"><span class="xb-sec-meta">' + esc(t('exhibition.hall')) + ' ' + CPA.pad2(i + 1) + ' · ' + esc(s.years) + '</span>' +
        '<span class="xb-sec-title">' + esc(tx(st.title)) + '</span><span class="xb-sec-open">' + esc(t('exhibition.open')) + ' →</span></div></a>';
    }).join('');
    var g = gallery();
    if (state.shot >= g.length) state.shot = 0;
    var thumbs = g.length > 1 ? '<div class="xb-thumbs noscroll" role="tablist" aria-label="' + esc(t('exhibition.photoH')) + '">' + g.map(function (s, i) {
      return '<button type="button" role="tab" data-shot-pick="' + i + '" aria-label="' + esc(tx(s.caption)) + '"><img src="' + esc(s.src) + '" alt=""></button>';
    }).join('') + '</div>' : '';
    var partners = (ex.partners || []).map(function (p) {
      return '<div class="xb-partner">' + (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(tx(p.name)) + '">' : esc(tx(p.name))) + '</div>';
    }).join('');
    var press = (ex.press || []).map(function (p) {
      var ttl = esc(tx(p.title));
      var ext = /^https?:/.test(p.link || '');
      return '<div class="xb-press"><span class="src">' + esc(tx(p.source)) + '</span><span class="ttl">' +
        (p.link ? '<a href="' + esc(p.link) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + ttl + (ext ? ' ↗' : ' →') + '</a>' : ttl) + '</span></div>';
    }).join('');
    // «Другие выставки»: сначала те, у которых есть своя страница, потом — с фото с открытия
    var rank = function (s) { return (s.link ? 2 : 0) + (s.tag === 'photo' ? 0 : 1); };
    var others = all.filter(function (x) { return x !== ex; })
      .map(function (s, i) { return { s: s, i: i }; })
      .sort(function (a, b) { return rank(a.s) - rank(b.s) || a.i - b.i; })
      .slice(0, 3).map(function (o) { return o.s; }).map(function (s) {
      var tag = CPA.exTag(s);
      return '<a class="ex-card" href="' + esc(CPA.exLink(s)) + '"><div class="ex-card-img xb-other-img"><img src="' + esc(s.photo) + '" alt="' + esc(tx(s.venue)) + '" loading="lazy">' +
        (tag ? '<span class="sample">' + esc(tag) + '</span>' : '') + '</div>' +
        '<span class="ex-card-meta"><span>' + esc(s.date) + '</span></span><span class="ex-card-city">' + esc(tx(s.city)) + '</span><span class="ex-card-venue">' + esc(tx(s.venue)) + '</span></a>';
    }).join('');
    var heroTag = CPA.exTag(ex);

    main.innerHTML =
      '<section class="xb-hero"><img src="' + esc(ex.photo) + '" alt="' + esc(tx(ex.venue)) + '">' +
        '<div class="xb-glass">' +
          '<div class="xb-crumbs"><a href="index.html#exhibitions">' + esc(t('header.navExh')) + '</a><span>/</span><span>' + esc(tx(ex.city)) + '</span></div>' +
          '<span class="tags"><span class="tag">' + esc(kicker) + '</span>' + (heroTag && ex.tag !== 'photo' ? '<span class="tag tag-sample">' + esc(heroTag) + '</span>' : '') + '</span>' +
          '<h1 class="xb-title">' + esc(title) + '</h1>' +
          '<p class="xb-place">' + esc(tx(ex.city)) + ' · ' + esc(tx(ex.venue)) + '</p>' +
          (meta ? '<dl class="xb-meta">' + meta + '</dl>' : '') +
        '</div></section>' +

      '<section class="xb-about"><div class="wrap xb-about-inner"><h2 class="h2-sm">' + esc(t('exhibition.aboutH')) + '</h2><div class="xb-about-text">' +
        '<p class="xb-lead">' + esc(tx(ex.lead) || t('exhibition.lead')) + '</p>' +
        (tx(ex.body) ? '<p class="xb-body">' + esc(tx(ex.body)) + '</p>' : '') +
        (stats ? '<div class="xb-stats">' + stats + '</div>' : '') +
      '</div></div></section>' +

      (sections ? '<section class="xb-sections"><div class="wrap xb-sections-inner"><div class="section-head"><h2 class="h2-sm">' + esc(t('exhibition.sectH')) + '</h2><p class="section-hint">' + esc(t('exhibition.sectHint')) + '</p></div>' +
        '<span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span>' +
        '<div class="xb-sec-grid noscroll">' + sections + '</div></div></section>' : '') +

      '<section class="xb-exhibits" data-exhibits hidden></section>' +

      '<section class="xb-photos"><div class="wrap xb-photos-inner"><div class="section-head"><h2 class="h2-sm">' + esc(t('exhibition.photoH')) + '</h2><span class="xb-pos" data-shot-pos></span></div>' +
        '<div class="xb-shot" data-shot data-swipe="shot"></div>' + thumbs + '</div></section>' +

      ((partners || press) ? '<section class="xb-pp"><div class="wrap xb-pp-inner">' +
        (partners ? '<div><h2 class="xb-h3">' + esc(t('exhibition.partnersH')) + '</h2><div class="xb-partners">' + partners + '</div></div>' : '') +
        (press ? '<div><h2 class="xb-h3">' + esc(t('exhibition.pressH')) + '</h2>' + press + '</div>' : '') +
      '</div></section>' : '') +

      '<section class="xb-others"><div class="wrap xb-others-inner"><h2 class="h2-sm">' + esc(t('exhibition.otherH')) + '</h2>' +
        '<span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span>' +
        '<div class="xb-others-grid noscroll">' + others +
        '<a href="index.html#about" class="host-card xb-host" data-host-link><span class="host-body"><span class="host-title">' + esc(t('exhibitions.hostTitle')) + '</span><span class="host-text">' + esc(t('exhibitions.hostText')) + '</span></span><span class="host-btn">' + esc(t('exhibitions.host')) + '</span></a>' +
      '</div></div></section>';
    renderShot();
    renderExhibits();
    // ссылка «Провести выставку у себя» получает почту Центра
    var mail = CPA.email(t('about.vEmail'));
    $$('[data-host-link]').forEach(function (a) { a.setAttribute('href', mail ? 'mailto:' + mail + '?subject=' + encodeURIComponent(t('exhibitions.host')) : 'index.html#about'); });
  }

  function stepShot(d) { var n = gallery().length; state.shot = (state.shot + d + n) % n; renderShot(); }

  CPA.start({
    content: ['exhibitions', 'stories'],
    render: render,
    breakpoint: function () { if (ex) renderExhibits(); },
    ready: function () {
      document.addEventListener('click', function (e) {
        var st = e.target.closest('[data-shot-step]');
        if (st) { stepShot(+st.getAttribute('data-shot-step')); return; }
        var pk = e.target.closest('[data-shot-pick]');
        if (pk) { state.shot = +pk.getAttribute('data-shot-pick'); renderShot(); return; }
        if (e.target.closest('[data-xtoggle]')) {
          state.xOpen = !state.xOpen; state.xFilter = 'all'; renderExhibits();
          if (!state.xOpen) { var b = $('[data-exhibits]'); if (b) b.scrollIntoView({ block: 'start' }); }
          return;
        }
        var xf = e.target.closest('[data-xfilter]');
        if (xf) { state.xFilter = xf.getAttribute('data-xfilter'); renderExhibits(); }
      });
      // свайп по фоторепортажу: влево — следующее фото, вправо — предыдущее
      CPA.onSwipe('[data-swipe="shot"]', function (dir) { stepShot(dir); });
    }
  });
})();
