import { useState, useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI, setAccessToken } from "../services/api";
import { useDialog } from "../context/DialogContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef(null);
  const { alert } = useDialog();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  // OTP/Verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Check URL error parameter (from Google login redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorType = params.get("error");

    if (errorType === "account_banned") {
      setError("Tài khoản đã bị chặn.");
      // Clear the URL parameter
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await authAPI.resendOTP(email);
      await alert({
        icon: "✅",
        title: "Đã gửi mã OTP",
        message: "Mã OTP mới đã được gửi! Vui lòng kiểm tra email.",
      });
      setShowOTPModal(true);
    } catch (err) {
      await alert({
        icon: "⚠️",
        title: "Không thể gửi OTP",
        message: "Vui lòng thử lại.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setError(null);

    if (otpCode.length !== 6) {
      setError("Mã OTP phải có 6 chữ số");
      setOtpLoading(false);
      return;
    }

    try {
      const data = await authAPI.verifyOTP(email, otpCode);

      if (data.success) {
        await alert({
          icon: "✅",
          title: "Xác thực thành công",
          message: "Vui lòng đăng nhập lại.",
        });
        setShowOTPModal(false);
        setNeedsVerification(false);
        setOtpCode("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không hợp lệ");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    try {
      let token = recaptchaToken;
      if (!token && recaptchaRef.current) {
        token = recaptchaRef.current.getValue();
      }
      if (!token) {
        setError("Vui lòng hoàn thành reCAPTCHA");
        setLoading(false);
        return;
      }

      const data = await authAPI.login(email, password, token);

      if (data.success) {
        setAccessToken(data.accessToken);

        const role = data.user?.role;
        console.log("🔍 Login successful, role:", role);

        // Force full page reload để App.jsx fetch lại user data
        // Bidder và Seller sau đăng nhập vào trang chủ (GuestHomePage với navbar riêng)
        switch (role) {
          case "admin":
            window.location.href = "/admin";
            break;
          case "seller":
          case "bidder":
          default:
            window.location.href = "/";
            break;
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      setError(errorData?.message || "Đăng nhập thất bại");

      if (errorData?.requireEmailVerification) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowOTPModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác thực Email</h2>
              <p className="text-gray-600">
                Nhập mã OTP đã gửi đến
                <br />
                <strong className="text-blue-600">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-center">Mã OTP (6 chữ số)</label>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} required className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl font-bold tracking-widest" placeholder="000000" autoFocus />
                <p className="text-xs text-gray-500 mt-2 text-center">⏰ Mã OTP có hiệu lực trong 10 phút</p>
              </div>

              <button type="submit" disabled={otpLoading || otpCode.length !== 6} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {otpLoading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Không nhận được mã?</p>
                <button type="button" onClick={handleResendVerification} disabled={resendLoading} className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50">
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Auction System</h1>
          <p className="text-gray-600">Đăng nhập để tiếp tục</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Google OAuth */}
          <button onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`)} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc đăng nhập bằng email</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
              {needsVerification && (
                <button onClick={handleResendVerification} disabled={resendLoading} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50">
                  {resendLoading ? "Đang gửi..." : "📧 Gửi mã OTP xác nhận"}
                </button>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="••••••••" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-blue-600 hover:text-blue-700 font-medium">
                Quên mật khẩu?
              </button>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA ref={recaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} onChange={(token) => setRecaptchaToken(token)} onExpired={() => setRecaptchaToken(null)} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Switch to Register */}
          <p className="text-center mt-6 text-gray-600">
            Chưa có tài khoản?{" "}
            <button onClick={() => navigate("/register")} className="text-blue-600 hover:text-blue-700 font-medium">
              Đăng ký ngay
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-800 text-sm">
            ← Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
