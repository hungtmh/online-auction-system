import React, { useState } from 'react'
import { useNavigate, createSearchParams } from 'react-router-dom'

export default function SearchBar({ initial = '' }) {
  const [q, setQ] = useState(initial)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const params = { q }
    navigate({ pathname: '/auctions', search: createSearchParams(params).toString() })
  }

  return (
    <form onSubmit={onSubmit} className="w-full flex items-center">
      <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full px-4 py-2 border rounded-l-lg outline-none" placeholder="Tìm kiếm sản phẩm..." />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-lg">Tìm</button>
    </form>
  )
}
