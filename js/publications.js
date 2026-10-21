/* Страница публикаций. Данные — content/publications.json и content/authors.json. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var state = { region: 'all', open: null };
  var DL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';

  function pubs() { return CPA.data.publications.items || []; }
  function authorOf(p) { return (CPA.data.authors.items || []).filter(function (a) { return a.id === p.authorId; })[0]; }
  // Название и журнал: на русском — русский вариант, на остальных языках — авторский английский
  function ru() { return CPA.state.lang === 'ru'; }
  function pick(v) { return v ? (ru() ? (v.ru || v.en) : (v.en || v.ru)) || '' : ''; }

  function citation(p) {
    var a = authorOf(p);
    var name = a ? pick(a.cite) : pick(p.author);
    var doi = p.doi ? '. DOI: ' + p.doi : '';
    return ru()
      ? name + ' ' + (p.title.ru || p.title.en) + ' // ' + (p.journal.ru || p.journal.en) + '. ' + p.issue + (p.pages ? '. С. ' + p.pages : '') + doi
      : name + ' ' + (p.title.en || p.title.ru) + '. ' + (p.journal.en || p.journal.ru) + ', ' + String(p.issue).replace('№', 'no.') + (p.pages ? ', pp. ' + p.pages : '') + doi;
  }

  function renderStats() {
    var list = pubs();
    var authors = {}, journals = {};
    list.forEach(function (p) { authors[p.authorId || pick(p.author)] = 1; journals[(p.journal && (p.journal.ru || p.journal.en)) || ''] = 1; });
    var nA = Object.keys(authors).length, nJ = Object.keys(journals).filter(Boolean).length;
    $('[data-stats]').innerHTML = [[list.length, 'pubpage.stPubs'], [nA, 'pubpage.stAuthors'], [nJ, 'pubpage.stJournals']].map(function (s) {
      return '<div><span class="pp-stat-n">' + s[0] + '</span><span class="pp-stat-l">' + esc(t(s[1])) + '</span></div>';
    }).join('');
  }

  function renderFilters() {
    var list = pubs();
    $('[data-filters]').innerHTML = [['all', 'pubpage.fAll'], ['west', 'publications.regionWest'], ['east', 'publications.regionEast']].map(function (f) {
      var n = f[0] === 'all' ? list.length : list.filter(function (p) { return p.region === f[0]; }).length;
      return '<button type="button" class="chip pp-chip" data-region="' + f[0] + '" aria-pressed="' + (state.region === f[0]) + '">' + esc(t(f[1])) + ' <span class="cnt">' + n + '</span></button>';
    }).join('');
  }

  function renderList() {
    var list = pubs().filter(function (p) { return state.region === 'all' || p.region === state.region; });
    var note = (ru() || CPA.state.lang === 'en') ? '' : t('pubpage.absNote');
    $('[data-list]').innerHTML = list.map(function (p) {
      var open = state.open === p.id;
      var a = authorOf(p);
      var region = p.region === 'west' ? t('publications.regionWest') : p.region === 'east' ? t('publications.regionEast') : '';
      var kws = pick(p.keywords).split(';').map(function (k) { return k.trim(); }).filter(Boolean);
      var alt = ru() ? p.title.en : p.title.ru;
      return '<article class="pp-item" id="pub-' + esc(p.id) + '">' +
        '<div class="pp-year"><span class="y">' + esc(p.year) + '</span><span class="r">' + esc(region.toUpperCase()) + '</span></div>' +
        '<div class="pp-body">' +
          '<span class="pp-meta">' + esc(ru() ? '«' + (p.journal.ru || p.journal.en) + '»' : pick(p.journal)) + ' · ' + esc(p.issue) + (p.pages ? ' · ' + esc(t('pubpage.pages')) + ' ' + esc(p.pages) : '') + '</span>' +
          '<h2 class="pp-title"' + (ru() ? '' : ' lang="en"') + '>' + esc(pick(p.title)) + '</h2>' +
          (alt ? '<span class="pp-alt"' + (ru() ? ' lang="en"' : ' lang="ru"') + '>' + esc(alt) + '</span>' : '') +
          '<span class="pp-author"><a href="#authors">' + esc(a ? pick(a.name) : pick(p.author)) + '</a></span>' +
          (kws.length ? '<div class="pp-kws">' + kws.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="pp-actions">' +
            (pick(p.abstract) ? '<button type="button" class="pp-abs-btn" data-toggle="' + esc(p.id) + '" aria-expanded="' + open + '">' + esc(t(open ? 'pubpage.absHide' : 'pubpage.abs')) + '</button>' : '') +
            (p.pdf ? '<a class="pp-pdf" href="' + esc(p.pdf) + '" target="_blank" rel="noopener">' + DL + esc(t('pubpage.pdf')) + '</a>' : '') +
            (p.cyberleninka ? '<a class="pp-cl" href="' + esc(p.cyberleninka) + '" target="_blank" rel="noopener">' + esc(t('pubpage.cl')) + ' ↗</a>' : '') +
            (p.doi ? '<a class="pp-doi" href="https://doi.org/' + esc(p.doi) + '" target="_blank" rel="noopener">DOI ' + esc(p.doi) + '</a>' : '') +
          '</div>' +
          (open ? '<div class="pp-abs"><span class="pp-abs-head">' + esc(t('pubpage.absHead') + note) + '</span><p' + (ru() ? '' : ' lang="en"') + '>' + esc(pick(p.abstract)) + '</p>' +
            '<div class="pp-cite"><span class="pp-abs-head">' + esc(t('pubpage.cite')) + '</span><span>' + esc(citation(p)) + '</span></div></div>' : '') +
        '</div></article>';
    }).join('') + '<div class="pp-list-end"></div>';
  }

  function renderAuthors() {
    var list = pubs();
    $('[data-authors]').innerHTML = (CPA.data.authors.items || []).map(function (a) {
      var n = list.filter(function (p) { return p.authorId === a.id; }).length;
      return '<div class="pp-author-card">' +
        '<span class="pp-au-head">' + esc(t('pubpage.authorsHead')) + '</span>' +
        '<div class="pp-au-row"><span class="pp-au-ini" aria-hidden="true">' + esc(pick(a.initials)) + '</span><span class="pp-au-name">' + esc(pick(a.name)) + '</span></div>' +
        '<span class="pp-au-text">' + esc(tx(a.role)) + '</span><span class="pp-au-text">' + esc(pick(a.affiliation)) + '</span>' +
        '<div class="pp-au-foot">' + (a.orcid ? '<a href="' + esc(a.orcid) + '" target="_blank" rel="noopener">ORCID ↗</a>' : '<span></span>') + '<span>' + n + ' ' + esc(t('pubpage.count1')) + '</span></div>' +
      '</div>';
    }).join('');
  }

  function render() {
    document.title = t('pubpage.h1') + ' — ' + t('header.org') + ' ' + t('header.uni');
    renderStats();
    renderFilters();
    renderList();
    renderAuthors();
  }

  // Форма «Добавить публикацию»: собирает письмо и открывает почтовую программу посетителя
  function submit(e) {
    e.preventDefault();
    var f = e.target;
    var status = $('[data-status]');
    var show = function (msg, ok) { status.textContent = msg; status.hidden = false; status.classList.toggle('ok', !!ok); };
    var to = CPA.email(t('pubpage.submitEmail')) || CPA.email(t('about.vEmail'));
    if (!to) { show(t('pubpage.noEmail')); return; }
    var v = function (n) { return (f.elements[n].value || '').trim(); };
    if (!v('author') || !v('title') || !f.elements.agree.checked) { show(t('pubpage.needAgree')); return; }
    var lines = [
      [t('pubpage.fAuthor'), v('author')], [t('pubpage.fYear'), v('year')], [t('pubpage.fTitle'), v('title')],
      [t('pubpage.fJournal'), v('journal')], [t('pubpage.fDoi'), v('doi')], [t('pubpage.fLink'), v('link')], [t('pubpage.fAbs'), v('abstract')]
    ].filter(function (l) { return l[1]; }).map(function (l) { return l[0] + ': ' + l[1]; });
    lines.push('', t('pubpage.fAgree') + ' ✓');
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(t('pubpage.mailSubject')) + '&body=' + encodeURIComponent(lines.join('\n'));
    show(t('pubpage.sentMsg'), true);
  }

  CPA.start({
    content: ['publications', 'authors'],
    render: render,
    ready: function () {
      // ссылка с главной вида publications.html#pub-somaliland открывает аннотацию этой статьи
      var m = location.hash.match(/^#pub-(.+)$/);
      if (m) state.open = decodeURIComponent(m[1]);
      document.addEventListener('click', function (e) {
        var r = e.target.closest('[data-region]');
        if (r) { state.region = r.getAttribute('data-region'); renderFilters(); renderList(); return; }
        var tg = e.target.closest('[data-toggle]');
        if (tg) {
          var id = tg.getAttribute('data-toggle');
          state.open = state.open === id ? null : id;
          renderList();
          var again = document.querySelector('[data-toggle="' + id + '"]');
          if (again) again.focus();
        }
      });
      $('[data-form]').addEventListener('submit', submit);
    }
  });
})();
