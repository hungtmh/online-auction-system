import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GuestHomePageContent from "../components/GuestHomePage/GuestHomePageContent";
import PublicLayout from "../components/Layout/PublicLayout";
import { useDialog } from "../context/DialogContext.jsx";

function GuestHomePage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { alert } = useDialog();
  const alertShownRef = useRef(false);

  // Check URL error parameter (from Google login redirect for banned users)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorType = params.get("error");

    if (errorType === "account_banned" && !alertShownRef.current) {
      alertShownRef.current = true;
      // Clear URL parameter first
      navigate("/", { replace: true });
      // Show alert
      alert({
        icon: "🚫",
        title: "Không thể đăng nhập",
        message: "Tài khoản này đã bị chặn.",
      });
    }
  }, [location.search, navigate, alert]);

  return (
    <PublicLayout user={user}>
      <GuestHomePageContent user={user} />
    </PublicLayout>
  );
}

export default GuestHomePage;
