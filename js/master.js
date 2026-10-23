/* Магистерская программа (master.html). Тексты — content/master.json, надписи — content/ui.json → masterpage. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t, pad2 = CPA.pad2;
  var state = { open: 0 };

  // «Ещё о Центре»: адрес и картинка у каждой ссылки
  var TOPICS = [
    ['People', 'about.html#people', 'assets/person_zotin.jpg'],
    ['Exh', 'index.html#exhibitions', 'assets/news_dar3.jpg'],
    ['Pub', 'publications.html', 'assets/ghstamp57__b6b277a0.jpg'],
    ['News', 'news.html', 'assets/news_jhb4.jpg'],
    ['About', 'about.html', 'assets/logo_dark__fc87e939.png']
  ];

  function ext(url, text) {
    return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener" class="ms-link">' + esc(text) + ' ↗</a>' : '';
  }

  function renderMods() {
    var mods = CPA.data.master.modules || [];
    $('[data-mods]').innerHTML = mods.map(function (m, i) {
      var open = i === state.open;
      return '<div class="ms-mod"><button type="button" data-mod="' + i + '" aria-expanded="' + open + '" aria-controls="ms-mod-' + i + '">' +
          '<span class="n">' + pad2(i + 1) + '</span><span class="t">' + esc(tx(m.title)) + '</span><span class="s" aria-hidden="true">' + (open ? '−' : '+') + '</span></button>' +
        '<ul id="ms-mod-' + i + '"' + (open ? '' : ' hidden') + '>' + (m.items || []).map(function (it) { return '<li><span aria-hidden="true">—</span><span>' + esc(tx(it)) + '</span></li>'; }).join('') + '</ul></div>';
    }).join('');
  }

  function render() {
    var m = CPA.data.master;
    document.title = t('masterpage.crumb') + ' — ' + t('header.org') + ' ' + t('header.uni');
    var phone = m.phone || '';
    var tel = phone.replace(/[^\d+]/g, '');

    var facts = (m.facts || []).map(function (f) {
      return '<div class="' + (f.wide ? 'wide' : '') + '"><span class="l">' + esc(tx(f.label)) + '</span><span class="v">' + esc(tx(f.value)) + '</span></div>';
    }).join('');
    var teachers = (m.teachers || []).map(function (x) { return '<span>' + esc(tx(x)) + '</span>'; }).join('');
    var topics = TOPICS.map(function (k) {
      return '<a href="' + k[1] + '" class="ms-topic"><img src="' + k[2] + '" alt="" loading="lazy"><span class="t">' + esc(t('masterpage.top' + k[0])) + '</span><span class="a" aria-hidden="true">→</span></a>';
    }).join('');
    var steps = (m.steps || []).map(function (s, i) {
      return '<li><span class="n">' + pad2(i + 1) + '</span><div><span class="t">' + esc(tx(s.title)) + '</span><span class="d">' + esc(tx(s.text)) + '</span></div></li>';
    }).join('');
    var host = m.applyUrl ? m.applyUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';

    $('[data-master]').innerHTML =
      '<section class="ms-hero">' + (m.heroPhoto ? '<img class="ms-hero-bg" src="' + esc(m.heroPhoto) + '" alt="">' : '') +
        '<div class="wrap ms-hero-inner">' +
          '<div class="xb-crumbs"><a href="index.html">' + esc(t('common.home')) + '</a><span>/</span><span>' + esc(t('masterpage.crumb')) + '</span></div>' +
          '<span class="ms-kicker">' + esc(tx(m.kicker)) + '</span>' +
          '<h1 class="ms-h1">' + esc(tx(m.h1)) + '</h1>' +
          '<p class="ms-lead">' + esc(tx(m.lead)) + '</p>' +
          '<div class="ms-btns">' + (m.applyUrl ? '<a href="' + esc(m.applyUrl) + '" target="_blank" rel="noopener" class="btn-accent">' + esc(t('masterpage.apply')) + ' ↗</a>' : '') +
            '<a href="#study" class="ms-btn-light">' + esc(t('masterpage.studyBtn')) + '</a></div>' +
          (facts ? '<div class="ms-facts">' + facts + '</div>' : '') +
          (tx(m.heroCaption) ? '<span class="ms-cap">' + esc(tx(m.heroCaption)) + '</span>' : '') +
        '</div>' +
      '</section>' +

      '<section id="study"><div class="wrap ms-two">' +
        '<div class="ms-sticky"><span class="kicker-accent">' + esc(t('masterpage.studyK')) + '</span><h2 class="ms-h2">' + esc(t('masterpage.studyH')) + '</h2><p class="ms-muted">' + esc(tx(m.studyText)) + '</p></div>' +
        '<div class="ms-acc" data-mods></div>' +
      '</div></section>' +

      '<section class="ms-about"><div class="wrap ms-two ms-two-wide">' +
        '<div class="ms-about-l"><span class="kicker-accent">' + esc(t('masterpage.aboutK')) + '</span><p class="ms-about-lead">' + esc(tx(m.aboutLead)) + '</p>' +
          (m.aboutText || []).map(function (p) { return '<p>' + esc(tx(p)) + '</p>'; }).join('') + '</div>' +
        '<dl class="ms-dl">' +
          (teachers ? '<div><dt>' + esc(t('masterpage.teachersK')) + '</dt><dd class="ms-teachers">' + teachers + '</dd></div>' : '') +
          (tx(m.partners) ? '<div><dt>' + esc(t('masterpage.partnersK')) + '</dt><dd>' + esc(tx(m.partners)) + '</dd></div>' : '') +
          (m.careerUrl ? '<div><dt>' + esc(t('masterpage.careerK')) + '</dt><dd>' + ext(m.careerUrl, t('masterpage.career')) + '</dd></div>' : '') +
        '</dl>' +
      '</div></section>' +

      '<section class="ms-more"><div class="wrap ms-more-inner">' +
        '<span class="ab-k">' + esc(t('masterpage.moreK')) + '</span>' +
        '<nav class="ms-topics" aria-label="' + esc(t('masterpage.moreK')) + '">' + topics + '</nav>' +
      '</div></section>' +

      '<section class="ms-adm"><div class="wrap ms-two">' +
        '<div class="ms-adm-l"><span class="kicker-accent">' + esc(t('masterpage.admK')) + '</span><h2 class="ms-h2">' + esc(t('masterpage.admH')) + '</h2><p class="ms-muted">' + esc(tx(m.admText)) + '</p>' +
          ext(m.examUrl, t('masterpage.examQ')) + '</div>' +
        '<ol class="ms-steps">' + steps + '</ol>' +
      '</div></section>' +

      '<section class="ms-cta"><div class="wrap ms-cta-inner">' +
        '<h2>' + esc(t('masterpage.ctaH')) + '</h2>' +
        '<div class="ms-cta-r"><span>' + esc(t('masterpage.ctaP')) + (phone ? ' · <a href="tel:' + esc(tel) + '">' + esc(phone) + '</a>' : '') + '</span>' +
          (m.applyUrl ? '<a href="' + esc(m.applyUrl) + '" target="_blank" rel="noopener">' + esc(host) + ' ↗</a>' : '') + '</div>' +
      '</div></section>';
    renderMods();
  }

  CPA.start({
    content: ['master'],
    render: render,
    ready: function () {
      document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mod]');
        if (!b) return;
        var i = +b.getAttribute('data-mod');
        state.open = state.open === i ? -1 : i;
        renderMods();
        $('[data-mod="' + i + '"]').focus();
      });
    }
  });
})();
