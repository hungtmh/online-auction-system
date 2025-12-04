export const initialFormState = {
  name: '',
  category_id: '',
  description: '',
  starting_price: '',
  step_price: '',
  buy_now_price: '',
  start_time: '',
  end_time: '',
  allow_unrated_bidders: true,
  auto_extend: true,
  auto_extend_minutes: 10,
  auto_extend_threshold: 5,
  images: [],
  agreementAccepted: false
}

export const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ]
}

export const MAX_UPLOAD_IMAGES = 8
