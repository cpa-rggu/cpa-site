/* Личный кабинет (account.html) — ТЕСТ. Регистрация с подтверждением почты, вход, сброс пароля.
   Всё делает Supabase Auth (письма тоже отправляет он). Адрес проекта и публичный ключ — content/auth.json.
   Служебный ключ (service_role) сюда класть НЕЛЬЗЯ: сайт публичный. */
(function () {
  'use strict';

  var $ = CPA.$, esc = CPA.esc, t = CPA.t;
  var KEY = 'cpa.auth';
  var state = { view: 'login', user: null, msg: '', ok: false, busy: false };

  // Ссылка из письма возвращает на эту страницу с токенами или ошибкой после «#» — забираем их до отрисовки
  var back = parseHash();
  if (back) history.replaceState(null, '', location.pathname + location.search);

  function parseHash() {
    if (location.hash.indexOf('access_token=') < 0 && location.hash.indexOf('error=') < 0) return null;
    var o = {};
    location.hash.slice(1).split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    return o;
  }

  function cfg() { return CPA.data.auth || {}; }
  function configured() { var c = cfg(); return !!(c.url && c.anonKey); }
  function here() { return location.origin + location.pathname; }

  // ---------- сессия ----------
  function saveSession(s) {
    var v = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: Date.now() + (+s.expires_in || 3600) * 1000 };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function getSession() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function clearSession() { try { localStorage.removeItem(KEY); } catch (e) {} }

  // ---------- запросы к Supabase Auth ----------
  function api(method, path, body, token) {
    var c = cfg();
    var headers = { apikey: c.anonKey, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(c.url.replace(/\/+$/, '') + '/auth/v1/' + path, {
      method: method, headers: headers, body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.text().then(function (txt) {
        var data = {};
        try { data = txt ? JSON.parse(txt) : {}; } catch (e) {}
        if (!r.ok) { var err = new Error(data.msg || data.error_description || data.message || ('HTTP ' + r.status)); err.code = data.error_code || data.code || data.error; err.status = r.status; throw err; }
        return data;
      });
    });
  }
  // Действующий токен; если истёк — обновляем
  function token() {
    var s = getSession();
    if (!s) return Promise.resolve(null);
    if (s.expires_at - Date.now() > 60000) return Promise.resolve(s.access_token);
    return api('POST', 'token?grant_type=refresh_token', { refresh_token: s.refresh_token })
      .then(function (d) { saveSession(d); return d.access_token; })
      .catch(function () { clearSession(); return null; });
  }
  function loadUser() {
    return token().then(function (tk) {
      if (!tk) return null;
      return api('GET', 'user', null, tk).catch(function () { clearSession(); return null; });
    });
  }

  // Понятный текст ошибки
  function errText(e) {
    var map = {
      invalid_credentials: 'errCreds', email_not_confirmed: 'errNotConfirmed', user_already_exists: 'errExists',
      weak_password: 'errWeak', over_email_send_rate_limit: 'errRate', over_request_rate_limit: 'errRate',
      email_address_invalid: 'errEmail', validation_failed: 'errEmail', otp_expired: 'errLink', same_password: 'errSame'
    };
    var k = map[e.code];
    if (!k && /invalid login/i.test(e.message)) k = 'errCreds';
    if (!k && /not confirmed/i.test(e.message)) k = 'errNotConfirmed';
    if (!k && /already registered/i.test(e.message)) k = 'errExists';
    if (!k && e instanceof TypeError) k = 'errNet';
    return k ? t('account.' + k) : t('account.errOther') + ' (' + e.message + ')';
  }

  // ---------- отрисовка ----------
  function field(name, label, type, extra) {
    return '<label class="cpa-field"><span>' + esc(t('account.' + label)) + '</span><input name="' + name + '" type="' + type + '"' + (extra || '') + '></label>';
  }
  function tabs() {
    return '<div class="ac-tabs" role="tablist">' + ['login', 'signup'].map(function (v) {
      return '<button type="button" role="tab" class="ac-tab" data-view="' + v + '" aria-selected="' + (state.view === v) + '">' + esc(t('account.tab_' + v)) + '</button>';
    }).join('') + '</div>';
  }
  function statusInner() {
    return state.msg ? '<div class="pp-status' + (state.ok ? ' ok' : '') + '">' + esc(state.msg) + '</div>' : '';
  }
  function status() { return '<div data-status role="status">' + statusInner() + '</div>'; }
  // Сообщение без перерисовки формы — введённое не стирается
  function say(msg, ok) {
    state.msg = msg; state.ok = !!ok;
    var box = $('[data-status]');
    if (box) box.innerHTML = statusInner(); else render();
  }
  function submit(label) {
    return '<div class="pp-submit-row"><button type="submit" class="pp-submit"' + (state.busy ? ' disabled' : '') + '>' + esc(t('account.' + label)) + '</button></div>';
  }

  function viewHtml() {
    var v = state.view;
    if (!configured()) return '<div class="pp-status">' + esc(t('account.notConfigured')) + '</div>';
    if (v === 'cabinet') {
      var u = state.user || {};
      var meta = u.user_metadata || {};
      var since = u.created_at ? new Date(u.created_at).toLocaleDateString(CPA.state.lang) : '';
      return status() +
        '<dl class="ac-dl">' +
          '<div><dt>' + esc(t('account.email')) + '</dt><dd>' + esc(u.email || '') + '</dd></div>' +
          '<div><dt>' + esc(t('account.confirmed')) + '</dt><dd>' + esc(u.email_confirmed_at ? t('account.yes') : t('account.no')) + '</dd></div>' +
          '<div><dt>' + esc(t('account.since')) + '</dt><dd>' + esc(since) + '</dd></div>' +
        '</dl>' +
        '<form class="pp-form ac-form" data-form="profile" novalidate>' +
          '<h2 class="ac-h2">' + esc(t('account.profileH')) + '</h2>' +
          field('name', 'name', 'text', ' autocomplete="name" value="' + esc(meta.name || '') + '"') +
          submit('save') +
        '</form>' +
        '<form class="pp-form ac-form" data-form="password" novalidate>' +
          '<h2 class="ac-h2">' + esc(t('account.passH')) + '</h2>' +
          field('password', 'newPassword', 'password', ' autocomplete="new-password" minlength="8"') +
          submit('save') +
        '</form>' +
        '<button type="button" class="btn-outline ac-logout" data-act="logout">' + esc(t('account.logout')) + '</button>';
    }
    if (v === 'sent') {
      return status() + '<button type="button" class="btn-outline" data-act="resend">' + esc(t('account.resend')) + '</button> ' +
        '<button type="button" class="ac-link" data-view="login">' + esc(t('account.toLogin')) + '</button>';
    }
    if (v === 'forgot') {
      return status() + '<form class="pp-form ac-form" data-form="forgot" novalidate>' +
        '<p class="ac-p">' + esc(t('account.forgotP')) + '</p>' +
        field('email', 'email', 'email', ' autocomplete="email" required') + submit('sendLink') +
        '<button type="button" class="ac-link" data-view="login">' + esc(t('account.toLogin')) + '</button></form>';
    }
    if (v === 'reset') {
      return status() + '<form class="pp-form ac-form" data-form="password" novalidate>' +
        '<p class="ac-p">' + esc(t('account.resetP')) + '</p>' +
        field('password', 'newPassword', 'password', ' autocomplete="new-password" minlength="8" required') + submit('save') + '</form>';
    }
    if (v === 'signup') {
      return tabs() + status() + '<form class="pp-form ac-form" data-form="signup" novalidate>' +
        field('name', 'name', 'text', ' autocomplete="name"') +
        field('email', 'email', 'email', ' autocomplete="email" required') +
        field('password', 'password', 'password', ' autocomplete="new-password" minlength="8" required') +
        '<label class="pp-agree"><input type="checkbox" name="agree"><span>' + esc(t('account.agree')) + '</span></label>' +
        submit('signup') + '</form>';
    }
    return tabs() + status() + '<form class="pp-form ac-form" data-form="login" novalidate>' +
      field('email', 'email', 'email', ' autocomplete="email" required') +
      field('password', 'password', 'password', ' autocomplete="current-password" required') +
      submit('login') +
      '<button type="button" class="ac-link" data-view="forgot">' + esc(t('account.forgot')) + '</button></form>';
  }

  function render() {
    document.title = t('account.h1') + ' — ' + t('header.org') + ' ' + t('header.uni');
    $('[data-account]').innerHTML =
      '<section class="ac-sec"><div class="wrap ac-inner">' +
        '<div class="ac-head">' +
          '<div class="pp-crumbs"><a href="index.html">' + esc(t('common.home')) + '</a><span>/</span><span>' + esc(t('account.h1')) + '</span></div>' +
          '<span class="ac-test">' + esc(t('account.testBadge')) + '</span>' +
          '<h1 class="pp-h1">' + esc(t(state.view === 'cabinet' ? 'account.cabinetH' : 'account.h1')) + '</h1>' +
          '<p class="ac-p">' + esc(t('account.testNote')) + '</p>' +
        '</div>' +
        '<div class="ac-body" data-ac-body>' + viewHtml() + '</div>' +
      '</div></section>';
  }

  function go(view, msg, ok) {
    state.view = view; state.msg = msg || ''; state.ok = !!ok;
    render();
    var f = $('[data-ac-body] input');
    if (f && view !== 'cabinet') f.focus();
  }
  function busy(on) { state.busy = on; var b = $('[data-ac-body] [type="submit"]'); if (b) b.disabled = on; }
  function showError(e) { busy(false); say(errText(e)); }

  function openCabinet(msg) {
    return loadUser().then(function (u) {
      if (!u) { go('login', msg ? msg : ''); return; }
      state.user = u; go('cabinet', msg || '', true);
    });
  }

  // ---------- формы ----------
  function onSubmit(e) {
    var form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form');
    var val = function (n) { var i = form.querySelector('[name="' + n + '"]'); return i ? (i.type === 'checkbox' ? i.checked : i.value.trim()) : ''; };
    var email = val('email'), pass = form.querySelector('[name="password"]') ? form.querySelector('[name="password"]').value : '';
    if ((kind === 'login' || kind === 'signup' || kind === 'forgot') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say(t('account.errEmail')); return; }
    if ((kind === 'signup' || kind === 'password') && pass.length < 8) { say(t('account.errWeak')); return; }
    if (kind === 'signup' && !val('agree')) { say(t('account.errAgree')); return; }
    busy(true);

    if (kind === 'login') {
      api('POST', 'token?grant_type=password', { email: email, password: pass })
        .then(function (d) { saveSession(d); state.busy = false; return openCabinet(); })
        .catch(function (err) { state.lastEmail = email; showError(err); });
    } else if (kind === 'signup') {
      state.lastEmail = email;
      api('POST', 'signup?redirect_to=' + encodeURIComponent(here()), { email: email, password: pass, data: { name: val('name') } })
        .then(function (d) {
          state.busy = false;
          // Если подтверждение почты в Supabase выключено, вход происходит сразу
          if (d.access_token) { saveSession(d); return openCabinet(t('account.welcome')); }
          go('sent', t('account.sentSignup').replace('{email}', email), true);
        })
        .catch(showError);
    } else if (kind === 'forgot') {
      state.lastEmail = email;
      api('POST', 'recover?redirect_to=' + encodeURIComponent(here()), { email: email })
        .then(function () { state.busy = false; go('sent', t('account.sentReset').replace('{email}', email), true); })
        .catch(showError);
    } else if (kind === 'profile' || kind === 'password') {
      var body = kind === 'profile' ? { data: { name: val('name') } } : { password: pass };
      token().then(function (tk) {
        if (!tk) { state.busy = false; go('login', t('account.errSession')); return; }
        return api('PUT', 'user', body, tk).then(function (u) {
          state.user = u; state.busy = false;
          go('cabinet', t(kind === 'profile' ? 'account.saved' : 'account.passSaved'), true);
        });
      }).catch(showError);
    }
  }

  function onClick(e) {
    var v = e.target.closest('[data-view]');
    if (v) { go(v.getAttribute('data-view')); return; }
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'logout') {
      token().then(function (tk) { if (tk) return api('POST', 'logout', null, tk).catch(function () {}); })
        .then(function () { clearSession(); state.user = null; go('login', t('account.loggedOut'), true); });
    } else if (act === 'resend' && state.lastEmail) {
      api('POST', 'resend?redirect_to=' + encodeURIComponent(here()), { type: 'signup', email: state.lastEmail })
        .then(function () { say(t('account.resent'), true); })
        .catch(showError);
    }
  }

  CPA.start({
    content: ['auth'],
    render: render,
    ready: function () {
      document.addEventListener('submit', onSubmit);
      document.addEventListener('click', onClick);
      if (!configured()) return;
      if (back && back.error) {
        state.msg = errText({ code: back.error_code, message: back.error_description || back.error });
        return;
      }
      if (back && back.access_token) {
        saveSession(back);
        if (back.type === 'recovery') { state.view = 'reset'; return; }
        openCabinet(t(back.type === 'signup' ? 'account.confirmedNow' : 'account.welcome'));
        return;
      }
      if (getSession()) openCabinet();
    }
  });
})();
