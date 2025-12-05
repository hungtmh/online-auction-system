import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { authAPI } from "../services/api";

// Tạm thời bỏ qua reCAPTCHA trong development
const isDevelopment = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost')

function RegisterPage() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [step, setStep] = useState("register"); // 'register' | 'verify-otp'
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      setLoading(false);
      return;
    }

    // Validate reCAPTCHA (tạm thời bỏ qua trong development)
    if (!isDevelopment && !recaptchaToken) {
      setError('Vui lòng xác nhận bạn không phải là robot!')
      setLoading(false)
      return
    }

    try {
      // Gọi Backend API
      const data = await authAPI.register(formData.email, formData.password, formData.fullName, formData.address, recaptchaToken);

      if (data.success) {
        // Chuyển sang bước nhập OTP
        setStep("verify-otp");
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
      // Reset reCAPTCHA khi lỗi
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (otpCode.length !== 6) {
      setError("Mã OTP phải có 6 chữ số");
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.verifyOTP(formData.email, otpCode);

      if (data.success) {
        setSuccess(true);
        // Chuyển về login sau 2s
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.resendOTP(formData.email);
      alert("✅ Mã OTP mới đã được gửi! Vui lòng kiểm tra email.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công!</h3>
          <p className="text-gray-600 mb-4">
            ✅ Tài khoản <strong>{formData.email}</strong> đã được kích hoạt.
          </p>
          <p className="text-sm text-gray-500">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  // OTP Verification screen
  if (step === "verify-otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          {/* Close button */}
          <button onClick={() => navigate("/")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>

          {/* Header */}
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
              <strong className="text-blue-600">{formData.email}</strong>
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-center">Mã OTP (6 chữ số)</label>
              <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} required className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl font-bold tracking-widest" placeholder="000000" autoFocus />
              <p className="text-xs text-gray-500 mt-2 text-center">⏰ Mã OTP có hiệu lực trong 10 phút</p>
            </div>

            <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Đang xác thực..." : "Xác thực OTP"}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Không nhận được mã?</p>
              <button type="button" onClick={handleResendOTP} disabled={loading} className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50">
                Gửi lại mã OTP
              </button>
            </div>
          </form>

          {/* Back button */}
          <button onClick={() => setStep("register")} className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm">
            ← Quay lại đăng ký
          </button>
        </div>
      </div>
    );
  }

  // Register form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button onClick={() => navigate("/")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký</h2>
          <p className="text-gray-600">Tạo tài khoản để bắt đầu đấu giá!</p>
        </div>

        {/* Google OAuth */}
        <button onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`)} className="w-full border-2 border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-2 mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng ký với Google
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">hoặc đăng ký bằng email</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="Nguyễn Văn A" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="your@email.com" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Địa chỉ</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="123 Đường ABC, Quận XYZ, TP.HCM" />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="••••••••" />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="••••••••" />
          </div>

          <div className="flex items-start">
            <input type="checkbox" required className="mt-1 mr-2" />
            <label className="text-sm text-gray-600">
              Tôi đồng ý với{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Chính sách bảo mật
              </a>
            </label>
          </div>

          {/* reCAPTCHA - Tạm thời ẩn trong development */}
          {!isDevelopment && (
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {/* Switch to login */}
        <p className="text-center mt-4 text-gray-600 text-sm">
          Đã có tài khoản?{" "}
          <button onClick={() => navigate("/login")} className="text-blue-600 hover:text-blue-700 font-medium">
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
