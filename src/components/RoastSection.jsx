import { useEffect, useRef, useState } from 'react'
import { callRoastAPI, ROAST_ERROR_MESSAGE } from '../lib/kimi.js'
import { insertShame } from '../lib/supabase.js'
import { truncateAtWord } from '../lib/parse.js'
import ChatBubble from './ChatBubble.jsx'
import ScorePill from './ScorePill.jsx'

const MIN_IDEA_LENGTH = 10
const MAX_IDEA_LENGTH = 1000
const STREAM_CHARS_PER_TICK = 2
const STREAM_TICK_MS = 18

export default function RoastSection({ onEntryAdded, onMascotStateChange }) {
  const [idea, setIdea] = useState('')
  const [submittedIdea, setSubmittedIdea] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingRoastText, setStreamingRoastText] = useState('')
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [shameStatus, setShameStatus] = useState('idle')
  const mascotTimerRef = useRef(null)
  const streamQueueRef = useRef('')
  const streamIntervalRef = useRef(null)

  const charsUsed = idea.length
  const isNearLimit = charsUsed > 900
  const streamingDisplayText = stripLiveScoreLine(streamingRoastText)

  useEffect(() => {
    return () => {
      window.clearTimeout(mascotTimerRef.current)
      clearStreamQueue()
    }
  }, [])

  function setMascotState(state) {
    onMascotStateChange?.(state)
  }

  function scheduleResultMascotState(score) {
    window.clearTimeout(mascotTimerRef.current)
    setMascotState('roasting')
    mascotTimerRef.current = window.setTimeout(() => {
      if (score >= 7) {
        setMascotState('good')
      } else if (score <= 4) {
        setMascotState('cooked')
      } else {
        setMascotState('idle')
      }
    }, 1000)
  }

  function enqueueStreamText(text) {
    if (!text) return

    streamQueueRef.current += text

    if (streamIntervalRef.current) return

    streamIntervalRef.current = window.setInterval(() => {
      const nextText = streamQueueRef.current.slice(0, STREAM_CHARS_PER_TICK)

      if (!nextText) {
        clearStreamInterval()
        return
      }

      streamQueueRef.current = streamQueueRef.current.slice(STREAM_CHARS_PER_TICK)
      setStreamingRoastText((currentText) => currentText + nextText)
    }, STREAM_TICK_MS)
  }

  function flushStreamQueue() {
    clearStreamInterval()

    if (!streamQueueRef.current) return

    setStreamingRoastText((currentText) => currentText + streamQueueRef.current)
    streamQueueRef.current = ''
  }

  function clearStreamQueue() {
    clearStreamInterval()
    streamQueueRef.current = ''
  }

  function clearStreamInterval() {
    if (!streamIntervalRef.current) return

    window.clearInterval(streamIntervalRef.current)
    streamIntervalRef.current = null
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedIdea = idea.trim()

    if (trimmedIdea.length < MIN_IDEA_LENGTH) {
      setValidationError('say more than that bro')
      return
    }

    if (trimmedIdea.length > MAX_IDEA_LENGTH) {
      setValidationError('too much. trim it down.')
      return
    }

    setValidationError('')
    setApiError('')
    setStreamingRoastText('')
    clearStreamQueue()
    setResult(null)
    setShameStatus('idle')
    setSubmittedIdea(trimmedIdea)
    setIsLoading(true)
    setMascotState('typing')

    try {
      const roast = await callRoastAPI(trimmedIdea, { onText: enqueueStreamText })
      flushStreamQueue()
      setResult(roast)
      scheduleResultMascotState(roast.score)
    } catch (error) {
      console.error('Roast workflow failed.', error)
      setStreamingRoastText('')
      clearStreamQueue()
      setApiError(ROAST_ERROR_MESSAGE)
      setMascotState('idle')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddToShame() {
    if (!result || !submittedIdea) return

    setShameStatus('adding')
    setMascotState('shame')

    try {
      const inserted = await insertShame({
        idea_excerpt: truncateAtWord(submittedIdea, 120),
        roast_excerpt: truncateAtWord(result.roastBody, 200),
        score: result.score,
        verdict: result.verdict
      })

      setShameStatus('added')
      onEntryAdded(inserted)
    } catch (error) {
      console.error('Hall of Shame insert workflow failed.', error)
      setShameStatus('error')
    }
  }

  const showShameButton = result?.score <= 4
  const shameButtonLabel =
    shameStatus === 'adding'
      ? 'adding...'
      : shameStatus === 'added'
        ? 'added to the wall of shame'
        : shameStatus === 'error'
          ? 'failed to add, try again'
          : 'add to the Hall of Shame'

  return (
    <section className="roast-section" aria-labelledby="roast-title">
      <div className="section-heading">
        <p className="eyebrow">founder therapy, but hostile</p>
        <h2 id="roast-title">Submit your startup idea</h2>
      </div>

      <form className="roast-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="startup-idea">
          Describe your startup idea
        </label>
        <textarea
          id="startup-idea"
          value={idea}
          maxLength={MAX_IDEA_LENGTH + 200}
          onChange={(event) => {
            setIdea(event.target.value)
            if (validationError) setValidationError('')
          }}
          placeholder="describe your startup idea..."
          disabled={isLoading}
        />

        <div className="form-footer">
          <div>
            <p className={`char-counter ${isNearLimit ? 'danger' : ''}`}>{charsUsed}/1000</p>
            {validationError ? <p className="inline-error">{validationError}</p> : null}
          </div>
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      <div className="chat-zone" aria-live="polite">
        {submittedIdea ? <ChatBubble role="user" content={submittedIdea} /> : null}
        {apiError ? <ChatBubble role="bot" content={apiError} tone="error" /> : null}

        {isLoading && !result && streamingDisplayText ? (
          <div className="result-block">
            <ChatBubble role="bot" content={streamingDisplayText} tone="streaming" />
          </div>
        ) : null}

        {result ? (
          <div className="result-block">
            <ChatBubble role="bot" content={result.roastBody} />
            <ScorePill score={result.score} verdict={result.verdict} />
            {showShameButton ? (
              <button
                className="secondary-button"
                type="button"
                disabled={shameStatus === 'adding' || shameStatus === 'added'}
                onClick={handleAddToShame}
              >
                {shameButtonLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function stripLiveScoreLine(text) {
  return text.replace(/\n*SCORE:[\s\S]*$/i, '').trimEnd()
}
