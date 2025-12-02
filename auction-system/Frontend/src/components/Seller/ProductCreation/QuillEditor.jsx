import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const QuillEditor = ({ value, onChange, modules, placeholder, readOnly = false }) => {
  const containerRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)
  
  // Ref để theo dõi xem có đang gõ tiếng Việt không
  const isComposing = useRef(false)
  // Ref quan trọng: Lưu lại giá trị cuối cùng mà chính Editor này đã gửi đi
  const lastEmittedValue = useRef(value)
  
  // Cập nhật ref onChange mới nhất để tránh stale closure
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Khởi tạo Editor (Chỉ chạy 1 lần)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cleanup cũ và tạo element mới (Fix lỗi double toolbar)
    container.innerHTML = ''
    const editorElement = document.createElement('div')
    container.appendChild(editorElement)

    const quillInstance = new Quill(editorElement, {
      theme: 'snow',
      modules,
      placeholder,
      readOnly
    })

    quillRef.current = quillInstance

    // Set giá trị ban đầu
    if (value) {
      quillInstance.clipboard.dangerouslyPasteHTML(value)
      lastEmittedValue.current = value
    }

    // --- XỬ LÝ SỰ KIỆN GÕ TIẾNG VIỆT ---
    quillInstance.root.addEventListener('compositionstart', () => {
      isComposing.current = true
    })
    
    quillInstance.root.addEventListener('compositionend', () => {
      isComposing.current = false
      handleTextChange() // Cập nhật ngay khi gõ xong cụm từ
    })

    const handleTextChange = () => {
      // Nếu đang gõ dở tiếng Việt thì khoan hãy bắn event ra ngoài
      if (isComposing.current) return

      const html = quillInstance.root.innerHTML
      // Chuẩn hóa nội dung rỗng của Quill
      const content = html === '<p><br></p>' ? '' : html

      // Lưu lại giá trị này để so sánh về sau (Kỹ thuật chặn Echo)
      lastEmittedValue.current = content
      
      // Gửi ra ngoài cho cha
      onChangeRef.current?.(content)
    }

    quillInstance.on('text-change', handleTextChange)

    return () => {
      quillInstance.off('text-change', handleTextChange)
      quillRef.current = null
      if (container) container.innerHTML = ''
    }
  }, [modules, placeholder, readOnly])

  // --- SYNC VALUE TỪ CHA VÀO EDITOR (Fix lỗi mất format) ---
  useEffect(() => {
    const quillInstance = quillRef.current
    if (!quillInstance) return

    const nextValue = value || ''
    
    // 1. Kiểm tra cơ bản: Nếu giống hệt nội dung hiện tại thì thôi
    if (quillInstance.root.innerHTML === nextValue) return

    // 2. KỸ THUẬT CHẶN ECHO (Quan trọng nhất):
    // Nếu giá trị props gửi xuống (nextValue) CHÍNH LÀ giá trị mà editor vừa gửi đi
    // thì ta bỏ qua, không paste lại. Điều này giữ nguyên con trỏ và format.
    if (nextValue === lastEmittedValue.current) return

    // 3. Bảo vệ thêm lớp 2:
    // Nếu đang focus và đang gõ, chỉ cho phép update nếu là lệnh Reset (về rỗng)
    if (document.activeElement === quillInstance.root) {
        if (nextValue === '' || nextValue === '<p><br></p>') {
             // Cho phép reset form
        } else {
             // Đây là trường hợp cha gửi props xuống lệch pha khi đang gõ
             // Ta từ chối cập nhật để bảo vệ format
             return 
        }
    }

    // Nếu vượt qua hết các bước trên -> Đây là dữ liệu mới từ server/API -> Paste vào
    quillInstance.clipboard.dangerouslyPasteHTML(nextValue)
    lastEmittedValue.current = nextValue // Cập nhật lại mốc so sánh
    
  }, [value])

  return <div ref={containerRef} />
}

export default QuillEditor