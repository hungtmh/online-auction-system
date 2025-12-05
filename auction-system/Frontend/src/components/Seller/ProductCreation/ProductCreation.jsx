import { useEffect, useMemo, useState } from 'react'
import sellerAPI from '../../../services/sellerAPI'
import { initialFormState, MAX_UPLOAD_IMAGES } from './constants'
import { stripHtml } from './utils'
import ProductFormStep from './ProductFormStep'
import ProductReviewStep from './ProductReviewStep'
import StepIndicator from './StepIndicator'
import InfoBanner from './InfoBanner'

const ProductCreation = ({ categories, loadingCategories }) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(() => ({ ...initialFormState }))
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [systemSettings, setSystemSettings] = useState({ min_bid_increment_percent: 5 })

  // Fetch system settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await sellerAPI.getPublicSettings()
        if (response?.data?.settings) {
          setSystemSettings(response.data.settings)
        }
      } catch (err) {
        console.error('Không thể tải cài đặt hệ thống:', err)
      }
    }
    fetchSettings()
  }, [])

  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) return []
    return categories.map((category) => ({
      id: category.id || category.value,
      label: category.name || category.label
    }))
  }, [categories])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAgreementToggle = (event) => {
    handleCheckboxChange(event)
    setErrors((prev) => ({ ...prev, agreementAccepted: null }))
  }

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }))
    
    // Clear description error when user starts typing
    if (fieldErrors.description) {
      setFieldErrors((prev) => ({ ...prev, description: null }))
    }
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: null }))
    }
  }

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setStatus(null)
    setErrors((prev) => ({ ...prev, images: null }))
    setUploading(true)

    try {
      const uploads = []
      for (const file of files) {
        const response = await sellerAPI.uploadProductImage(file)
        uploads.push({
          url: response?.data?.url,
          path: response?.data?.path,
          name: file.name
        })
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploads].slice(0, MAX_UPLOAD_IMAGES)
      }))
    } catch (error) {
      console.error('Upload error:', error)
      setStatus({ type: 'error', message: 'Không thể upload ảnh, vui lòng thử lại.' })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveImage = (path) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.path !== path)
    }))
  }

  const validateStepOne = () => {
    const nextErrors = {}
    // Lấy thời gian hiện tại
    const now = new Date()
    const FUTURE_BUFFER_MS = 60 * 1000 // 1 phút

    // --- LOG ĐỂ DEBUG (Xem giá trị thực tế máy tính nhận được) ---
    console.log("Start input:", formData.start_time)
    console.log("End input:", formData.end_time)

    // 1. Validate Text Inputs
    if (!formData.name.trim()) {
      nextErrors.name = 'Vui lòng nhập tên sản phẩm.'
    } else if (formData.name.trim().length < 5) {
      nextErrors.name = 'Tên sản phẩm phải có ít nhất 5 ký tự.'
    }

    if (!formData.category_id) nextErrors.category_id = 'Vui lòng chọn danh mục.'

    if (!stripHtml(formData.description)) {
      nextErrors.description = 'Mô tả sản phẩm không được để trống.'
    }

    // 2. Validate Giá
    if (!formData.starting_price || Number(formData.starting_price) < 0) {
      nextErrors.starting_price = 'Giá khởi điểm không hợp lệ.'
    }

    if (!formData.step_price || Number(formData.step_price) <= 0) {
      nextErrors.step_price = 'Bước giá phải lớn hơn 0.'
    } else if (formData.starting_price && Number(formData.starting_price) > 0) {
      // Validate bước giá theo % giá khởi điểm (từ system settings)
      const minPercent = Number(systemSettings.min_bid_increment_percent) || 5
      const startingPrice = Number(formData.starting_price)
      const minStepPrice = Math.ceil(startingPrice * minPercent / 100)
      
      if (Number(formData.step_price) < minStepPrice) {
        nextErrors.step_price = `Bước giá phải tối thiểu ${minStepPrice.toLocaleString('vi-VN')} VND (${minPercent}% của giá khởi điểm).`
      }
    }

    if (formData.buy_now_price) {
      if (Number(formData.buy_now_price) <= Number(formData.starting_price || 0)) {
        nextErrors.buy_now_price = 'Giá mua ngay phải lớn hơn giá khởi điểm.'
      }
    }

    // 3. Validate Thời gian (Chia tách validation rõ ràng)
    let startTimeObj = null
    let endTimeObj = null

    // ========== VALIDATE END TIME (Kết thúc) ==========
    if (!formData.end_time) {
      nextErrors.end_time = 'Vui lòng chọn thời điểm kết thúc.'
    } else {
      endTimeObj = new Date(formData.end_time)
      
      if (isNaN(endTimeObj.getTime())) {
        nextErrors.end_time = 'Định dạng thời gian kết thúc không hợp lệ.'
      } else {
        // Check 1: End time phải trong tương lai (buffer 1 phút)
        const minEndTime = new Date(now.getTime() + FUTURE_BUFFER_MS)
        if (endTimeObj < minEndTime) {
          nextErrors.end_time = 'Thời điểm kết thúc phải nằm trong tương lai (ít nhất sau 1 phút từ bây giờ).'
        }
      }
    }

    // ========== VALIDATE START TIME (Bắt đầu) ==========
    if (formData.start_time) {
      startTimeObj = new Date(formData.start_time)
      
      if (isNaN(startTimeObj.getTime())) {
        // Check 1: Format không hợp lệ
        nextErrors.start_time = 'Định dạng thời gian bắt đầu không hợp lệ.'
      } else {
        // Check 2: Start time không được ở quá khứ (buffer 1 phút)
        const minStartTime = new Date(now.getTime() + FUTURE_BUFFER_MS)
        if (startTimeObj < minStartTime) {
          nextErrors.start_time = 'Thời điểm bắt đầu phải nằm trong tương lai (ít nhất sau 1 phút từ bây giờ).'
        } 
        // Check 3: Start time phải nhỏ hơn End time (chỉ check khi End hợp lệ)
        else if (endTimeObj && !isNaN(endTimeObj.getTime()) && !nextErrors.end_time) {
          if (startTimeObj.getTime() >= endTimeObj.getTime()) {
            nextErrors.start_time = 'Thời điểm bắt đầu phải trước thời điểm kết thúc.'
          }
        }
      }
    }

    if (formData.images.length < 3) {
      nextErrors.images = 'Cần tối thiểu 3 ảnh sản phẩm.'
    }

    return nextErrors
  }

  const handleGoToReview = () => {
    const validationErrors = validateStepOne()
    setErrors(validationErrors)
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      setStep(2)
    } else {
      // Auto-dismiss field errors after 10 seconds
      setTimeout(() => {
        setFieldErrors({})
      }, 10000)
    }
  }

  const handleSubmit = async () => {
    if (!formData.agreementAccepted) {
      setErrors((prev) => ({ ...prev, agreementAccepted: 'Cần đồng ý với điều khoản trước khi đăng.' }))
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      const payload = {
        ...formData,
        images: formData.images.map((img) => img.url),
        starting_price: Number(formData.starting_price),
        step_price: Number(formData.step_price),
        buy_now_price: formData.buy_now_price ? Number(formData.buy_now_price) : null
        // auto_extend được quản lý bởi Admin trong cài đặt hệ thống
      }

      await sellerAPI.createProduct(payload)

      setStatus({
        type: 'success',
        message: 'Đăng sản phẩm thành công! Vui lòng chờ admin duyệt.'
      })

      setFormData({ ...initialFormState })
      setErrors({})
      setStep(1)
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Không thể đăng sản phẩm, vui lòng thử lại.'
      setStatus({ type: 'error', message: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <StepIndicator step={step} />
      <InfoBanner />

      {status && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {step === 1 ? (
        <ProductFormStep
          formData={formData}
          errors={errors}
          fieldErrors={fieldErrors}
          categoryOptions={categoryOptions}
          loadingCategories={loadingCategories}
          uploading={uploading}
          systemSettings={systemSettings}
          onInputChange={handleInputChange}
          onCheckboxChange={handleCheckboxChange}
          onDescriptionChange={handleDescriptionChange}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          onNextStep={handleGoToReview}
        />
      ) : (
        <ProductReviewStep
          formData={formData}
          errors={errors}
          categoryOptions={categoryOptions}
          submitting={submitting}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          onAgreementToggle={handleAgreementToggle}
        />
      )}
    </div>
  )
}

export default ProductCreation
