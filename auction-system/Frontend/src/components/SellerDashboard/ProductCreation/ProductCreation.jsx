import { useMemo, useState } from 'react'
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

    if (!formData.name.trim()) nextErrors.name = 'Vui lòng nhập tên sản phẩm.'
    if (!formData.category_id) nextErrors.category_id = 'Vui lòng chọn danh mục.'

    if (!stripHtml(formData.description)) {
      nextErrors.description = 'Mô tả sản phẩm không được để trống.'
    }

    if (!formData.starting_price || Number(formData.starting_price) < 0) {
      nextErrors.starting_price = 'Giá khởi điểm không hợp lệ.'
    }

    if (!formData.step_price || Number(formData.step_price) <= 0) {
      nextErrors.step_price = 'Bước giá phải lớn hơn 0.'
    }

    if (formData.buy_now_price) {
      if (Number(formData.buy_now_price) <= Number(formData.starting_price || 0)) {
        nextErrors.buy_now_price = 'Giá mua ngay phải lớn hơn giá khởi điểm.'
      }
    }

    if (!formData.end_time) {
      nextErrors.end_time = 'Vui lòng chọn thời điểm kết thúc.'
    } else {
      const end = new Date(formData.end_time)
      if (Number.isNaN(end.getTime()) || end <= new Date()) {
        nextErrors.end_time = 'Thời điểm kết thúc phải nằm trong tương lai.'
      }
    }

    if (formData.start_time) {
      const start = new Date(formData.start_time)
      const end = new Date(formData.end_time)
      if (start >= end) {
        nextErrors.start_time = 'Thời điểm bắt đầu phải trước thời điểm kết thúc.'
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

    if (Object.keys(validationErrors).length === 0) {
      setStep(2)
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
        buy_now_price: formData.buy_now_price ? Number(formData.buy_now_price) : null,
        auto_extend_minutes: Number(formData.auto_extend_minutes),
        auto_extend_threshold: Number(formData.auto_extend_threshold)
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
          categoryOptions={categoryOptions}
          loadingCategories={loadingCategories}
          uploading={uploading}
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
