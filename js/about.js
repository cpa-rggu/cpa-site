/* Страница «О Центре» (about.html). Тексты — content/about.json, контакты — content/ui.json → about. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t, pad2 = CPA.pad2;
  var state = { dir: 0 };

  function renderDirs() {
    var a = CPA.data.about;
    var dirs = a.directions || [];
    var cur = dirs[state.dir] || dirs[0];
    var box = $('[data-dirs]');
    if (!box || !cur) return;
    $('[data-dir-tabs]').innerHTML = dirs.map(function (d, i) {
      return '<button type="button" role="tab" class="ab-dir-tab" data-dir="' + i + '" aria-selected="' + (i === state.dir) + '" tabindex="' + (i === state.dir ? 0 : -1) + '">' +
        '<span class="n">' + pad2(i + 1) + '</span><span>' + esc(tx(d.title)) + '</span></button>';
    }).join('');
    box.innerHTML =
      '<span class="ab-dir-big">' + pad2(state.dir + 1) + '</span>' +
      '<h3 class="ab-dir-title">' + esc(tx(cur.title)) + '</h3>' +
      '<ul class="ab-dir-list">' + (cur.items || []).map(function (it) { return '<li><span aria-hidden="true">—</span><span>' + esc(tx(it)) + '</span></li>'; }).join('') + '</ul>' +
      '<a href="publications.html" class="ab-dir-link">' + esc(t('aboutpage.pubLink')) + ' →</a>';
  }

  function render() {
    var a = CPA.data.about;
    document.title = t('aboutpage.crumb') + ' — ' + t('header.org') + ' ' + t('header.uni');
    var band = (t('header.org') + ' ' + t('header.uni')).toUpperCase();
    var mail = CPA.email(t('about.vEmail'));
    var phone = t('about.vPhone');
    var tel = phone.replace(/[^\d+]/g, '').replace(/^8/, '+7');

    var facts = (a.facts || []).map(function (f) { return '<div><span class="n">' + esc(f.value) + '</span><span class="l">' + esc(tx(f.label)) + '</span></div>'; }).join('');
    var acts = (a.activities || []).map(function (x, i) {
      return '<div class="ab-act">' + (x.photo ? '<img src="' + esc(x.photo) + '" alt="" loading="lazy">' : '') +
        '<div class="ab-act-body"><span class="n">' + pad2(i + 1) + '</span><span class="t">' + esc(tx(x.title)) + '</span><span class="d">' + esc(tx(x.text)) + '</span></div></div>';
    }).join('');
    var leads = (a.leads || []).map(function (p) {
      return '<article class="ab-lead">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="' + esc(tx(p.name)) + '" loading="lazy">' : '') +
        '<div class="ab-lead-body"><span class="tag-k">' + esc(tx(p.tag)) + '</span><h3>' + esc(tx(p.name)) + '</h3>' +
        '<span class="role">' + esc(tx(p.role)) + '</span><span class="deg">' + esc(tx(p.degree)) + '</span><span class="bio">' + esc(tx(p.bio)) + '</span></div></article>';
    }).join('');
    var experts = (a.experts || []).map(function (e) {
      return '<div class="ab-exp"><span class="ab-ini" aria-hidden="true">' + esc(tx(e.initials)) + '</span>' +
        '<span class="name">' + esc(tx(e.name)) + '</span><span class="role">' + esc(tx(e.role)) + '</span>' +
        (e.link ? '<a href="' + esc(e.link) + '">' + esc(tx(e.linkText)) + ' →</a>' : '<span></span>') + '</div>';
    }).join('');
    var miles = (a.milestones || []).map(function (m, i, arr) {
      return '<li' + (i === arr.length - 1 ? ' class="last"' : '') + '><span class="dot" aria-hidden="true"></span><span class="d">' + esc(tx(m.date)) + '</span>' +
        '<span class="t">' + esc(tx(m.title)) + '</span><span class="p">' + esc(tx(m.place)) + '</span></li>';
    }).join('');
    var docUrl = t('about.docUrl');

    $('[data-about]').innerHTML =
      '<section class="ab-hero">' + (a.heroPhoto ? '<img class="ab-hero-bg" src="' + esc(a.heroPhoto) + '" alt="">' : '') +
        '<div class="wrap ab-hero-inner">' +
          '<div class="ab-glass">' +
            '<div class="xb-crumbs"><a href="index.html">' + esc(t('common.home')) + '</a><span>/</span><span>' + esc(t('aboutpage.crumb')) + '</span></div>' +
            '<h1 class="ab-h1">' + esc(tx(a.h1)) + '</h1>' +
            '<p class="ab-lead-p">' + esc(tx(a.lead)) + '</p>' +
            '<div class="ab-btns"><a href="#people" class="btn-accent">' + esc(t('aboutpage.btnPeople')) + '</a><a href="#directions" class="btn-outline">' + esc(t('aboutpage.btnDirs')) + '</a></div>' +
          '</div>' +
          (facts ? '<div class="ab-facts">' + facts + '</div>' : '') +
        '</div>' +
        (tx(a.photoCaption) ? '<span class="ab-photocap">' + esc(tx(a.photoCaption)) + '</span>' : '') +
      '</section>' +

      '<section class="ab-mission"><div class="wrap ab-mission-inner">' +
        '<div class="ab-mission-l"><span class="kicker-accent">' + esc(t('aboutpage.missionK')) + '</span><p class="ab-mission-t">' + esc(tx(a.mission)) + '</p></div>' +
        '<div class="ab-mission-r">' + (a.missionText || []).map(function (p) { return '<p>' + esc(tx(p)) + '</p>'; }).join('') +
          '<a href="index.html#exhibitions" class="ab-accent-link">' + esc(t('aboutpage.seeExh')) + ' →</a></div>' +
      '</div></section>' +

      '<section><div class="wrap ab-who">' +
        '<div class="section-head"><h2 class="h2-sm">' + esc(t('aboutpage.whoH')) + '</h2><span class="ab-k">' + esc(t('aboutpage.whoK')) + '</span></div>' +
        '<div class="ab-acts">' + acts + '</div>' +
      '</div></section>' +

      '<section id="directions" class="ab-dirs-sec"><div class="wrap ab-dirs-inner">' +
        '<div class="ab-dirs-l"><span class="ab-k-dark">' + esc(t('aboutpage.dirsK')) + '</span><h2 class="h2-sm">' + esc(t('aboutpage.dirsH')) + '</h2>' +
          '<div class="ab-dir-tabs" role="tablist" aria-label="' + esc(t('aboutpage.dirsK')) + '" data-dir-tabs></div></div>' +
        '<div class="ab-dir-panel" role="tabpanel" data-dirs></div>' +
      '</div></section>' +

      '<section id="people" class="ab-people"><div class="wrap ab-people-inner">' +
        '<h2 class="ab-people-h">' + esc(t('aboutpage.peopleH')) + '</h2>' +
        '<div class="ab-leads">' + leads + '</div>' +
        (experts ? '<div class="ab-exps"><span class="ab-k">' + esc(t('aboutpage.expertsK')) + '</span>' + experts + '<div class="ab-exps-end"></div></div>' : '') +
      '</div></section>' +

      '<section><div class="wrap ab-miles-inner">' +
        '<h2 class="h2-sm">' + esc(t('aboutpage.milesH')) + '</h2>' +
        '<span class="swipe-hint">' + esc(t('common.swipe')) + ' →</span>' +
        '<ol class="ab-miles noscroll">' + miles + '</ol>' +
      '</div></section>' +

      '<section class="ab-contacts"><div class="wrap ab-contacts-inner">' +
        '<figure class="about-logo"><img src="assets/logo_dark__fc87e939.png" alt="' + esc(band) + '"><figcaption>' + esc(band) + '</figcaption></figure>' +
        '<div class="ab-contacts-r"><h2 class="h2-sm">' + esc(t('aboutpage.contactsH')) + '</h2>' +
          '<div class="contacts">' +
            '<div class="contact"><span class="label">' + esc(t('aboutpage.cAddr')) + '</span><span>' + esc(t('about.vAddr')) + '</span></div>' +
            '<div class="contact"><span class="label">' + esc(t('aboutpage.cPhone')) + '</span>' + (tel.length > 7 ? '<a href="tel:' + esc(tel) + '">' + esc(phone) + '</a>' : '<span>' + esc(phone) + '</span>') + '</div>' +
            '<div class="contact"><span class="label">' + esc(t('aboutpage.cMail')) + '</span>' + (mail ? '<a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : '<span>' + esc(t('about.vEmail')) + '</span>') + '</div>' +
            (t('about.vDirector') ? '<div class="contact"><span class="label">' + esc(t('aboutpage.cDir')) + '</span><span>' + esc(t('about.vDirector')) + '</span></div>' : '') +
            (docUrl ? '<div class="contact"><span class="label">' + esc(t('aboutpage.cDoc')) + '</span><a href="' + esc(docUrl) + '" target="_blank" rel="noopener">' + esc(t('about.vDoc')) + ' ↗</a></div>' : '') +
            (a.pageUrl ? '<div class="contact"><span class="label">' + esc(t('aboutpage.cPage')) + '</span><a href="' + esc(a.pageUrl) + '" target="_blank" rel="noopener">' + esc(a.pageUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/about\.php$/, '')) + ' ↗</a></div>' : '') +
          '</div></div>' +
      '</div></section>';
    renderDirs();
  }

  CPA.start({
    content: ['about'],
    render: render,
    ready: function () {
      document.addEventListener('click', function (e) {
        var d = e.target.closest('[data-dir]');
        if (d) { state.dir = +d.getAttribute('data-dir'); renderDirs(); var b = $('[data-dir="' + state.dir + '"]'); if (b) b.focus(); }
      });
      document.addEventListener('keydown', function (e) {
        if (!e.target.closest('[data-dir]') || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
        e.preventDefault();
        var n = (CPA.data.about.directions || []).length;
        state.dir = (state.dir + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        renderDirs();
        $('[data-dir="' + state.dir + '"]').focus();
      });
    }
  });
})();
