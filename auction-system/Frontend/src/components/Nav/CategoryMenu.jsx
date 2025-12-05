import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useCategories from '../../hooks/useCategories'

function buildTree(list = []) {
  const map = new Map()
  list.forEach((c) => map.set(c.id, { ...c, children: [] }))
  const roots = []
  for (const c of map.values()) {
    if (c.parent_id) {
      const p = map.get(c.parent_id)
      if (p) p.children.push(c)
      else roots.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

export default function CategoryMenu({ onSelect } = {}) {
  const { categories, loading } = useCategories()
  const tree = useMemo(() => buildTree(categories), [categories])
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const activeCategory = params.get('category')

  const [openParent, setOpenParent] = useState(null)

  function handleSelect(catId) {
    if (onSelect) onSelect(catId)
    navigate({ pathname: '/auctions', search: `?category=${catId}` })
  }

  if (loading) return <div className="py-4">Loading categories...</div>

  return (
    <nav aria-label="Danh mục" className="w-full">
      <ul className="flex gap-4 flex-wrap">
        {tree.map((parent) => (
          <li key={parent.id} className="relative group">
            <button
              onMouseEnter={() => setOpenParent(parent.id)}
              onMouseLeave={() => setOpenParent(null)}
              onClick={() => parent.children?.length === 0 && handleSelect(parent.id)}
              className={`px-3 py-2 rounded-md ${activeCategory === String(parent.id) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              {parent.name}
            </button>

            {parent.children && parent.children.length > 0 && (
              <div
                onMouseEnter={() => setOpenParent(parent.id)}
                onMouseLeave={() => setOpenParent(null)}
                className={`absolute left-0 mt-2 bg-white border rounded shadow-lg z-50 ${openParent === parent.id ? 'block' : 'hidden'} min-w-[200px]`}
              >
                <ul className="p-2">
                  {parent.children.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => handleSelect(c.id)} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${activeCategory === String(c.id) ? 'bg-blue-50 text-blue-700' : ''}`}>
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
