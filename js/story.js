/* Страница сюжета (story.html?id=...). Данные — content/stories.json, подписи интерфейса — content/ui.json → story. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var state = { filter: 'all', open: -1 };
  var story = null;

  var X_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var PREV_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var NEXT_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  function kindLabel(type) { return t({ photo: 'story.kPhoto', doc: 'story.kDoc', press: 'story.kPress' }[type] || 'story.kPhoto'); }
  function codeLabel(code) {
    if (!code) return t('story.ref');
    if (code === 'MODERN') return t('story.modern');
    return code + ' ' + t('story.sample');
  }
  function bw(color) { return color ? '' : ' bw'; }

  function renderViewer() {
    var items = story.items || [];
    var o = state.open;
    if (o < 0 || !items.length) return '';
    var it = items[Math.min(o, items.length - 1)];
    var pic = it.src
      ? '<img class="viewer-bg" src="' + esc(it.src) + '" alt="" aria-hidden="true"><img class="viewer-img' + bw(it.color) + '" src="' + esc(it.src) + '" alt="' + esc(tx(it.title)) + '">'
      : '<span class="scan-ph">' + esc(t('story.scan')) + '</span>';
    return '<div id="viewer" class="viewer" role="region" aria-label="' + esc(t('story.viewer')) + '">' +
      '<div class="viewer-stage" data-swipe="viewer">' + pic + '</div>' +
      '<div class="viewer-side">' +
        '<div class="viewer-top"><span class="viewer-kind">' + esc(kindLabel(it.type)) + ' · ' + (o + 1) + ' / ' + items.length + '</span>' +
          '<button type="button" class="icon-btn" data-close aria-label="' + esc(t('story.close')) + '">' + X_ICON + '</button></div>' +
        '<span class="viewer-title">' + esc(tx(it.title)) + '</span>' +
        '<dl class="viewer-meta">' +
          '<dt>' + esc(t('story.lbDate')) + '</dt><dd>' + esc(tx(it.date)) + '</dd>' +
          '<dt>' + esc(t('story.lbCode')) + '</dt><dd>' + esc(codeLabel(it.code)) + '</dd>' +
          '<dt>' + esc(t('story.lbSrc')) + '</dt><dd>' + esc(tx(it.credit)) + '</dd>' +
        '</dl>' +
        '<div class="viewer-nav">' +
          '<button type="button" class="btn-line-light" data-step="-1">' + PREV_ICON + esc(t('story.prev')) + '</button>' +
          '<button type="button" class="btn-fill-light" data-step="1">' + esc(t('story.next')) + NEXT_ICON + '</button>' +
        '</div>' +
      '</div></div>';
  }

  function renderMaterials() {
    var items = story.items || [];
    var f = state.filter;
    var filters = [['all', 'story.fAll'], ['photo', 'story.fPhoto'], ['doc', 'story.fDoc'], ['press', 'story.fPress']].map(function (d) {
      var n = d[0] === 'all' ? items.length : items.filter(function (it) { return it.type === d[0]; }).length;
      return '<button type="button" role="tab" class="chip" data-filter="' + d[0] + '" aria-selected="' + (f === d[0]) + '">' + esc(t(d[1])) + ' · ' + n + '</button>';
    }).join('');
    var cards = items.map(function (it, i) {
      if (f !== 'all' && it.type !== f) return '';
      return '<button type="button" class="mat" data-open="' + i + '">' +
        '<div class="mat-img">' +
          (it.src ? '<img src="' + esc(it.src) + '" alt="' + esc(tx(it.title)) + '" loading="lazy" class="' + bw(it.color).trim() + '">' : '<span class="scan-ph">' + esc(t('story.scan')) + '</span>') +
          '<span class="mat-kind">' + esc(kindLabel(it.type)) + '</span>' +
        '</div>' +
        '<div class="mat-meta"><span>' + esc(codeLabel(it.code)) + '</span><span>' + esc(tx(it.date)) + '</span></div>' +
        '<span class="mat-title">' + esc(tx(it.title)) + '</span></button>';
    }).join('');
    $('[data-materials]').innerHTML =
      '<div class="section-head"><h2 class="h2-sm">' + esc(t('story.matTitle')) + '</h2>' +
      '<div class="chips" role="tablist" aria-label="' + esc(t('story.filterLabel')) + '">' + filters + '</div></div>' +
      renderViewer() +
      '<div class="mat-grid">' + cards + '</div>';
  }

  function render() {
    var all = CPA.data.stories.items || [];
    var id = CPA.param('id');
    story = all.filter(function (s) { return s.id === id; })[0] || (id ? null : all[0]);
    var main = $('[data-story]');
    if (!story) {
      document.title = t('story.notFound');
      main.innerHTML = '<section class="wrap notfound"><h1 class="h2">' + esc(t('story.notFound')) + '</h1><a class="btn-dark" href="index.html#timeline">' + esc(t('header.navChron')) + ' →</a></section>';
      return;
    }
    var s = story;
    var items = s.items || [];
    var fig = items[s.figure ? s.figure.item : 0] || {};
    document.title = tx(s.title) + ' — ' + t('hero.h1a') + ' ' + t('hero.h1b');

    var passport = (s.passport || []).map(function (r) { return '<dt>' + esc(tx(r.label)) + '</dt><dd>' + esc(tx(r.value)) + '</dd>'; }).join('');
    var tags = (s.tags || []).map(function (g) { return '<a href="#materials" class="tag-line">' + esc(tx(g)) + '</a>'; }).join('');
    var paras = function (list) { return (list || []).map(function (p) { return '<p>' + esc(tx(p)) + '</p>'; }).join(''); };
    var steps = (s.steps || []).map(function (st) {
      return '<li><span class="step-y">' + esc(st.year) + '</span><span class="step-d">' + esc(tx(st.date)) + '</span><span class="step-t">' + esc(tx(st.text)) + '</span></li>';
    }).join('');
    var optics = (s.optics && s.optics.columns || []).map(function (c) {
      return '<div class="optic"><span class="optic-label">' + esc(tx(c.label)) + '</span><div class="optic-scan">' + esc(tx(c.scan)) + '</div><p>' + esc(tx(c.text)) + '</p></div>';
    }).join('');
    var related = all.filter(function (r) { return r.id !== s.id; }).map(function (r) {
      return '<a class="rel-card" href="story.html?id=' + encodeURIComponent(r.id) + '"><img src="' + esc(r.card) + '" alt="' + esc(tx(r.title)) + '" loading="lazy">' +
        '<div class="rel-glass"><span class="rel-meta">' + esc(tx(r.meta)) + '</span><span class="rel-title">' + esc(tx(r.title)) + '</span></div></a>';
    }).join('');
    var hero = s.hero || {};
    var heroFilter = hero.color ? 'grayscale(0.3)' : 'grayscale(1)';

    $('[data-story]').innerHTML =
      '<section class="st-hero">' +
        '<img src="' + esc(hero.src) + '" alt="' + esc(tx(s.heroAlt)) + '" style="object-position: ' + esc(hero.position || 'center') + '; filter: ' + heroFilter + '">' +
        '<div class="st-hero-inner">' +
          '<div class="st-glass">' +
            '<nav class="crumbs" aria-label="' + esc(t('common.breadcrumb')) + '"><a href="index.html">' + esc(t('common.home')) + '</a><span aria-hidden="true">/</span>' +
              '<a href="index.html#timeline">' + esc(t('header.navChron')) + '</a><span aria-hidden="true">/</span><span>' + esc(t('story.story')) + '</span></nav>' +
            '<span class="st-kicker">' + esc(tx(s.kicker)) + '</span>' +
            '<h1 class="st-title">' + esc(tx(s.title)) + '</h1>' +
            '<p class="st-lead">' + esc(tx(s.lead)) + '</p>' +
            '<div class="st-stats"><span>' + items.length + ' ' + esc(t('story.items')) + '</span><span>' + esc(t('story.read').replace('{n}', s.minutes || 5)) + '</span><span>' + esc(t('story.updated')) + '</span></div>' +
          '</div>' +
          '<span class="st-credit">' + esc(tx(s.heroCredit)) + '</span>' +
        '</div>' +
      '</section>' +

      '<section class="wrap st-body">' +
        '<aside class="passport">' +
          '<div class="passport-head">' + esc(t('story.passport')) + '</div>' +
          '<dl>' + passport + '<dt>' + esc(t('story.topics')) + '</dt><dd class="tags-dd">' + tags + '</dd></dl>' +
          '<div class="passport-actions"><a href="#materials" class="btn-dark btn-block">' + esc(t('story.seeMat')) + ' · ' + items.length + '</a>' +
          '<a href="#materials" class="btn-outline btn-block">' + esc(t('story.download')) + '</a></div>' +
        '</aside>' +
        '<article class="st-article">' +
          '<p class="st-intro">' + esc(tx(s.intro)) + '</p>' +
          paras(s.before) +
          '<figure class="st-fig">' +
            '<button type="button" class="st-fig-btn" data-open="' + (s.figure ? s.figure.item : 0) + '" aria-label="' + esc(t('story.zoom')) + '"><img src="' + esc(fig.src) + '" alt="' + esc(tx(s.figure && s.figure.caption)) + '"></button>' +
            '<figcaption><span>' + esc(tx(s.figure && s.figure.caption)) + '</span><span>' + esc(tx(s.figure && s.figure.credit)) + '</span></figcaption>' +
          '</figure>' +
          paras(s.after) +
          '<blockquote class="st-quote"><p>' + esc(tx(s.quote)) + '</p><footer>' + esc(tx(s.quoteBy)) + '</footer></blockquote>' +
          '<p class="st-closing">' + esc(tx(s.closing)) + '</p>' +
        '</article>' +
      '</section>' +

      '<section class="st-steps-sec"><div class="wrap st-steps-inner"><h2 class="h2-sm">' + esc(t('story.timeline')) + '</h2><ol class="st-steps">' + steps + '</ol></div></section>' +

      '<section id="materials" class="wrap st-materials" data-materials></section>' +

      '<section class="st-optics-sec"><div class="wrap st-optics-inner">' +
        '<div class="section-head"><h2 class="h2-sm">' + esc(t('story.optics')) + '</h2><p class="section-hint">' + esc(tx(s.optics && s.optics.intro)) + '</p></div>' +
        '<div class="optics">' + optics + '</div></div></section>' +

      '<section class="st-related-sec"><div class="wrap st-related-inner"><h2 class="h2-sm">' + esc(t('story.other')) + '</h2><span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span><div class="rel-grid noscroll">' + related + '</div></div></section>';
    renderMaterials();
  }

  function openItem(i) {
    state.open = i;
    renderMaterials();
    var v = document.getElementById('viewer');
    if (v) {
      v.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      var c = v.querySelector('[data-close]');
      if (c) c.focus({ preventScroll: true });
    }
  }

  CPA.start({
    content: ['stories'],
    render: render,
    ready: function () {
      // ссылка из раздела «Экспонаты» на странице выставки: story.html?id=africa&open=CPA-CD-001 — сразу открыть этот материал
      var openCode = CPA.param('open');
      if (openCode) {
        var st = (CPA.data.stories.items || []).filter(function (s) { return s.id === CPA.param('id'); })[0];
        var idx = st ? (st.items || []).map(function (it) { return it.code; }).indexOf(openCode) : -1;
        if (idx >= 0) state.open = idx;
      }
      // свайп по просмотрщику материалов: влево — следующий, вправо — предыдущий
      CPA.onSwipe('[data-swipe="viewer"]', function (dir) {
        if (state.open < 0 || !story) return;
        var n = story.items.length;
        state.open = (state.open + dir + n) % n;
        renderMaterials();
      });
      document.addEventListener('click', function (e) {
        var el = e.target;
        var f = el.closest('[data-filter]');
        if (f) { state.filter = f.getAttribute('data-filter'); renderMaterials(); return; }
        var o = el.closest('[data-open]');
        if (o) { openItem(+o.getAttribute('data-open')); return; }
        if (el.closest('[data-close]')) {
          var last = state.open;
          state.open = -1; renderMaterials();
          var back = document.querySelector('[data-open="' + last + '"].mat');
          if (back) back.focus();
          return;
        }
        var st = el.closest('[data-step]');
        if (st) {
          var n = story.items.length;
          state.open = (state.open + (+st.getAttribute('data-step')) + n) % n;
          renderMaterials();
          var again = document.querySelector('[data-step="' + st.getAttribute('data-step') + '"]');
          if (again) again.focus();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (state.open < 0 || !story) return;
        if (e.key === 'Escape') { state.open = -1; renderMaterials(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          if (e.target.closest('input, textarea')) return;
          var n = story.items.length;
          state.open = (state.open + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
          renderMaterials();
        }
      });
    }
  });
})();
