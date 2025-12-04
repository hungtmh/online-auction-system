import QuillEditor from './QuillEditor'
import { quillModules } from './constants'

const ProductFormStep = ({
  formData,
  errors,
  fieldErrors,
  categoryOptions,
  loadingCategories,
  uploading,
  onInputChange,
  onCheckboxChange,
  onDescriptionChange,
  onImageUpload,
  onRemoveImage,
  onNextStep
}) => (
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

    <div className="grid gap-6 md:grid-cols-2">
      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-slate-600">Danh mục *</label>
        {loadingCategories ? (
          <p className="text-sm text-slate-500">Đang tải danh mục...</p>
        ) : (
          <select
            name="category_id"
            value={formData.category_id}
            onChange={onInputChange}
            className={`w-full rounded-lg border px-4 py-2 ${errors.category_id ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
          >
            <option value="">Chọn danh mục</option>
            {categoryOptions.map((category) => (
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
        min={0}
        error={errors.starting_price}
        fieldError={fieldErrors?.starting_price}
        onChange={onInputChange}
      />
      <NumberInput
        label="Bước giá *"
        name="step_price"
        value={formData.step_price}
        min={1}
        error={errors.step_price}
        fieldError={fieldErrors?.step_price}
        onChange={onInputChange}
      />
      <NumberInput
        label="Giá mua ngay"
        name="buy_now_price"
        value={formData.buy_now_price}
        min={0}
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

    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-2 text-sm font-semibold text-slate-600">Tùy chọn tự gia hạn</legend>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="auto_extend"
          checked={formData.auto_extend}
          onChange={onCheckboxChange}
          className="h-4 w-4 rounded border-slate-300"
        />
        Tự động gia hạn khi gần kết thúc
      </label>

      {formData.auto_extend && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberInput
            label="Gia hạn thêm (phút)"
            name="auto_extend_minutes"
            value={formData.auto_extend_minutes}
            min={1}
            onChange={onInputChange}
          />
          <NumberInput
            label="Ngưỡng kích hoạt (phút)"
            name="auto_extend_threshold"
            value={formData.auto_extend_threshold}
            min={1}
            onChange={onInputChange}
          />
        </div>
      )}
    </fieldset>

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

const NumberInput = ({ label, name, value, min, onChange, error, fieldError }) => (
  <div className="relative">
    <label className="mb-1 block text-sm font-semibold text-slate-600">{label}</label>
    <input
      type="number"
      min={min}
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
