import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('app');
const root = createRoot(container);

// On attend l'initialisation du canal de communication Cockpit
window.cockpit.transport.wait(() => {
    root.render(<App />);
});
