import { createClient } from '@supabase/supabase-js'

export const SHAME_TABLE = 'hall_of_shame'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

const demoEntries = [
  {
    id: 'demo-1',
    idea_excerpt: 'Uber for vending machines that only sell lukewarm protein shakes',
    roast_excerpt:
      'The TAM is basically gym bros with bad planning and even worse taste. Your ops complexity is doing CrossFit while the margin is taking a nap...',
    score: 2,
    verdict: 'logistics hell with a shaker bottle',
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: 'demo-2',
    idea_excerpt: 'A social network for people who want to rate parking lots',
    roast_excerpt:
      'You found a behavior nobody asked for and somehow made it less fun. The network effects are circling the drain because nobody wakes up craving asphalt discourse...',
    score: 3,
    verdict: 'pavement posting is not a moat',
    created_at: new Date(Date.now() - 1000 * 60 * 39).toISOString()
  },
  {
    id: 'demo-3',
    idea_excerpt: 'AI-generated horoscopes for enterprise compliance teams',
    roast_excerpt:
      'This is astrology wearing a lanyard. Compliance buyers want audit trails, not Mercury retrograde explaining why procurement ghosted you...',
    score: 4,
    verdict: 'weirdly fixable, still deeply cursed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'demo-4',
    idea_excerpt: 'NFT receipts for every coffee purchase',
    roast_excerpt:
      'You took the least interesting part of buying coffee and added wallet friction. Starbucks already has loyalty, payments, and distribution while you have vibes...',
    score: 1,
    verdict: 'blockchain did not need this assignment',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString()
  }
]

export async function fetchShame() {
  if (!supabase) return demoEntries

  const { data, error } = await supabase
    .from(SHAME_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Supabase shame fetch failed.', error)
    throw error
  }

  return data || []
}

export async function insertShame(entry) {
  if (!supabase) {
    return {
      ...entry,
      id: makeId(),
      created_at: new Date().toISOString()
    }
  }

  const { data, error } = await supabase.from(SHAME_TABLE).insert(entry).select().single()

  if (error) {
    console.error('Supabase shame insert failed.', error)
    throw error
  }

  return data
}

export function subscribeShame(onInsert) {
  if (!supabase) {
    return {
      unsubscribe() {}
    }
  }

  const channel = supabase
    .channel('hall_of_shame_feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: SHAME_TABLE
      },
      (payload) => {
        onInsert(payload.new)
      }
    )
    .subscribe((status) => {
      if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        console.warn('Supabase realtime status:', status)
      }
    })

  return {
    unsubscribe() {
      supabase.removeChannel(channel).catch((error) => {
        console.warn('Supabase channel cleanup failed.', error)
      })
    }
  }
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
