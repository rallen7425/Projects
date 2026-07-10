import { createServerSupabase } from '@/lib/supabase/server'

export async function getSavedArticles(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_saves')
    .select('*, articles(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function saveArticle(userId: string, articleId: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_saves')
    .insert({ user_id: userId, article_id: articleId })

  if (error) throw error
}

export async function unsaveArticle(userId: string, articleId: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_saves')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId)

  if (error) throw error
}

export async function isSaved(userId: string, articleId: string): Promise<boolean> {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
