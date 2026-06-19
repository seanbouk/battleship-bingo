import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SettingsProvider } from './settings/SettingsContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
