import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// 👇 AJOUTE CETTE LIGNE (pour debug)
console.log("🔥 TEST CLÉ :", import.meta.env.VITE_SUPABASE_ANON_KEY);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)