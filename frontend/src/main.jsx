// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,  // we call mermaid.render() manually
  theme: 'dark',
  themeVariables: {
    primaryColor: '#4f46e5',    // indigo — matches your UI
    primaryTextColor: '#e5e7eb',
    lineColor: '#6b7280',
    background: '#1e1e2e',
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);