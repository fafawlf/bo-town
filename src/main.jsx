import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No StrictMode — it double-fires useEffect which breaks PixiJS singleton init
createRoot(document.getElementById('root')).render(<App />)
