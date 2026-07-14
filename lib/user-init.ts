import { createServiceClient } from '@/lib/supabase/service'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'
import type { Json } from '@/types/supabase'

export async function initializeNewUser(userId: string, zipCode?: string) {
  const supabase = createServiceClient()

  const defaultTemplates = ['news', 'tech']
  if (zipCode) defaultTemplates.unshift('local')

  const zones = defaultTemplates.map((key) => {
    const template = ZONE_TEMPLATES[key]
    return {
      user_id: userId,
      type: template.type,
      template_id: key,
      config: zipCode ? { zip_code: zipCode } : {},
      position: template.position,
      enabled: true,
    }
  })

  const { error } = await supabase.from('zones').insert(zones)
  if (error) throw error
}

export async function addZoneFromTemplate(
  userId: string,
  templateKey: string,
  config?: Json
) {
  const template = ZONE_TEMPLATES[templateKey]
  if (!template) throw new Error(`Unknown zone template: ${templateKey}`)

  const supabase = createServiceClient()

  // Get current max position for this user
  const { data: existing } = await supabase
    .from('zones')
    .select('position')
    .eq('user_id', userId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing?.[0] ? existing[0].position + 1 : template.position

  const { error } = await supabase.from('zones').insert({
    user_id: userId,
    type: template.type,
    template_id: templateKey,
    config: config ?? {},
    position: nextPosition,
    enabled: true,
  })

  if (error) throw error
}
