import { useEffect, useState } from 'react'
import { AppStateProvider } from './state/AppStateContext'
import { ScoreHeader } from './components/ScoreHeader'
import { TripTabs } from './components/TripTabs'
import { CheckpointList } from './components/CheckpointList'
import { MapView } from './components/MapView'
import { Settings } from './components/Settings'
import { ShareImporter } from './components/ShareImporter'
import './App.css'

const MOBILE_BREAKPOINT = 800

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when crossing from mobile back to desktop
  useEffect(() => {
    if (!isMobile && drawerOpen) setDrawerOpen(false)
  }, [isMobile, drawerOpen])

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <AppStateProvider>
      <ShareImporter />
      <div className="app">
        <ScoreHeader onMenuClick={isMobile ? () => setDrawerOpen(true) : undefined} />
        <div className="app__toolbar">
          <TripTabs />
          <Settings />
        </div>
        <main className="app__body">
          <aside
            className={`app__sidebar${isMobile ? ' app__sidebar--drawer' : ''}${
              isMobile && drawerOpen ? ' app__sidebar--open' : ''
            }`}
            aria-hidden={isMobile && !drawerOpen}
          >
            {isMobile && (
              <button
                type="button"
                className="app__drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close trip drawer"
              >
                ×
              </button>
            )}
            <CheckpointList />
          </aside>
          {isMobile && drawerOpen && (
            <div
              className="app__backdrop"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}
          <section className="app__map">
            <MapView />
            {isMobile && !drawerOpen && (
              <button
                type="button"
                className="app__fab"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open trip drawer"
              >
                <span aria-hidden="true">📋</span> Plan trip
              </button>
            )}
          </section>
        </main>
      </div>
    </AppStateProvider>
  )
}
