import './App.css'
import { BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import Register from './pages/Register'
import EventsRecommendation from './pages/EventsRecommendation'
import InspirationForm from './pages/InspirationForm'
import CitiesRecommendation from './pages/CitiesRecommendation'

function App() {
  return (
    <Router>
      <Routes>
        {/* Parent route: Define Layout */}
        <Route
          path="/"
          element={<Layout />}
        >
          {/* Children route: It would be rendered at where <Outlet> in <Layout> */}
          <Route 
            index // index means this is the default route of the parent route
            element={<HomePage />}
          />
          <Route 
            path="register" // since the parent route is '/', we only need to put relative path here
            element={<Register />}
          />
          <Route
            path="eventsRecommendation"
            element={<EventsRecommendation />}
          />
          <Route 
            path="inspirationForm"
            element={<InspirationForm />}
          />
          <Route
            path="citiesRecommendation"
            element={<CitiesRecommendation />}
          />
          {/* Error page (to be defined) */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App
