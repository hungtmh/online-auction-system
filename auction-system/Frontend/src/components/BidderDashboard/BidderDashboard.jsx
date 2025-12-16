import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../../services/api";
import PublicLayout from "../Layout/PublicLayout";
import ProfileSection from "./sections/ProfileSection";
import MyBidsSection from "./sections/MyBidsSection";
import WatchlistSection from "./sections/WatchlistSection";
import PasswordSection from "./sections/PasswordSection";

const TAB_TITLES = {
  profile: "Hồ sơ cá nhân",
  "my-bids": "Lịch sử đấu giá",
  watchlist: "Danh sách yêu thích",
  password: "Đổi mật khẩu",
};

const DEFAULT_TAB = "profile";

function BidderDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Get activeTab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/profile")) return "profile";
    if (path.includes("/my-bids")) return "my-bids";
    if (path.includes("/watchlist")) return "watchlist";
    if (path.includes("/password")) return "password";
    return DEFAULT_TAB;
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileSync = (profile) => {
    setUser((prev) => ({
      ...prev,
      full_name: profile?.full_name ?? prev?.full_name,
      avatar_url: profile?.avatar_url ?? prev?.avatar_url,
    }));
  };

  const renderTabContent = () => {
    if (activeTab === "profile") {
      return <ProfileSection user={user} onProfileChange={handleProfileSync} />;
    }

    if (activeTab === "my-bids") {
      return <MyBidsSection />;
    }

    if (activeTab === "watchlist") {
      return <WatchlistSection />;
    }

    if (activeTab === "password") {
      return <PasswordSection />;
    }

    return null;
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PublicLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{TAB_TITLES[activeTab] || "Bảng điều khiển"}</h1>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">{renderTabContent()}</div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default BidderDashboard;
