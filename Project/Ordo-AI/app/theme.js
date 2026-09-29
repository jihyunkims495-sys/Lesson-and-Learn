/* Set the stored preference before first paint; preserve the original light theme by default. */
(function () {
  'use strict';
  const KEY = 'ordo-color-theme-v1';
  const valid = value => value === 'dark' ? 'dark' : 'light';
  let saved = 'light';
  try { saved = valid(localStorage.getItem(KEY)); } catch (_) {}
  document.documentElement.dataset.theme = saved;
  function sync() {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', '다크모드');
      button.title = dark ? '라이트 모드로 전환' : '다크 모드로 전환';
      button.innerHTML = '<span aria-hidden="true">' + (dark ? '☀' : '☾') + '</span><span>' + (dark ? 'LIGHT' : 'DARK') + '</span>';
    });
  }
  function apply(value, persist) {
    const mode = valid(value);
    document.documentElement.dataset.theme = mode;
    if (persist) {
      try { localStorage.setItem(KEY, mode); }
      catch (_) { window.toast?.('테마는 이번 화면에 적용됐지만 브라우저에 저장하지 못했습니다.'); }
    }
    sync();
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-theme-toggle]')) return;
    apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) apply(event.newValue, false);
  });
  document.addEventListener('DOMContentLoaded', sync);
  window.OrdoTheme = {sync};
})();
