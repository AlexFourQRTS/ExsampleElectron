import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { setupGlobalLogger } from './utils/logger'

setupGlobalLogger()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)