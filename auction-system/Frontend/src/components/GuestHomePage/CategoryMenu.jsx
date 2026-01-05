import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CategoryMenu({ categories = [] }) {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 }); // State lưu vị trí menu
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollRef = useRef(null);

  const parentCategories = categories.filter((cat) => !cat.parent_id);
  const childCategories = categories.filter((cat) => cat.parent_id);

  const getChildren = (parentId) => {
    return childCategories.filter((cat) => cat.parent_id === parentId);
  };

  const handleCategoryClick = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      // If no category (clicked "Tất cả"), clear all filters
      navigate(`/auctions`);
    } else if (category.parent_id) {
      // If it's a CHILD category, set both parent_category and category
      navigate(`/auctions?parent_category=${category.parent_id}&category=${categoryId}`);
    } else {
      // If it's a PARENT category, set only parent_category
      navigate(`/auctions?parent_category=${categoryId}`);
    }

    setOpenCategory(null);
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  // Hàm xử lý khi hover vào danh mục cha
  const handleMouseEnter = (e, categoryId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Tính toán vị trí hiển thị dropdown dựa trên vị trí của nút cha trên màn hình
    setDropdownPos({
      top: rect.bottom,
      left: rect.left,
    });
    setOpenCategory(categoryId);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll); // Thêm resize để check lại arrow
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [categories]);

  // Đóng menu khi cuộn trang chính để tránh menu bị trôi lơ lửng
  useEffect(() => {
    const handleScroll = () => setOpenCategory(null);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <>
            <div className="absolute left-4 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-20" />
            <button onClick={() => scroll("left")} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md transition">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}

        <div className="relative">
          <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center space-x-1 h-12 min-w-max">
              <button onClick={() => navigate("/auctions")} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition whitespace-nowrap">
                Tất cả sản phẩm
              </button>

              {parentCategories.map((parent) => {
                const children = getChildren(parent.id);
                const hasChildren = children.length > 0;

                return (
                  <div
                    key={parent.id}
                    className="relative"
                    // Xử lý sự kiện chuột tại đây
                    onMouseEnter={(e) => hasChildren && handleMouseEnter(e, parent.id)}
                    onMouseLeave={() => setOpenCategory(null)}>
                    <button onClick={() => handleCategoryClick(parent.id)} className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition whitespace-nowrap ${openCategory === parent.id ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
                      <span>{parent.name}</span>
                      {hasChildren && (
                        <svg className={`w-4 h-4 transition-transform ${openCategory === parent.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* MENU DROPDOWN - SỬ DỤNG FIXED POSITON */}
                    {hasChildren && openCategory === parent.id && (
                      <div
                        className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]"
                        style={{
                          top: `${dropdownPos.top + 8}px`, // +8px tạo khoảng cách nhỏ
                          left: `${dropdownPos.left}px`,
                        }}
                        // Quan trọng: Khi hover vào menu con thì không được đóng menu
                        onMouseEnter={() => setOpenCategory(parent.id)}
                        onMouseLeave={() => setOpenCategory(null)}>
                        {/* Invisible bridge: Cầu nối vô hình để chuột không bị lọt khe giữa nút và menu */}
                        <div className="absolute top-[-20px] left-0 w-full h-[20px] bg-transparent" />

                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{parent.name}</div>
                        {children.map((child) => (
                          <button key={child.id} onClick={() => handleCategoryClick(child.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
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
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <>
            <div className="absolute right-4 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-20" />
            <button onClick={() => scroll("right")} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-md transition">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}
