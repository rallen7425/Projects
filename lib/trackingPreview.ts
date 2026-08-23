// Shared tracked-topic preview logic for Home/Summary's Tracking section and
// the dedicated /tracking page. A tracked topic's "zone" should be the zone
// it was explicitly tracked from (`user_tracks.zone_id`), not whichever zone
// happens to have the most recent unrelated article mentioning the topic —
// the previous unscoped-search approach let e.g. a Sports-related topic show
// a Local badge just because a local outlet's article happened to be newer.
// Same "explicit zone_id wins" pattern already used by the Zone Detail
// page's own tracking fetch (fetchZoneTracking).

import { searchArticlesByTopic } from './db/articles'
import { toArticleDisplay, dedupeStories } from './articleUtils'
import { resolveTrackedTopicZone, type ZoneRef } from './trackedTopicZone'
import type { ArticleDisplay, ZoneType } from '@/types'

export type { ZoneRef } from './trackedTopicZone'
export { resolveTrackedTopicZone } from './trackedTopicZone'

export type TrackedTopicRow = { id: string; topic: string; zone_id: string | null; created_at: string }

export type TrackingPreview = {
  id: string
  topic: string
  createdAt: string
  zoneType: ZoneType | null
  article: ArticleDisplay | null
  articles: ArticleDisplay[]
  articleCount: number
}

export async function getTrackingPreview(topicRow: TrackedTopicRow, zones: ZoneRef[], limit = 10): Promise<TrackingPreview> {
  const explicitType = resolveTrackedTopicZone(topicRow.zone_id, zones)
  let matches = await searchArticlesByTopic(topicRow.topic, limit, 30, explicitType ?? undefined).catch(() => [])

  // A topic's real coverage doesn't always live in the zone_type it's
  // editorially tracked under — e.g. "Roman Anthony" (a Red Sox prospect,
  // tracked under Sports) is only ever covered by Boston/Maine local papers,
  // so every matching article in the DB is tagged zone_type='local'. Scoping
  // strictly to the explicit zone would make a genuinely active topic look
  // dead. Fall back to an unscoped search when the scoped one is empty —
  // the badge still shows the topic's real zone, only the article pool widens.
  if (explicitType && matches.length === 0) {
    matches = await searchArticlesByTopic(topicRow.topic, limit, 30).catch(() => [])
  }

  const displays = dedupeStories(matches.map(toArticleDisplay))

  return {
    id: topicRow.id,
    topic: topicRow.topic,
    createdAt: topicRow.created_at,
    // Falls back to the best match's own zone only when the topic has no
    // explicit zone_id at all — an untracked-from-a-zone topic still needs
    // *some* color to render with.
    zoneType: explicitType ?? displays[0]?.zoneType ?? null,
    article: displays[0] ?? null,
    articles: displays.slice(0, 3),
    articleCount: displays.length,
  }
}
