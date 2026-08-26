import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

/*
 *
 * - This is the entry point of the React application. It hooks React into the standard HTML DOM.
 * - createRoot(): The React 18+ way to initialize the app. Enables concurrent features.
 * - <StrictMode>: A development-only tool that highlights potential problems. It intentionally 
 *   double-invokes effects and lifecycles in dev mode to help you find side-effect bugs.
 * - <BrowserRouter>: Uses the HTML5 history API to keep your UI in sync with the URL (Client-Side Routing).
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
