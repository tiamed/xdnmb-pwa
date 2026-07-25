import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { queryClient } from './queryClient'

// 收藏已改为纯订阅 API，清除旧本地缓存
try {
  localStorage.removeItem('nmb-favorites')
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)

