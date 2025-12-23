import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryProvider } from './providers/QueryProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical Error during React Mount:", error);
  rootElement.innerHTML = `<div style="padding:20px; color:red">
    <h1>Critical Error</h1>
    <p>Failed to mount application.</p>
    <pre>${error}</pre>
  </div>`;
}