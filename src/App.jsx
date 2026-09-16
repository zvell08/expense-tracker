import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Memuat…</div>
  }

  return user ? <Dashboard /> : <Login />
}
