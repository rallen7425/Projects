import { createServiceClient } from '@/lib/supabase/service'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'

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
