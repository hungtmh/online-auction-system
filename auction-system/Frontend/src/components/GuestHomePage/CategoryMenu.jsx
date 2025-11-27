import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CategoryMenu({ categories = [] }) {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(null);

  // Tổ chức categories theo parent-child (2 cấp)
  const parentCategories = categories.filter((cat) => !cat.parent_id);
  const childCategories = categories.filter((cat) => cat.parent_id);

  const getChildren = (parentId) => {
    return childCategories.filter((cat) => cat.parent_id === parentId);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/auctions?category=${categoryId}`);
    setOpenCategory(null);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 h-12">
          <button
            onClick={() => navigate("/auctions")}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
          >
            Tất cả sản phẩm
          </button>

          {parentCategories.map((parent) => {
            const children = getChildren(parent.id);
            const hasChildren = children.length > 0;

            return (
              <div
                key={parent.id}
                className="relative"
                onMouseEnter={() => hasChildren && setOpenCategory(parent.id)}
                onMouseLeave={() => setOpenCategory(null)}
              >
                <button
                  onClick={() => handleCategoryClick(parent.id)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                >
                  <span>{parent.name}</span>
                  {hasChildren && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>

                {/* Dropdown menu cho subcategories */}
                {hasChildren && openCategory === parent.id && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      {parent.name}
                    </div>
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleCategoryClick(child.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
