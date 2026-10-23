/* Новости и анонсы (news.html, news.html?id=...). Данные — content/news.json. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var CATS = ['exh', 'sci', 'center', 'stud'];
  var state = { cat: 'all' };

  function items() {
    return (CPA.data.news.items || []).slice().sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; });
  }
  function cat(n) { return t('newspage.cat_' + n.category); }
  function href(n) { return 'news.html?id=' + encodeURIComponent(n.id); }

  // Главная новость: та, у которой в админке стоит «Главная новость», иначе самая свежая
  function topOf(list) {
    var pin = list.filter(function (n) { return n.pinned; })[0];
    return { item: pin || list[0], pinned: !!pin };
  }

  function renderList() {
    var all = items();
    var top = topOf(all);
    var rest = all.filter(function (n) { return n !== top.item; });
    var c = state.cat;
    var list = rest.filter(function (n) { return c === 'all' || n.category === c; });
    var filters = [['all', t('newspage.fAll'), rest.length]].concat(CATS.map(function (k) {
      return [k, t('newspage.f_' + k), rest.filter(function (n) { return n.category === k; }).length];
    })).map(function (f) {
      return '<button type="button" class="chip nw-chip" data-cat="' + f[0] + '" aria-pressed="' + (c === f[0]) + '">' + esc(f[1]) + ' <span class="cnt">' + f[2] + '</span></button>';
    }).join('');
    var tn = top.item;
    var topLabel = t(top.pinned ? 'newspage.pinned' : 'newspage.latest');
    var cards = list.map(function (n) {
      return '<a class="nw-card" href="' + href(n) + '"><div class="nw-card-img">' + (n.cover ? '<img src="' + esc(n.cover) + '" alt="" loading="lazy">' : '') +
        '<span class="nw-cat">' + esc(cat(n)) + '</span></div>' +
        '<span class="nw-meta">' + esc(n.date) + (tx(n.place) ? ' · ' + esc(tx(n.place)) : '') + '</span>' +
        '<h3>' + esc(tx(n.title)) + '</h3><span class="nw-lead">' + esc(tx(n.lead)) + '</span></a>';
    }).join('');
    var anons = (CPA.data.news.announcements || []).map(function (a) {
      return '<div class="nw-anon"><div class="d"><span class="day">' + esc(a.day) + '</span><span class="m">' + esc(tx(a.month)) + '</span></div>' +
        '<div class="b"><span class="t">' + esc(tx(a.title)) + '</span><span class="p">' + esc(tx(a.place)) + '</span></div></div>';
    }).join('');

    document.title = t('newspage.h1') + ' — ' + t('header.org') + ' ' + t('header.uni');
    $('[data-news]').innerHTML =
      '<section class="nw-head"><div class="wrap nw-head-inner">' +
        '<div class="nw-head-text"><div class="pp-crumbs"><a href="index.html">' + esc(t('common.home')) + '</a><span>/</span><span>' + esc(t('newspage.h1')) + '</span></div>' +
          '<h1 class="pp-h1">' + esc(t('newspage.h1')) + '</h1></div>' +
        '<div class="nw-filters noscroll" role="group" aria-label="' + esc(t('newspage.rubrics')) + '">' + filters + '</div>' +
      '</div></section>' +
      (tn ? '<section class="nw-top"><div class="wrap nw-top-inner">' +
        '<a class="nw-feat" href="' + href(tn) + '">' + (tn.hero ? '<img src="' + esc(tn.hero) + '" alt="">' : '') +
          '<div class="nw-feat-glass"><div class="nw-feat-meta"><span class="lbl">' + esc(topLabel) + '</span><span>' + esc(cat(tn)) + '</span><span class="dt">' + esc(tn.date) + '</span></div>' +
            '<span class="nw-feat-title">' + esc(tx(tn.title)) + '</span><span class="nw-feat-lead">' + esc(tx(tn.lead)) + '</span>' +
            '<span class="nw-read">' + esc(t('newspage.read')) + ' →</span></div></a>' +
      '</div></section>' : '') +
      '<section><div class="wrap nw-main">' +
        '<div class="nw-grid">' + cards + '</div>' +
        '<aside class="nw-aside">' +
          '<div class="nw-anons"><span class="k">' + esc(t('newspage.anonsK')) + '</span>' + anons + '<span class="note">' + esc(t('newspage.anonsNote')) + '</span></div>' +
          '<a href="index.html#exhibitions" class="pp-add"><span class="pp-add-title">' + esc(t('newspage.hostT')) + '</span><span class="pp-add-text">' + esc(t('newspage.hostP')) + '</span><span class="pp-add-cta">' + esc(t('newspage.hostCta')) + ' →</span></a>' +
        '</aside>' +
      '</div></section>';
  }

  function renderArticle(n) {
    document.title = tx(n.title) + ' — ' + t('newspage.h1');
    var body = (n.body || []).map(function (p) { return tx(p); }).filter(Boolean).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var gal = (n.gallery || []);
    // пометка «перевод с русского» — только не на русском
    var tr = CPA.state.lang === 'ru' ? '' : t('newspage.trNote').replace(/^[\s·]+/, '');
    var credit = [tx(n.credit), tr].filter(Boolean).join(' · ');
    $('[data-news]').innerHTML =
      '<article class="nw-art">' +
        '<div class="wrap nw-art-top"><a href="news.html" class="nw-back">← ' + esc(t('newspage.back')) + '</a></div>' +
        '<div class="wrap nw-art-head"><span class="nw-meta">' + esc(n.date) + (tx(n.place) ? ' · ' + esc(tx(n.place)) : '') + ' · ' + esc(cat(n)) + '</span>' +
          '<h1>' + esc(tx(n.title)) + '</h1></div>' +
        (n.hero ? '<div class="wrap nw-art-hero"><img src="' + esc(n.hero) + '" alt=""></div>' : '') +
        '<div class="wrap nw-art-body">' + body + (credit ? '<span class="nw-credit">' + esc(credit) + '</span>' : '') + '</div>' +
        (gal.length ? '<div class="wrap nw-gal-wrap"><div class="nw-gal-head"><span class="k">' + esc(t('newspage.photoK')) + ' · ' + gal.length + '</span>' +
          '<span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span></div>' +
          '<div class="nw-gal noscroll">' + gal.map(function (g) { return '<img src="' + esc(g) + '" alt="" loading="lazy">'; }).join('') + '</div></div>' : '') +
        '<div class="wrap nw-art-foot"><a href="news.html" class="nw-back">← ' + esc(t('newspage.back')) + '</a>' +
          (n.source ? '<a href="' + esc(n.source) + '" target="_blank" rel="noopener" class="nw-src">' + esc(t('newspage.source')) + ' ↗</a>' : '') + '</div>' +
      '</article>';
  }

  function render() {
    var id = CPA.param('id');
    if (!id) { renderList(); return; }
    var n = items().filter(function (x) { return x.id === id; })[0];
    if (n) { renderArticle(n); return; }
    document.title = t('newspage.notFound');
    $('[data-news]').innerHTML = '<section class="wrap notfound"><h1 class="h2">' + esc(t('newspage.notFound')) + '</h1><a class="btn-dark" href="news.html">' + esc(t('newspage.h1')) + ' →</a></section>';
  }

  CPA.start({
    content: ['news'],
    render: render,
    ready: function () {
      document.addEventListener('click', function (e) {
        var c = e.target.closest('[data-cat]');
        if (c) { state.cat = c.getAttribute('data-cat'); renderList(); var b = $('[data-cat="' + state.cat + '"]'); if (b) b.focus(); }
      });
    }
  });
})();
