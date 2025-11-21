import crypto from 'node:crypto'
import multer from 'multer'
import { supabase } from '../config/supabase.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const bucketName = process.env.SUPABASE_PRODUCT_BUCKET || 'auction-product-media'

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
