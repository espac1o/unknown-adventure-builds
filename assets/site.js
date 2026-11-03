/* Shared behaviour for every page of the site: language, navigation, copy buttons, enlarged screenshots,
 * the latest-version badge and (on the user guide) the device picker.
 * A page supplies its own Russian strings as window.UA_RU = { key: "html" }; keys shared by all pages are below. */
(function () {
  'use strict';

  /*COMMON-RU-START*/
  var COMMON_RU = {
    nav_overview: `Обзор`,
    nav_guide: `Руководство`,
    nav_mechanics: `Механики`,
    nav_versions: `Версии`,
    copy: `Копировать`,
    latest_label: `Последняя версия:`,
    footer: `Сборки:`
  };
  /*COMMON-RU-END*/

  var REPO = 'espac1o/unknown-adventure-builds';
  var dict = Object.assign({}, COMMON_RU, window.UA_RU || {});
  var COPIED = { en: 'Copied ✓', ru: 'Скопировано ✓' };
  var lang = 'en';
  var titleEn = document.title;

  function applyLang(l, remember) {
    lang = l === 'ru' ? 'ru' : 'en';
    document.documentElement.lang = lang;
    document.title = lang === 'ru' && dict.page_title ? dict.page_title : titleEn;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      var k = el.getAttribute('data-i18n');
      el.innerHTML = (lang === 'ru' && dict[k] !== undefined) ? dict[k] : el.dataset.en;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      if (el.dataset.enAlt === undefined) el.dataset.enAlt = el.getAttribute('alt');
      var k = el.getAttribute('data-i18n-alt');
      el.setAttribute('alt', (lang === 'ru' && dict[k] !== undefined) ? dict[k] : el.dataset.enAlt);
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    // Keep the chosen language when moving between pages.
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      var base = a.getAttribute('data-nav-base') || a.getAttribute('href');
      a.setAttribute('data-nav-base', base);
      var hash = base.indexOf('#') >= 0 ? base.slice(base.indexOf('#')) : '';
      var path = base.replace(/[?#].*$/, '');
      a.setAttribute('href', path + '?lang=' + lang + hash);
    });
    if (remember) {
      try { localStorage.setItem('ua-lang', lang); } catch (e) {}
      try { var u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u.toString()); } catch (e) {}
    }
  }

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); });
  });

  var want = null;
  try { want = new URL(location.href).searchParams.get('lang'); } catch (e) {}
  if (want !== 'ru' && want !== 'en') { try { want = localStorage.getItem('ua-lang'); } catch (e) {} }
  if (want !== 'ru' && want !== 'en') want = /^ru\b/i.test(navigator.language || '') ? 'ru' : 'en';
  applyLang(want, false);

  // Mark the current page in the navigation.
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topnav .links a').forEach(function (a) {
    var target = (a.getAttribute('data-nav-base') || a.getAttribute('href')).replace(/[?#].*$/, '');
    if (target === here || (here === '' && target === 'index.html')) a.setAttribute('aria-current', 'page');
  });

  // Device picker (user guide only)
  var picks = document.querySelectorAll('[data-pick]');
  if (picks.length) {
    var devices = ['mac', 'deck', 'windows'];
    var body = document.body;
    var choose = function (device, remember) {
      body.setAttribute('data-selected', device || 'none');
      picks.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-pick') === device)); });
      if (device && remember) {
        try { localStorage.setItem('ua-device', device); } catch (e) {}
        if (history.replaceState) { var u = new URL(location.href); u.hash = device; history.replaceState(null, '', u.toString()); }
      }
    };
    var detect = function () {
      var ua = navigator.userAgent || '';
      if (/Android|iPhone|iPad|iPod/.test(ua)) return null;
      if (/Mac/.test(ua)) return 'mac';
      if (/Windows/.test(ua)) return 'windows';
      if (/Linux|X11|CrOS|SteamOS/.test(ua)) return 'deck';
      return null;
    };
    picks.forEach(function (b) {
      b.addEventListener('click', function () { choose(b.getAttribute('data-pick'), true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
    var fromHash = location.hash.replace('#', '');
    var saved = null;
    try { saved = localStorage.getItem('ua-device'); } catch (e) {}
    choose(devices.indexOf(fromHash) >= 0 ? fromHash : (devices.indexOf(saved) >= 0 ? saved : detect()), false);
  }

  // Copy buttons
  document.querySelectorAll('.cmd .copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.parentNode.querySelector('pre').innerText.trim();
      function done() { var old = btn.textContent; btn.textContent = COPIED[lang]; btn.classList.add('done'); setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 1600); }
      function fallback() {
        var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    });
  });

  // Click a screenshot to enlarge it; click again or press Escape to close.
  var images = document.querySelectorAll('figure img');
  if (images.length) {
    var box = document.createElement('div'); box.className = 'lightbox'; box.innerHTML = '<img alt="">'; document.body.appendChild(box);
    var closeBox = function () { box.classList.remove('open'); };
    images.forEach(function (img) {
      img.addEventListener('click', function () { var big = box.querySelector('img'); big.src = img.src; big.alt = img.alt; box.classList.add('open'); });
    });
    box.addEventListener('click', closeBox);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });
  }

  // Latest version (silently skipped when offline): fills the badge line and marks the newest version card.
  try {
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.tag_name) return;
        var version = j.tag_name.replace(/^v/, '');
        var a = document.getElementById('latest');
        if (a) { a.textContent = version; a.href = j.html_url || a.href; }
        var line = document.getElementById('latestLine');
        if (line) line.style.display = '';
        document.querySelectorAll('[data-version="' + version + '"] .latest-badge').forEach(function (b) { b.classList.add('on'); });
      }).catch(function () {});
  } catch (e) {}
})();
