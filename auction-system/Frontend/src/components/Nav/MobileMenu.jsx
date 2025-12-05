import React from 'react'
import { useNavigate } from 'react-router-dom'
import useCategories from '../../hooks/useCategories'

export default function MobileMenu({ open = false, onClose = () => {} }) {
  const { categories, loading } = useCategories()
  const navigate = useNavigate()

  function buildTree(list = []) {
    const map = new Map()
    list.forEach((c) => map.set(c.id, { ...c, children: [] }))
    const roots = []
    for (const c of map.values()) {
      if (c.parent_id) {
        const p = map.get(c.parent_id)
        if (p) p.children.push(c)
        else roots.push(c)
      } else roots.push(c)
    }
    return roots
  }

  const tree = buildTree(categories || [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">Danh mục</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">Đóng</button>
        </div>

        <div className="p-4">
          {loading && <div>Loading...</div>}
          {!loading && (
            <ul className="space-y-2">
              {tree.map((p) => (
                <li key={p.id}>
                  <div className="font-medium px-2 py-2">{p.name}</div>
                  {p.children && p.children.length > 0 && (
                    <ul className="pl-4">
                      {p.children.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => {
                              navigate({ pathname: '/auctions', search: `?category=${c.id}` })
                              onClose()
                            }}
                            className="w-full text-left px-2 py-2 rounded hover:bg-gray-50"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="w-full h-full" onClick={onClose} />
    </div>
  )
}
