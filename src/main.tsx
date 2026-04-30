import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 5E: ?clear 参数自动清空所有本地存储
if (location.search.includes('clear')) {
  localStorage.clear();
  sessionStorage.clear();
  location.replace('/');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
