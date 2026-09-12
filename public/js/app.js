const toggle = document.getElementById('theme-toggle');
if (toggle) { toggle.checked = document.documentElement.dataset.theme === 'dark'; toggle.addEventListener('change', () => { const value = toggle.checked ? 'dark' : 'light'; document.documentElement.dataset.theme = value; try { localStorage.setItem('sqlrush-theme', value); } catch { } }); }
