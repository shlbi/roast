import { formatDistanceToNow } from 'date-fns'
import ScorePill from './ScorePill.jsx'
import { replaceBannedAddressWithBro } from '../lib/parse.js'

export default function ShameCard({ entry, isFresh }) {
  return (
    <article className={`shame-card ${isFresh ? 'fresh' : ''}`}>
      <ScorePill score={entry.score} />
      <h3>{replaceBannedAddressWithBro(entry.idea_excerpt)}</h3>
      <p className="roast-excerpt">{replaceBannedAddressWithBro(entry.roast_excerpt)}</p>
      <time dateTime={entry.created_at}>{formatRelativeTime(entry.created_at)}</time>
    </article>
  )
}

function formatRelativeTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    console.warn('Invalid Hall of Shame timestamp.', value)
    return 'just now'
  }

  return formatDistanceToNow(date, { addSuffix: true })
}
