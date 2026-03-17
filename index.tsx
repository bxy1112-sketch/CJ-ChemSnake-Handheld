import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- GitHub Pages 兼容性补丁 ---
if (typeof window !== 'undefined') {
  // 防止某些库寻找 process 对象而导致崩溃
  (window as any).process = { env: { NODE_ENV: 'production' } };
  (window as any).global = window;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);