const InfoBanner = () => (
  <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
    <p className="font-semibold">Yêu cầu khi đăng sản phẩm:</p>
    <ul className="mt-2 list-disc pl-5">
      <li>Tối thiểu 3 ảnh, dung lượng &lt; 5MB mỗi ảnh.</li>
      <li>Mô tả sản phẩm hỗ trợ WYSIWYG, mô tả gốc không thay đổi khi bổ sung.</li>
      <li>Hệ thống tự gia hạn thêm 10 phút nếu có bid mới trước 5 phút cuối.</li>
    </ul>
  </div>
)

export default InfoBanner
