import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BottomNav } from './components/BottomNav'
import { PinLogin } from './components/PinLogin'
import { Home } from './pages/Home'
import { Sales } from './pages/Sales'
import { Inventory } from './pages/Inventory'
import { Customers } from './pages/Customers'
import { Settings } from './pages/Settings'
import { History } from './pages/History'
import { useStore } from './stores/useStore'
import { db, initializeDatabase } from './db'

function App() {
  const { currentUser, login, setOnline } = useStore()
  const users = useLiveQuery(() => db.users.filter(u => u.isActive).toArray(), [])

  useEffect(() => {
    initializeDatabase()
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  // Show PIN login if users exist and no one is logged in
  if (users && users.length > 0 && !currentUser) {
    return <PinLogin users={users} onLogin={login} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
