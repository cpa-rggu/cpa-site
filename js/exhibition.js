/* Страница выставки (exhibition.html?id=dar). Данные — content/exhibitions.json, сюжеты-разделы — content/stories.json. */
(function () {
  'use strict';

  var $ = CPA.$, $$ = CPA.$$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var state = { shot: 0 };
  var ex = null, isNow = false;

  function gallery() {
    var g = (ex.gallery || []).filter(function (s) { return s.src; });
    return g.length ? g : [{ src: ex.photo, caption: ex.venue, credit: '' }];
  }

  function renderShot() {
    var g = gallery();
    var s = g[state.shot] || g[0];
    var box = $('[data-shot]');
    if (!box) return;
    var cap = tx(s.caption) + (s.credit ? ' · ' + s.credit : '');
    box.innerHTML =
      '<img class="xb-shot-bg" src="' + esc(s.src) + '" alt="" aria-hidden="true">' +
      '<figure class="xb-shot-fig"><img src="' + esc(s.src) + '" alt="' + esc(tx(s.caption)) + '"><figcaption>' + esc(cap) + '</figcaption></figure>' +
      (g.length > 1 ? '<button type="button" class="xb-arrow left" data-shot-step="-1" aria-label="' + esc(t('exhibition.prev')) + '">←</button>' +
        '<button type="button" class="xb-arrow right" data-shot-step="1" aria-label="' + esc(t('exhibition.next')) + '">→</button>' : '');
    $('[data-shot-pos]').textContent = (state.shot + 1) + ' / ' + g.length;
    $$('[data-shot-pick]').forEach(function (b, i) { b.setAttribute('aria-selected', i === state.shot); });
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
    var title = t('hero.h1a') + ' ' + t('hero.h1b');
    document.title = CPA.cap(t('exhibition.word')) + ': ' + tx(ex.city) + ' — ' + title;

    var meta = [[t('exhibition.lDates'), ex.date], [t('exhibition.lPlace'), tx(ex.address)], [t('exhibition.lHours'), tx(ex.hours)], [t('exhibition.lEntry'), tx(ex.entry)]]
      .filter(function (m) { return m[1]; })
      .map(function (m) { return '<div><dt>' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>'; }).join('');
    var stats = (ex.stats || []).map(function (s) { return '<div><span class="xb-stat-n">' + esc(s.value) + '</span><span class="xb-stat-l">' + esc(tx(s.label)) + '</span></div>'; }).join('');
    var stories = CPA.data.stories.items || [];
    var sections = (ex.sections || []).map(function (s, i) {
      var st = stories.filter(function (x) { return x.id === s.story; })[0];
      if (!st) return '';
      return '<a class="xb-sec" href="story.html?id=' + encodeURIComponent(st.id) + '"><img src="' + esc(s.photo || st.card) + '" alt="" loading="lazy">' +
        '<div class="xb-sec-glass"><span class="xb-sec-meta">' + esc(t('exhibition.hall')) + ' ' + CPA.pad2(i + 1) + ' · ' + esc(s.years) + '</span>' +
        '<span class="xb-sec-title">' + esc(tx(st.title)) + '</span><span class="xb-sec-open">' + esc(t('exhibition.open')) + ' →</span></div></a>';
    }).join('');
    var g = gallery();
    if (state.shot >= g.length) state.shot = 0;
    var thumbs = g.length > 1 ? '<div class="xb-thumbs" role="tablist" aria-label="' + esc(t('exhibition.photoH')) + '">' + g.map(function (s, i) {
      return '<button type="button" role="tab" data-shot-pick="' + i + '" aria-label="' + esc(tx(s.caption)) + '"><img src="' + esc(s.src) + '" alt=""></button>';
    }).join('') + '</div>' : '';
    var partners = (ex.partners || []).map(function (p) {
      return '<div class="xb-partner">' + (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(tx(p.name)) + '">' : esc(tx(p.name))) + '</div>';
    }).join('');
    var press = (ex.press || []).map(function (p) {
      var title = esc(tx(p.title));
      return '<div class="xb-press"><span class="src">' + esc(tx(p.source)) + '</span><span class="ttl">' + (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + title + ' ↗</a>' : title) + '</span></div>';
    }).join('');
    var others = all.filter(function (x) { return x !== ex; }).slice(0, 3).map(function (s) {
      return '<a class="ex-card" href="exhibition.html?id=' + encodeURIComponent(s.id) + '"><div class="ex-card-img xb-other-img"><img src="' + esc(s.photo) + '" alt="' + esc(tx(s.venue)) + '" loading="lazy">' +
        (s.sample ? '<span class="sample">' + esc(t('exhibitions.sample')) + '</span>' : '') + '</div>' +
        '<span class="ex-card-meta"><span>' + esc(s.date) + '</span></span><span class="ex-card-city">' + esc(tx(s.city)) + '</span><span class="ex-card-venue">' + esc(tx(s.venue)) + '</span></a>';
    }).join('');

    main.innerHTML =
      '<section class="xb-hero"><img src="' + esc(ex.photo) + '" alt="' + esc(tx(ex.venue)) + '">' +
        '<div class="xb-glass">' +
          '<div class="xb-crumbs"><a href="index.html#exhibitions">' + esc(t('header.navExh')) + '</a><span>/</span><span>' + esc(tx(ex.city)) + '</span></div>' +
          '<span class="tags"><span class="tag">' + esc(t('exhibition.word') + (isNow ? ' · ' + t('exhibition.now') : '')) + '</span>' + (ex.sample ? '<span class="tag tag-sample">' + esc(t('exhibitions.sample')) + '</span>' : '') + '</span>' +
          '<h1 class="xb-title">' + esc(title) + '</h1>' +
          '<p class="xb-place">' + esc(tx(ex.city)) + ' · ' + esc(tx(ex.venue)) + '</p>' +
          (meta ? '<dl class="xb-meta">' + meta + '</dl>' : '') +
        '</div></section>' +

      '<section class="xb-about"><div class="wrap xb-about-inner"><h2 class="h2-sm">' + esc(t('exhibition.aboutH')) + '</h2><div class="xb-about-text">' +
        '<p class="xb-lead">' + esc(t('exhibition.lead')) + '</p>' +
        (tx(ex.body) ? '<p class="xb-body">' + esc(tx(ex.body)) + '</p>' : '') +
        (stats ? '<div class="xb-stats">' + stats + '</div>' : '') +
      '</div></div></section>' +

      (sections ? '<section class="xb-sections"><div class="wrap xb-sections-inner"><div class="section-head"><h2 class="h2-sm">' + esc(t('exhibition.sectH')) + '</h2><p class="section-hint">' + esc(t('exhibition.sectHint')) + '</p></div>' +
        '<div class="xb-sec-grid">' + sections + '</div></div></section>' : '') +

      '<section class="xb-photos"><div class="wrap xb-photos-inner"><div class="section-head"><h2 class="h2-sm">' + esc(t('exhibition.photoH')) + '</h2><span class="xb-pos" data-shot-pos></span></div>' +
        '<div class="xb-shot" data-shot></div>' + thumbs + '</div></section>' +

      ((partners || press) ? '<section class="xb-pp"><div class="wrap xb-pp-inner">' +
        (partners ? '<div><h2 class="xb-h3">' + esc(t('exhibition.partnersH')) + '</h2><div class="xb-partners">' + partners + '</div></div>' : '') +
        (press ? '<div><h2 class="xb-h3">' + esc(t('exhibition.pressH')) + '</h2>' + press + '</div>' : '') +
      '</div></section>' : '') +

      '<section class="xb-others"><div class="wrap xb-others-inner"><h2 class="h2-sm">' + esc(t('exhibition.otherH')) + '</h2><div class="xb-others-grid">' + others +
        '<a href="index.html#about" class="host-card xb-host" data-host-link><span class="host-body"><span class="host-title">' + esc(t('exhibitions.hostTitle')) + '</span><span class="host-text">' + esc(t('exhibitions.hostText')) + '</span></span><span class="host-btn">' + esc(t('exhibitions.host')) + '</span></a>' +
      '</div></div></section>';
    renderShot();
    // ссылка «Провести выставку у себя» получает почту Центра
    var mail = CPA.email(t('about.vEmail'));
    $$('[data-host-link]').forEach(function (a) { a.setAttribute('href', mail ? 'mailto:' + mail + '?subject=' + encodeURIComponent(t('exhibitions.host')) : 'index.html#about'); });
  }

  CPA.start({
    content: ['exhibitions', 'stories'],
    render: render,
    ready: function () {
      document.addEventListener('click', function (e) {
        var st = e.target.closest('[data-shot-step]');
        if (st) { var n = gallery().length; state.shot = (state.shot + (+st.getAttribute('data-shot-step')) + n) % n; renderShot(); return; }
        var pk = e.target.closest('[data-shot-pick]');
        if (pk) { state.shot = +pk.getAttribute('data-shot-pick'); renderShot(); }
      });
    }
  });
})();
