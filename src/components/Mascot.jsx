import { useEffect, useRef } from 'react'

const SIZE = 64
const COLORS = {
  wig: '#F5F5DC',
  robe: '#1A1A1A',
  face: '#FDBCB4',
  gavel: '#8B4513',
  chair: '#8B7355',
  eyes: '#1A1A1A',
  accent: '#FF3B3B',
  sweat: '#38BDF8'
}

export default function Mascot({ state = 'idle' }) {
  const canvasRef = useRef(null)
  const stateStartedAtRef = useRef(0)
  const previousStateRef = useRef(state)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return undefined

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame = 0

    context.imageSmoothingEnabled = false

    function render(now) {
      if (previousStateRef.current !== state) {
        previousStateRef.current = state
        stateStartedAtRef.current = now
      }

      drawJudge(context, state, now - stateStartedAtRef.current, motionQuery.matches)

      if (!motionQuery.matches) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    render(performance.now())

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [state])

  return (
    <aside className="mascot-panel" aria-label="The Judge">
      <canvas
        ref={canvasRef}
        className="mascot-canvas"
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label="Pixel art judge mascot"
      />
      <p>The Judge</p>
    </aside>
  )
}

function drawJudge(context, state, elapsed, reduceMotion) {
  const motionElapsed = reduceMotion ? 0 : elapsed
  const breathingOffset =
    state === 'idle' && !reduceMotion && Math.floor(motionElapsed / 750) % 2 ? -1 : 0
  const typingLean = state === 'typing' ? 2 : 0
  const cookedLean = state === 'cooked' ? -2 : 0
  const bodyX = typingLean + cookedLean
  const bodyY = breathingOffset
  const slamOffset = getSlamOffset(state, motionElapsed, reduceMotion)

  context.clearRect(0, 0, SIZE, SIZE)

  drawChair(context)
  drawBody(context, bodyX, bodyY, state)
  drawHead(context, bodyX, bodyY, state)
  drawArmsAndGavel(context, bodyX, bodyY, state, slamOffset)
}

function drawChair(context) {
  rect(context, COLORS.chair, 15, 21, 34, 35)
  rect(context, COLORS.chair, 12, 28, 5, 23)
  rect(context, COLORS.chair, 47, 28, 5, 23)
  rect(context, COLORS.chair, 18, 52, 28, 5)
  rect(context, COLORS.accent, 19, 24, 26, 2)
}

function drawBody(context, x, y, state) {
  rect(context, COLORS.robe, 22 + x, 34 + y, 20, 18)
  rect(context, COLORS.accent, 30 + x, 34 + y, 4, 15)
  rect(context, COLORS.robe, 19 + x, 38 + y, 6, 12)
  rect(context, COLORS.robe, 39 + x, 38 + y, 6, 12)

  if (state === 'cooked') {
    rect(context, COLORS.robe, 23 + x, 40 + y, 17, 2)
    rect(context, COLORS.robe, 25 + x, 42 + y, 15, 2)
    rect(context, COLORS.face, 24 + x, 40 + y, 2, 2)
    rect(context, COLORS.face, 38 + x, 42 + y, 2, 2)
  }
}

function drawHead(context, x, y, state) {
  const headX = 24 + x
  const headY = 20 + y
  const eyesTall = state === 'typing' ? 3 : 2

  drawWig(context, x, y, state)
  rect(context, COLORS.face, headX, headY, 16, 14)
  rect(context, COLORS.eyes, headX + 4, headY + 5, 2, eyesTall)
  rect(context, COLORS.eyes, headX + 10, headY + 5, 2, eyesTall)
  rect(context, COLORS.eyes, headX + 5, headY + 11, 6, 1)

  if (state === 'good') {
    rect(context, COLORS.sweat, headX + 14, headY + 3, 2, 3)
  }
}

function drawWig(context, x, y, state) {
  const wigX = 21 + x
  const wigY = 15 + y

  if (state === 'good') {
    context.save()
    context.translate(wigX + 11, wigY + 4)
    context.rotate((5 * Math.PI) / 180)
    context.translate(-(wigX + 11), -(wigY + 4))
    drawWigPixels(context, wigX, wigY)
    context.restore()
    return
  }

  drawWigPixels(context, wigX, wigY)
}

function drawWigPixels(context, x, y) {
  rect(context, COLORS.wig, x, y, 22, 6)
  rect(context, COLORS.wig, x - 2, y + 4, 4, 7)
  rect(context, COLORS.wig, x + 20, y + 4, 4, 7)
  rect(context, COLORS.wig, x + 3, y - 2, 4, 3)
  rect(context, COLORS.wig, x + 9, y - 3, 4, 4)
  rect(context, COLORS.wig, x + 15, y - 2, 4, 3)
}

function drawArmsAndGavel(context, x, y, state, slamOffset) {
  if (state === 'cooked') return

  rect(context, COLORS.face, 17 + x, 39 + y, 4, 5)

  if (state === 'shame') {
    rect(context, COLORS.robe, 39 + x, 34 + y, 12, 4)
    rect(context, COLORS.face, 50 + x, 34 + y, 4, 3)
    rect(context, COLORS.gavel, 48 + x, 31 + y, 9, 3)
    rect(context, COLORS.gavel, 51 + x, 34 + y, 2, 8)
    return
  }

  const gavelRaise = state === 'typing' ? -2 : 0
  const gavelY = y + gavelRaise + slamOffset

  rect(context, COLORS.robe, 39 + x, 36 + y, 6, 8)
  rect(context, COLORS.face, 43 + x, 37 + y, 3, 4)
  rect(context, COLORS.gavel, 45 + x, 28 + gavelY, 3, 15)
  rect(context, COLORS.gavel, 41 + x, 27 + gavelY, 11, 4)
}

function getSlamOffset(state, elapsed, reduceMotion) {
  if (reduceMotion) return 0

  if (state === 'roasting') {
    const cycle = elapsed % 300
    if (cycle < 200) return -Math.round((cycle / 200) * 8)
    return -Math.round((1 - (cycle - 200) / 100) * 8)
  }

  if (state === 'cooked' && elapsed < 300) {
    if (elapsed < 200) return -Math.round((elapsed / 200) * 8)
    return -Math.round((1 - (elapsed - 200) / 100) * 8)
  }

  return 0
}

function rect(context, color, x, y, width, height) {
  context.fillStyle = color
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
}
