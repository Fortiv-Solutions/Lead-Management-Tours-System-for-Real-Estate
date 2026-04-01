import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'
import { SearchProvider } from './context/SearchContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <SearchProvider>
        <App />
      </SearchProvider>
    </Router>
  </React.StrictMode>,
)
