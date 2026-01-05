const ProductReviewStep = ({
  formData,
  errors,
  categoryOptions,
  submitting,
  onBack,
  onSubmit,
  onAgreementToggle
}) => {
  // Tìm category đầy đủ để hiển thị cả cha và con
  const selectedCategory = categoryOptions.find((item) => item.id === formData.category_id)
  const parentCategory = formData.parent_category_id 
    ? categoryOptions.find((item) => item.id === formData.parent_category_id)
    : null
  
  const categoryDisplay = selectedCategory 
    ? (parentCategory ? `${parentCategory.label} > ${selectedCategory.label}` : selectedCategory.label)
    : '—'

  return (
  <div className="space-y-6">
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-4 text-lg font-semibold text-slate-700">Thông tin sản phẩm</h3>
      <dl className="grid gap-4 md:grid-cols-2">
        <InfoRow label="Tên sản phẩm" value={formData.name} />
        <InfoRow
          label="Danh mục"
          value={categoryDisplay}
        />
        <InfoRow label="Giá khởi điểm" value={`${formData.starting_price} đ`} />
        <InfoRow label="Bước giá" value={`${formData.step_price} đ`} />
        <InfoRow label="Giá mua ngay" value={formData.buy_now_price ? `${formData.buy_now_price} đ` : 'Không đặt'} />
        <InfoRow label="Cho phép bidder chưa rating" value={formData.allow_unrated_bidders ? 'Có' : 'Không'} />
        <InfoRow label="Bắt đầu" value={formData.start_time || 'Ngay khi duyệt'} />
        <InfoRow label="Kết thúc" value={formData.end_time} />
        <InfoRow label="Tự gia hạn" value="Áp dụng theo cài đặt hệ thống" />
      </dl>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-slate-600">Mô tả</p>
        <div
          className="prose max-w-none rounded-lg border border-slate-200 p-4"
          dangerouslySetInnerHTML={{ __html: formData.description || '<p>Không có mô tả</p>' }}
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-slate-600">Ảnh sản phẩm</p>
        <div className="grid gap-4 md:grid-cols-3">
          {formData.images.map((image) => (
            <img key={image.path} src={image.url} alt={image.name} className="h-32 w-full rounded-lg object-cover" />
          ))}
        </div>
      </div>
    </div>

    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="agreementAccepted"
          checked={formData.agreementAccepted}
          onChange={onAgreementToggle}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          Tôi xác nhận thông tin chính xác, đồng ý các điều khoản đấu giá và chấp nhận việc mô tả bổ sung sẽ được nối tiếp.
        </span>
      </label>
      {errors.agreementAccepted && <p className="mt-2 text-red-500">{errors.agreementAccepted}</p>}
    </div>

    <div className="flex justify-between">
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-slate-200 px-6 py-2 text-slate-600 hover:bg-slate-50"
      >
        Quay lại chỉnh sửa
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? 'Đang đăng...' : 'Xác nhận đăng sản phẩm'}
      </button>
    </div>
  </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-base font-semibold text-slate-800">{value}</p>
  </div>
)

export default ProductReviewStep
