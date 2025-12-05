import { useState, useEffect } from 'react'
import guestAPI from '../services/guestAPI'

export default function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await guestAPI.getCategories()
        // guestAPI returns { success, data }
        const data = res?.data || res || []
        if (mounted) setCategories(data)
      } catch (err) {
        if (mounted) setError(err?.message || 'Lỗi khi tải danh mục')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { categories, loading, error }
}
