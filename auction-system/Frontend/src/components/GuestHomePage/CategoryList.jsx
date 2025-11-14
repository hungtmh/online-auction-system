import React from "react";
import { useNavigate } from "react-router-dom";

// === CHUẨN: Hàm helper đặt sau import, trước component ===
// categories expected shape: [{ id, name, parent_id }]
function buildTree(list = []) {
  const map = new Map();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots = [];
  for (const c of map.values()) {
    if (c.parent_id) {
      const p = map.get(c.parent_id);
      if (p) p.children.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export default function CategoryList({ categories = [] }) {
  const navigate = useNavigate();
  const tree = buildTree(categories);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {tree.map((cat) => (
        <div key={cat.id} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="font-semibold text-gray-800 mb-2">{cat.name}</div>
          {cat.children && cat.children.length > 0 && (
            <ul className="text-sm text-gray-600 space-y-1">
              {cat.children.map((c) => (
                <li key={c.id}>
                  <button className="hover:text-blue-600" onClick={() => navigate(`/auctions?category=${c.id}`)}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
