import QuillEditor from './QuillEditor'
import { quillModules } from './constants'
import { useMemo, useEffect } from 'react'

// Map icon names to emoji
const iconMap = {
  'smartphone': '📱',
  'laptop': '💻',
  'cpu': '🖥️',
  'shirt': '👕',
  'footprints': '👟',
  'watch': '⌚',
  'home': '🏠',
  'sofa': '🛋️',
  'book': '📚',
  'palette': '🎨',
  'dumbbell': '🏋️',
  'car': '🚗',
  'recycle': '♻️'
}

const ProductFormStep = ({
  formData,
  errors,
  fieldErrors,
  categoryOptions,
  loadingCategories,
  uploading,
  systemSettings = {},
  onInputChange,
  onCheckboxChange,
  onDescriptionChange,
  onImageUpload,
  onRemoveImage,
  onNextStep
}) => {
  // Tính bước giá tối thiểu theo % giá khởi điểm
  const minPercent = Number(systemSettings.min_bid_increment_percent) || 5
  const startingPrice = Number(formData.starting_price) || 0
  const minStepPrice = startingPrice > 0 ? Math.ceil(startingPrice * minPercent / 100) : 0

  // Lọc danh mục cha (parent_id = null)
  const parentCategories = useMemo(() => {
    return categoryOptions.filter(cat => !cat.parent_id)
  }, [categoryOptions])

  // Lọc danh mục con dựa trên parent được chọn
  const childCategories = useMemo(() => {
    if (!formData.parent_category_id) return []
    return categoryOptions.filter(cat => cat.parent_id === formData.parent_category_id)
  }, [categoryOptions, formData.parent_category_id])

  // Reset child category khi parent thay đổi
  useEffect(() => {
    if (formData.parent_category_id && formData.category_id) {
      const selectedChild = categoryOptions.find(cat => cat.id === formData.category_id)
      if (!selectedChild || selectedChild.parent_id !== formData.parent_category_id) {
        // Category hiện tại không thuộc parent mới -> reset
        onInputChange({ target: { name: 'category_id', value: '' } })
      }
    }
  }, [formData.parent_category_id])

  const handleParentChange = (e) => {
    const parentId = e.target.value
    onInputChange({ target: { name: 'parent_category_id', value: parentId } })
    // Reset category_id khi đổi parent
    onInputChange({ target: { name: 'category_id', value: '' } })
  }

  return (
  <div className="space-y-6">
    <div className="relative">
      <label className="mb-1 block text-sm font-semibold text-slate-600">Tên sản phẩm *</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={onInputChange}
        className={`w-full rounded-lg border px-4 py-2 ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
        placeholder="VD: MacBook Pro M3 2024"
      />
      {fieldErrors.name && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
          <span className="mr-1">⚠️</span>{fieldErrors.name}
        </div>
      )}
    </div>

    {/* PHẦN DANH MỤC MỚI - 2 DROPDOWN */}
    <div className="grid gap-6 md:grid-cols-2">
      {/* Danh mục cha */}
      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-slate-600">Danh mục cha *</label>
        {loadingCategories ? (
          <p className="text-sm text-slate-500">Đang tải danh mục...</p>
        ) : (
          <select
            name="parent_category_id"
            value={formData.parent_category_id}
            onChange={handleParentChange}
            className={`w-full rounded-lg border px-4 py-2 ${errors.parent_category_id ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
          >
            <option value="">-- Chọn danh mục cha --</option>
            {parentCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.parent_category_id && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
            <span className="mr-1">⚠️</span>{fieldErrors.parent_category_id}
          </div>
        )}
      </div>

      {/* Danh mục con */}
      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-slate-600">Danh mục con *</label>
        {loadingCategories ? (
          <p className="text-sm text-slate-500">Đang tải danh mục...</p>
        ) : (
          <select
            name="category_id"
            value={formData.category_id}
            onChange={onInputChange}
            disabled={!formData.parent_category_id}
            className={`w-full rounded-lg border px-4 py-2 ${
              !formData.parent_category_id 
                ? 'cursor-not-allowed bg-slate-100 text-slate-400' 
                : errors.category_id 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-slate-200'
            }`}
          >
            <option value="">
              {!formData.parent_category_id 
                ? '-- Chọn danh mục cha trước --' 
                : childCategories.length === 0
                  ? '-- Không có danh mục con --'
                  : '-- Chọn danh mục con --'
              }
            </option>
            {childCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.category_id && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
            <span className="mr-1">⚠️</span>{fieldErrors.category_id}
          </div>
        )}
      </div>
    </div>

    {/* Checkbox allow unrated bidders */}
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-600">Cho phép bidder chưa có rating</label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="allow_unrated_bidders"
          checked={formData.allow_unrated_bidders}
          onChange={onCheckboxChange}
          className="h-4 w-4 rounded border-slate-300"
        />
        Mở cho tất cả bidder
      </label>
    </div>

    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-600">Mô tả sản phẩm *</label>
      <div className={errors.description ? 'rounded-lg border-2 border-red-400' : ''}>
        <QuillEditor
          value={formData.description}
          onChange={onDescriptionChange}
          modules={quillModules}
          placeholder="Nhập mô tả chi tiết về sản phẩm..."
        />
      </div>
      {fieldErrors.description && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
          <span className="mr-1">⚠️</span>{fieldErrors.description}
        </div>
      )}
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      <NumberInput
        label="Giá khởi điểm *"
        name="starting_price"
        value={formData.starting_price}
        error={errors.starting_price}
        fieldError={fieldErrors?.starting_price}
        onChange={onInputChange}
      />
      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-slate-600">
          Bước giá * 
          {minStepPrice > 0 && (
            <span className="ml-1 text-xs font-normal text-blue-600">
              (tối thiểu: {minStepPrice.toLocaleString('vi-VN')}đ)
            </span>
          )}
        </label>
        <input
          type="number"
          name="step_price"
          value={formData.step_price}
          onChange={onInputChange}
          className={`w-full rounded-lg border px-4 py-2 ${errors.step_price ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
        />
        {minStepPrice > 0 && !fieldErrors?.step_price && (
          <p className="mt-1 text-xs text-slate-500">
            {minPercent}% của giá khởi điểm
          </p>
        )}
        {fieldErrors?.step_price && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
            <span className="mr-1">⚠️</span>{fieldErrors.step_price}
          </div>
        )}
      </div>
      <NumberInput
        label="Giá mua ngay"
        name="buy_now_price"
        value={formData.buy_now_price}
        error={errors.buy_now_price}
        fieldError={fieldErrors?.buy_now_price}
        onChange={onInputChange}
      />
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <DateInput
        label="Thời điểm bắt đầu"
        name="start_time"
        value={formData.start_time}
        error={errors.start_time}
        fieldError={fieldErrors?.start_time}
        onChange={onInputChange}
      />
      <DateInput
        label="Thời điểm kết thúc *"
        name="end_time"
        value={formData.end_time}
        error={errors.end_time}
        fieldError={fieldErrors?.end_time}
        onChange={onInputChange}
      />
    </div>

    {/* Lưu ý: Tự động gia hạn được quản lý bởi Admin trong Cài đặt hệ thống */}
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <p className="text-sm text-blue-700">
        <span className="font-semibold">ℹ️ Tự động gia hạn:</span> Tất cả sản phẩm sẽ tự động gia hạn khi có lượt đấu giá mới gần thời điểm kết thúc. 
        Thời gian gia hạn do quản trị viên thiết lập trong cài đặt hệ thống.
      </p>
    </div>

    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-600">Ảnh sản phẩm * (Tối thiểu 3 ảnh)</label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={onImageUpload}
        disabled={uploading}
        className={`block w-full cursor-pointer rounded-lg border px-4 py-2 text-sm ${errors.images ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
      />
      {fieldErrors?.images && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
          <span className="mr-1">⚠️</span>{fieldErrors.images}
        </div>
      )}
      {uploading && <p className="mt-1 text-sm text-slate-500">Đang upload ảnh...</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {formData.images.map((image) => (
          <div key={image.path} className="relative rounded-lg border border-slate-200 p-2">
            <img src={image.url} alt={image.name} className="h-32 w-full rounded-md object-cover" />
            <button
              type="button"
              onClick={() => onRemoveImage(image.path)}
              className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-xs text-slate-600 shadow"
            >
              Gỡ
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="flex justify-end gap-4">
      <button type="button" onClick={onNextStep} className="rounded-lg bg-emerald-500 px-6 py-2 text-white hover:bg-emerald-400">
        Tiếp tục &amp; xem lại
      </button>
    </div>
  </div>
  )
}

const NumberInput = ({ label, name, value, onChange, error, fieldError }) => (
  <div className="relative">
    <label className="mb-1 block text-sm font-semibold text-slate-600">{label}</label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full rounded-lg border px-4 py-2 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
    />
    {fieldError && (
      <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
        <span className="mr-1">⚠️</span>{fieldError}
      </div>
    )}
  </div>
)

const DateInput = ({ label, name, value, onChange, error, fieldError }) => (
  <div className="relative">
    <label className="mb-1 block text-sm font-semibold text-slate-600">{label}</label>
    <input
      type="datetime-local"
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full rounded-lg border px-4 py-2 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
    />
    {fieldError && (
      <div className="absolute left-0 right-0 top-full z-10 mt-1 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
        <span className="mr-1">⚠️</span>{fieldError}
      </div>
    )}
  </div>
)

export default ProductFormStep
