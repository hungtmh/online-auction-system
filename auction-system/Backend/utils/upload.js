import crypto from 'node:crypto'
import multer from 'multer'
import { supabase } from '../config/supabase.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const bucketName = process.env.SUPABASE_PRODUCT_BUCKET || 'auction-product-media'
const avatarBucketName = process.env.SUPABASE_AVATAR_BUCKET || 'profile-avatars'
const paymentProofBucketName = process.env.SUPABASE_PAYMENT_PROOF_BUCKET || 'payment-proofs'

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Định dạng ảnh không được hỗ trợ'))
    }
    cb(null, true)
  }
})

export const avatarImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Định dạng ảnh không được hỗ trợ'))
    }
    cb(null, true)
  }
})

export const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Định dạng ảnh không được hỗ trợ'))
    }
    cb(null, true)
  }
})

export const uploadBufferToProductBucket = async ({ buffer, mimetype, sellerId }) => {
  const extension = mimetype.split('/').pop() || 'bin'
  const filePath = `${sellerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      cacheControl: '3600',
      contentType: mimetype,
      upsert: false
    })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(bucketName).getPublicUrl(filePath)

  return { filePath, publicUrl }
}

export const uploadBufferToAvatarBucket = async ({ buffer, mimetype, userId }) => {
  const extension = mimetype.split('/').pop() || 'bin'
  const filePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(avatarBucketName)
    .upload(filePath, buffer, {
      cacheControl: '3600',
      contentType: mimetype,
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(avatarBucketName).getPublicUrl(filePath)

  return { filePath, publicUrl }
}

export const uploadBufferToPaymentProofBucket = async ({ buffer, mimetype, userId }) => {
  const extension = mimetype.split('/').pop() || 'bin'
  const filePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(paymentProofBucketName)
    .upload(filePath, buffer, {
      cacheControl: '3600',
      contentType: mimetype,
      upsert: false
    })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(paymentProofBucketName).getPublicUrl(filePath)

  return { filePath, publicUrl }
}
