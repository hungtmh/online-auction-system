export default function AppFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Về chúng tôi */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              AuctionHub
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">Nền tảng đấu giá trực tuyến hàng đầu Việt Nam. Mua bán nhanh chóng, an toàn và minh bạch.</p>
          </div>

          {/* Links */}
          <div>
            <h5 className="text-white font-semibold mb-4">Về chúng tôi</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#about" className="hover:text-white transition">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="/#contact" className="hover:text-white transition">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="/#news" className="hover:text-white transition">
                  Tin tức
                </a>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h5 className="text-white font-semibold mb-4">Hỗ trợ</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#help" className="hover:text-white transition">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a href="/#terms" className="hover:text-white transition">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="/#privacy" className="hover:text-white transition">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Tech Stack */}
          <div>
            <h5 className="text-white font-semibold mb-4">Theo dõi chúng tôi</h5>
            <div className="flex gap-4 text-2xl mb-6">
              <a href="#" className="hover:text-blue-400 transition" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="hover:text-pink-400 transition" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="hover:text-blue-300 transition" aria-label="Twitter">
                🐦
              </a>
            </div>
            <div className="text-xs text-gray-500">
              <p className="mb-1">Tech Stack:</p>
              <p>React • Vite • Express.js</p>
              <p>PostgreSQL • Supabase</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p className="mb-2">
            &copy; 2025 AuctionHub by <span className="text-blue-400 font-semibold">Tây Du Ký Team</span>. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">Đồ án cuối kỳ môn Phát triển Ứng dụng Web - PTUDW</p>
        </div>
      </div>
    </footer>
  );
}
3;
