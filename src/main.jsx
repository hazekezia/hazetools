import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear OCR history on full page reload
try {
  sessionStorage.removeItem('ocr-history');
} catch (e) {
  console.error('Failed to clear sessionStorage', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
