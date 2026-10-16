import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { aplikujTemu, sledujSystemovuTemu } from './utils/tema'

aplikujTemu()
sledujSystemovuTemu()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
