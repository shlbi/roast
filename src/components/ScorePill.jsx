import { replaceBannedAddressWithBro } from '../lib/parse.js'

export default function ScorePill({ score, verdict }) {
  return (
    <div className="score-row">
      <span className={`score-pill ${getScoreTone(score)}`}>{score}/10</span>
      {verdict ? <span className="score-verdict">{replaceBannedAddressWithBro(verdict)}</span> : null}
    </div>
  )
}

function getScoreTone(score) {
  if (score <= 4) return 'bad'
  if (score <= 6) return 'mid'
  if (score <= 8) return 'good'
  return 'elite'
}
