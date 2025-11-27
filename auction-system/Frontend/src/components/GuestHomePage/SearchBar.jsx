import React, { useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";

export default function SearchBar({ initial = "" }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    const params = { q: q.trim() };
    navigate({ pathname: "/auctions", search: createSearchParams(params).toString() });
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex items-center gap-0">
        <div className="flex-1 relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tìm kiếm sản phẩm đấu giá..."
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-r-lg hover:bg-blue-700 transition">
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}
