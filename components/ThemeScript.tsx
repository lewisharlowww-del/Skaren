// Runs as an inline script before React hydrates — prevents flash of wrong theme.
export function ThemeScript() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('skaren:theme');
    var p = stored === 'dark' ? 'dark' : stored === 'system' ? 'system' : 'light';
    if (stored !== p) localStorage.setItem('skaren:theme', p);
    var dark = p === 'dark' || (p === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  } catch(e) {}
})();
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
