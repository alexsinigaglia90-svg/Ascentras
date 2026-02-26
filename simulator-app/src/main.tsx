/*
Local run:
1) cd simulator-app
2) npm install
3) npm run dev

Production build:
1) cd simulator-app
2) npm install
3) npm run build

The build writes static output to ../warehouse-simulator so Cloudflare Pages serves /warehouse-simulator/ directly.
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
