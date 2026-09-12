try { const saved = localStorage.getItem('sqlrush-theme'); document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light'; } catch { }
