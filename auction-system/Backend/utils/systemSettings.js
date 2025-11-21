import { supabase } from '../config/supabase.js'

const CACHE_TTL_MS = 5 * 60 * 1000
let cachedSettings = new Map()
let lastLoaded = 0

const ensureCache = async () => {
  const now = Date.now()
  if (cachedSettings.size > 0 && now - lastLoaded < CACHE_TTL_MS) {
    return
  }

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')

  if (error) {
    console.warn('⚠️  Không thể tải system_settings, dùng cache cũ nếu có.', error.message)
    return
  }

  cachedSettings = new Map((data || []).map((entry) => [entry.key, entry.value]))
  lastLoaded = now
}

export const getSystemSettingValue = async (key, fallback = null) => {
  await ensureCache()
  return cachedSettings.get(key) ?? fallback
}

export const getSystemSettingMap = async (keys = []) => {
  await ensureCache()
  const result = {}
  keys.forEach((key) => {
    result[key] = cachedSettings.get(key) ?? null
  })
  return result
}
