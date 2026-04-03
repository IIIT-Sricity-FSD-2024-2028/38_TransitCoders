const Theme = (() => {
  let dark = localStorage.getItem('st_theme') === 'dark';

  function apply() {
    document.body.classList.toggle('dark', dark);
    
    const svgIconEl = document.getElementById('theme-icon-svg');
    const labelEl   = document.getElementById('theme-label');
    
    if (svgIconEl) {
      if (dark) {
        svgIconEl.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
      } else {
        svgIconEl.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
      }
    }
    
    if (labelEl) {
      labelEl.textContent = dark ? 'Dark' : 'Light';
    }
  }

  function toggle() {
    dark = !dark;
    localStorage.setItem('st_theme', dark ? 'dark' : 'light');
    apply();
  }

  // Apply on load
  apply();

  return { toggle, apply };
})();

window.toggleTheme = function() { Theme.toggle(); };
