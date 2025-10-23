
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './index'

function showFatal(message: string) {
  const el = document.getElementById('root');
  if (!el) return;
  el.innerHTML = `<div style="padding:16px;font:14px/1.4 system-ui; color:#7f1d1d; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; max-width:960px; margin:24px auto;">
    <strong>App failed to start</strong><br/>${message}
  </div>`;
}

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('#root element not found');

  const root = ReactDOM.createRoot(rootEl);
  root.render(<React.StrictMode><App /></React.StrictMode>);

  window.addEventListener('error', (e) => {
    showFatal((e as any)?.error?.message || (e as any)?.message || 'Unknown runtime error');
  });
  window.addEventListener('unhandledrejection', (e:any) => {
    showFatal(e?.reason?.message || 'Unhandled promise rejection');
  });
} catch (err:any) {
  showFatal(err?.message || String(err));
}
