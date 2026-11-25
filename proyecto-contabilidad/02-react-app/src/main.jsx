import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { activarTablasTarjeta } from './lib/tablasTarjeta'

activarTablasTarjeta()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
