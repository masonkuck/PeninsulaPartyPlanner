import { AppStateProvider } from './state/AppStateContext'
import { ScoreHeader } from './components/ScoreHeader'
import { TripTabs } from './components/TripTabs'
import { CheckpointList } from './components/CheckpointList'
import { MapView } from './components/MapView'
import { Settings } from './components/Settings'
import { ShareImporter } from './components/ShareImporter'
import './App.css'

export default function App() {
  return (
    <AppStateProvider>
      <ShareImporter />
      <div className="app">
        <ScoreHeader />
        <div className="app__toolbar">
          <TripTabs />
          <Settings />
        </div>
        <main className="app__body">
          <aside className="app__sidebar">
            <CheckpointList />
          </aside>
          <section className="app__map">
            <MapView />
          </section>
        </main>
      </div>
    </AppStateProvider>
  )
}
