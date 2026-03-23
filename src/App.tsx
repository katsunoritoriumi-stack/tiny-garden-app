// アプリのルートコンポーネント
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import AreaDetail from './pages/AreaDetail'
import { useSupabaseSync } from './hooks/useSupabaseSync'

function AppContent() {
  // Supabaseリアルタイム同期フック（Phase 3）
  useSupabaseSync()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/area/:areaId" element={<AreaDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
