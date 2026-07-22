/*!
 * Copyright © Todos los derechos reservados Cyluk
 * Repository: https://github.com/Cyluk-dev/Galaxia
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("%cCopyright © Todos los derechos reservados Cyluk", "color: #00ff00; font-weight: bold; font-size: 14px;");
console.log("%cRepository: https://github.com/Cyluk-dev/Galaxia", "color: #00ff00;");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
