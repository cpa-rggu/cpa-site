/* Страница экспоната по QR-коду (exhibit.html?n=03.14). Данные — content/exhibits.json. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, tx = CPA.tx, t = CPA.t;
  var state = { photo: 0, optic: 0 };
  var item = null, list = [];
  var audio = null;

  var PLAY = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg>';
  var PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8v8M14 8v8"/></svg>';

  function norm(n) { return String(n || '').trim().replace(',', '.'); }
  function href(n) { return 'exhibit.html?n=' + encodeURIComponent(n); }
  function fmt(sec) {
    if (!isFinite(sec)) return '[mm:ss]';
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function numForm(value) {
    return '<form class="numform ex-numform" data-exform>' +
      '<label for="ex-num" class="sr-only">' + esc(t('hero.numLabel')) + '</label>' +
      '<input id="ex-num" type="text" inputmode="decimal" autocomplete="off" value="' + esc(value || '') + '" placeholder="' + esc(t('hero.numShort')) + '">' +
      '<button type="submit">' + esc(t('hero.open')) + '</button></form>';
  }

  function renderPhoto() {
    var photos = item.photos || [];
    var p = photos[state.photo] || {};
    var box = $('[data-ex-photo]');
    if (!box) return;
    box.innerHTML =
      (p.src ? '<img src="' + esc(p.src) + '" alt="' + esc(tx(item.title)) + '"' + (p.color ? '' : ' class="bw"') + '>' : '') +
      '<span class="ex-stamp">' + esc(t('exhibit.stamp')) + '</span>' +
      (photos.length > 1 ? '<span class="ex-count">' + (state.photo + 1) + ' / ' + photos.length + '</span>' : '');
  }
  function renderOptics() {
    var o = item.optics || [];
    var cur = o[state.optic] || {};
    var box = $('[data-ex-optics]');
    if (!box || !o.length) return;
    box.innerHTML =
      '<div class="ex-optics-head">' + esc(t('exhibit.opticsHead')) + '</div>' +
      '<div class="ex-optics-tabs" role="tablist">' + o.map(function (c, i) {
        return '<button type="button" role="tab" data-optic="' + i + '" aria-selected="' + (i === state.optic) + '">' + esc(tx(c.label)) + '</button>';
      }).join('') + '</div>' +
      '<div class="ex-optics-body" role="tabpanel"><div class="ex-optics-scan">' + esc(tx(cur.scan)) + '</div><p>' + esc(tx(cur.text)) + '</p></div>';
  }

  function render() {
    list = CPA.data.exhibits.items || [];
    var n = norm(CPA.param('n'));
    item = n ? list.filter(function (x) { return norm(x.n) === n; })[0] : list[0];
    var main = $('[data-exhibit]');
    if (!item) {
      document.title = CPA.cap(t('exhibit.word')) + ' ' + n;
      main.innerHTML = '<section class="ex-notfound"><h1 class="ex-h1">' + esc(t('exhibit.word')) + ' ' + esc(n) + '</h1>' +
        '<p>' + esc(t('exhibit.notFound')) + '</p>' + numForm(n) +
        '<div class="ex-near-grid">' + list.map(card).join('') + '</div></section>';
      return;
    }
    var idx = list.indexOf(item);
    var prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
    var back = item.back || {};
    document.title = CPA.cap(t('exhibit.word')) + ' ' + item.n + ' — ' + tx(item.title);
    var related = (item.related || []).map(function (rn) { return list.filter(function (x) { return norm(x.n) === norm(rn); })[0]; }).filter(Boolean);

    main.innerHTML =
      '<div class="ex-top"><a href="' + esc(back.href || 'index.html#timeline') + '">← ' + esc(tx(back.label) || t('header.navChron')) + '</a><span>' + (idx + 1) + ' / ' + list.length + '</span></div>' +
      '<figure class="ex-photo"><button type="button" class="ex-photo-box" data-ex-photo data-next-photo aria-label="' + esc(tx(item.title)) + '"></button></figure>' +
      '<div class="ex-head">' +
        '<span class="ex-kicker">' + esc(t('exhibit.word')) + ' ' + esc(item.n) + ' · ' + esc(tx(item.kind)) + '</span>' +
        '<h1 class="ex-h1">' + esc(tx(item.title)) + '</h1>' +
        '<dl class="ex-dl">' +
          '<dt>' + esc(t('exhibit.lPlace')) + '</dt><dd>' + esc(tx(item.place)) + '</dd>' +
          '<dt>' + esc(t('exhibit.lDate')) + '</dt><dd>' + esc(tx(item.date)) + '</dd>' +
          '<dt>' + esc(t('exhibit.lAuthor')) + '</dt><dd>' + esc(tx(item.author)) + '</dd>' +
          '<dt>' + esc(t('exhibit.lSource')) + '</dt><dd>' + esc(tx(item.source)) + '</dd>' +
        '</dl>' +
      '</div>' +
      '<div class="ex-listen-wrap"><button type="button" class="ex-listen" data-listen>' + PLAY + '<span>' + esc(t('exhibit.listen')) + '</span><span class="ex-time" data-time>[mm:ss]</span></button></div>' +
      '<div class="ex-text"><p>' + esc(tx(item.text)) + '</p><p class="muted">' + esc(tx(item.story)) + '</p></div>' +
      '<section class="ex-optics" aria-label="' + esc(t('exhibit.optics')) + '" data-ex-optics></section>' +
      (related.length ? '<section class="ex-near"><h2>' + esc(t('exhibit.near')) + '</h2><div class="ex-near-grid">' + related.map(card).join('') + '</div></section>' : '') +
      '<nav class="ex-pager" aria-label="' + esc(t('exhibit.navLabel')) + '">' +
        '<a href="' + href(prev.n) + '"><span class="lbl">← ' + esc(t('exhibit.prev')) + '</span><span class="num">' + esc(prev.n) + '</span></a>' +
        '<a href="' + href(next.n) + '" class="right"><span class="lbl">' + esc(t('exhibit.next')) + ' →</span><span class="num">' + esc(next.n) + '</span></a>' +
      '</nav>' +
      '<div class="ex-goto">' + numForm('') + '</div>';
    renderPhoto();
    renderOptics();
    setupAudio();
  }
  function card(x) {
    var p = (x.photos || [])[0] || {};
    return '<a class="ex-near-card" href="' + href(x.n) + '"><img src="' + esc(p.src) + '" alt="' + esc(tx(x.title)) + '" loading="lazy"' + (p.color ? '' : ' class="bw"') + '>' +
      '<span class="num">' + esc(x.n) + '</span><span class="ttl">' + esc(tx(x.title)) + '</span></a>';
  }

  // Аудиогид: если в админке загружен файл (поле «Аудио»), кнопка его проигрывает
  function setupAudio() {
    if (audio) { audio.pause(); audio = null; }
    if (!item.audio) return;
    audio = new Audio(item.audio);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', function () { var el = $('[data-time]'); if (el) el.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', function () { var el = $('[data-time]'); if (el) el.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration); });
    audio.addEventListener('ended', function () { setPlaying(false); });
  }
  function setPlaying(on) {
    var b = $('[data-listen]');
    if (b) { b.firstChild.outerHTML = on ? PAUSE : PLAY; b.setAttribute('aria-pressed', on); }
  }

  CPA.start({
    content: ['exhibits'],
    render: render,
    ready: function () {
      document.addEventListener('click', function (e) {
        var el = e.target;
        if (el.closest('[data-next-photo]')) {
          var n = (item && item.photos || []).length;
          if (n > 1) { state.photo = (state.photo + 1) % n; renderPhoto(); }
          return;
        }
        var o = el.closest('[data-optic]');
        if (o) { state.optic = +o.getAttribute('data-optic'); renderOptics(); return; }
        if (el.closest('[data-listen]')) {
          if (!audio) { CPA.toast(t('system.soonNotice')); return; }
          if (audio.paused) { audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); }
        }
      });
      document.addEventListener('submit', function (e) {
        if (!e.target.closest('[data-exform]')) return;
        e.preventDefault();
        var v = norm(e.target.querySelector('input').value);
        if (v) location.href = href(v);
      });
    }
  });
})();
