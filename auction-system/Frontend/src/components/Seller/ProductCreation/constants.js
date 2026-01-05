export const initialFormState = {
  name: '',
  parent_category_id: '',
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
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'header': 1 }, { 'header': 2 }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ]
}

export const MAX_UPLOAD_IMAGES = 8
