import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { encodeTripToUrl } from '../lib/share'

export function ShareButton() {
  const { activeTrip } = useAppState()
  const [copied, setCopied] = useState(false)

  if (!activeTrip || activeTrip.stops.length === 0) return null

  const handleShare = async () => {
    const url = encodeTripToUrl(
      activeTrip.name,
      activeTrip.stops.map((s) => s.checkpointId),
    )
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy this share link:', url)
    }
  }

  return (
    <button type="button" className="share-btn" onClick={handleShare}>
      {copied ? '✓ Copied!' : '🔗 Share trip'}
    </button>
  )
}
