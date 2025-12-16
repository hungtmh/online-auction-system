import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import guestAPI from "../services/guestAPI";
import PublicLayout from "../components/Layout/PublicLayout";
import MyProductsSection from "../components/Seller/MyProductsSection";
import ProductCreation from "../components/Seller/ProductCreation/ProductCreation";

const TAB_TITLES = {
  "my-products": "Sản phẩm của tôi",
  "add-product": "Đăng sản phẩm mới",
};

const TAB_CONFIG = [
  { id: "my-products", label: "📦 Sản phẩm của tôi" },
  { id: "add-product", label: "➕ Đăng sản phẩm" },
];

const DEFAULT_ACTIVE_TAB = "my-products";

function SellerDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Get activeTab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/my-products")) return "my-products";
    if (path.includes("/add-product")) return "add-product";
    return DEFAULT_ACTIVE_TAB;
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authAPI.getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await guestAPI.getCategories();
        const payload = response?.data || response?.categories || [];
        setCategories(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchProfile();
    fetchCategories();
  }, []);

  const handleTabChange = (tab) => {
    if (!tab || tab === activeTab) return;
    navigate(`/seller/${tab}`);
  };

  const renderTabContent = () => {
    if (activeTab === "my-products") {
      return <MyProductsSection />;
    }

    if (activeTab === "add-product") {
      return <ProductCreation categories={categories} loadingCategories={loadingCategories} />;
    }

    return (
      <div className="text-center py-12 text-gray-500">
        <p>Tính năng đang được phát triển.</p>
      </div>
    );
  };

  const goToMarketplace = () => {
    navigate("/auctions");
  };

  return (
    <PublicLayout user={user}>
      <div className="min-h-screen bg-slate-50">
        <main className="container mx-auto px-6 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">KHU VỰC</p>
              <h2 className="text-2xl font-semibold text-slate-800">{TAB_TITLES[activeTab] || "Quản lý"}</h2>
            </div>
            <button type="button" onClick={goToMarketplace} className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700">
              <span role="img" aria-hidden="true">
                🚀
              </span>
              Khám phá
            </button>
          </div>

          <section className="rounded-xl bg-white p-6 shadow-md">{renderTabContent()}</section>
        </main>
      </div>
    </PublicLayout>
  );
}

export default SellerDashboardPage;
