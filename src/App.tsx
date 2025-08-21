import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import EventsRecommendation from './pages/EventsRecommendation'

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/"
          element={<Layout><HomePage /></Layout>}
        />
        <Route
          path="/eventsRecommendation"
          element={<Layout><EventsRecommendation /></Layout>}
        />
      </Routes>
    </Router>
  )
}

export default App
