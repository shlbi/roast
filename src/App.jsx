import { useState } from 'react'
import RoastSection from './components/RoastSection.jsx'
import HallOfShame from './components/HallOfShame.jsx'
import Mascot from './components/Mascot.jsx'

export default function App() {
  const [incomingEntry, setIncomingEntry] = useState(null)
  const [mascotState, setMascotState] = useState('idle')

  return (
    <main className="app-shell">
      <header className="site-header" aria-label="PivotOrPerish">
        <div className="brand-lockup">
          <PixelGavelIcon />
          <div>
            <h1>PivotOrPerish</h1>
            <p>drop your idea. we will not be nice.</p>
          </div>
        </div>
      </header>

      <div className="main-grid">
        <Mascot state={mascotState} />
        <div className="work-column">
          <RoastSection onEntryAdded={setIncomingEntry} onMascotStateChange={setMascotState} />
        </div>
      </div>

      <HallOfShame incomingEntry={incomingEntry} />
    </main>
  )
}

function PixelGavelIcon() {
  return (
    <svg
      className="brand-icon"
      width="20"
      height="20"
      viewBox="0 0 10 10"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path fill="#FF3B3B" d="M2 1h4v2H2zM1 3h6v2H1zM6 5h2v2H6zM7 7h2v2H7z" />
    </svg>
  )
}
