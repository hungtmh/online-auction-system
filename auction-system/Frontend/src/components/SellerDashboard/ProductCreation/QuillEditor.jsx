import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const QuillEditor = ({ value, onChange, modules, placeholder, readOnly = false }) => {
  const containerRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const initialValueRef = useRef(value)
  const valueRef = useRef(value || '')

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value || ''
  }, [value])

  useEffect(() => {
    const container = containerRef.current
    if (!container || quillRef.current) return

    const quillInstance = new Quill(container, {
      theme: 'snow',
      modules,
      placeholder,
      readOnly
    })

    quillRef.current = quillInstance

    if (initialValueRef.current) {
      quillInstance.clipboard.dangerouslyPasteHTML(initialValueRef.current)
    }

    const handleTextChange = () => {
      const html = quillInstance.root.innerHTML
      if (html === valueRef.current) return
      valueRef.current = html
      onChangeRef.current?.(html)
    }

    quillInstance.on('text-change', handleTextChange)

    return () => {
      quillInstance.off('text-change', handleTextChange)
      quillRef.current = null
      container.innerHTML = ''
    }
  }, [modules, placeholder, readOnly])

  useEffect(() => {
    const quillInstance = quillRef.current
    if (!quillInstance) return

    const nextValue = value || ''
    if (quillInstance.root.innerHTML === nextValue) return
    if (document.activeElement === quillInstance.root) return

    quillInstance.clipboard.dangerouslyPasteHTML(nextValue)
    valueRef.current = nextValue
  }, [value])

  return <div ref={containerRef} />
}

export default QuillEditor
