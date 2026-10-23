function updateSessionNotice(info) {
  const notice = document.querySelector('#session-demo-notice');
  if (!notice) return;
  notice.textContent = info.mode === 'memory'
    ? 'Browser demo · Storage unavailable: changes last only until this page reloads. Use synthetic details.'
    : 'Browser session demo · Entries stay in this tab. No real bookings or payments.';
  if (info.recovered) notice.textContent += ' Unreadable saved demo data was reset.';
  if (info.resetIncomplete) notice.textContent = 'Current demo reset. Browser storage could not be cleared: a saved copy may return after reload. Clear this site’s browser data to remove it.';
}
window.SamalDemo = createDemoApi({ onPersistenceChange: updateSessionNotice });
updateSessionNotice(window.SamalDemo.persistence);
document.addEventListener('click', event => {
  if (!event.target.closest('[data-reset-demo]')) return;
  const result = window.SamalDemo.reset();
  if (result.reloadSafe) {
    location.hash = '#home';
    location.reload();
  } else {
    // If browser storage is blocked, a reload could restore a stale saved copy.
    // Reset the current UI in place and disclose the storage limitation instead.
    window.dispatchEvent(new Event('samal:reset'));
    updateSessionNotice(window.SamalDemo.persistence);
  }
});
