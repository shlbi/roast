import { useCallback, useEffect, useState } from 'react'
import { fetchShame, subscribeShame } from '../lib/supabase.js'
import ShameCard from './ShameCard.jsx'
import SkeletonCard from './SkeletonCard.jsx'

export default function HallOfShame({ incomingEntry }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [freshIds, setFreshIds] = useState(() => new Set())

  const prependEntry = useCallback((entry) => {
    if (!entry?.id) return

    setEntries((currentEntries) => {
      if (currentEntries.some((currentEntry) => currentEntry.id === entry.id)) {
        return currentEntries
      }

      return [entry, ...currentEntries].slice(0, 50)
    })

    setFreshIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.add(entry.id)
      return nextIds
    })

    window.setTimeout(() => {
      setFreshIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(entry.id)
        return nextIds
      })
    }, 500)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadEntries() {
      try {
        const shameEntries = await fetchShame()
        if (mounted) {
          setEntries(shameEntries)
          setError('')
        }
      } catch (loadError) {
        console.error('Hall of Shame load workflow failed.', loadError)
        if (mounted) {
          setError("couldn't load the hall of shame. refresh and try again.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadEntries()

    const subscription = subscribeShame(prependEntry)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [prependEntry])

  useEffect(() => {
    if (incomingEntry) prependEntry(incomingEntry)
  }, [incomingEntry, prependEntry])

  return (
    <section className="hall-section" aria-labelledby="hall-title">
      <div className="hall-heading">
        <h2 id="hall-title">Hall of Fame or Hall of Shame, idk</h2>
        <p>the worst ideas ever submitted. anonymized. permanent. hilarious.</p>
      </div>

      {loading ? (
        <div className="feed-list" aria-label="Loading Hall of Fame or Hall of Shame, idk">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {!loading && error ? <p className="feed-message">{error}</p> : null}

      {!loading && !error && entries.length === 0 ? (
        <p className="feed-message">no terrible ideas yet. be the first. we dare you.</p>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <div className="feed-list">
          {entries.map((entry) => (
            <ShameCard key={entry.id} entry={entry} isFresh={freshIds.has(entry.id)} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
