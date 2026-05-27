import { useRef, useState, useEffect } from 'react'
import { resolveMediaUrl } from '../../utils/images'

export default function ImageUpload({ file, onFileChange, id = 'image-upload', helperText = 'Upload a PNG/JPEG image (optional) up to 2 MB', existingUrl = null }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(resolveMediaUrl(existingUrl))
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, existingUrl])

  const handleFiles = (files) => {
    const f = files && files[0]
    if (!f) return
    setError(null)
    if (f.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum 2 MB allowed.')
      onFileChange(null)
      return
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
      setError('Only PNG/JPEG images are allowed.')
      onFileChange(null)
      return
    }
    onFileChange(f)
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-white p-5 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-200 ease-in-out min-h-[88px]"
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 9l5-5 5 5M12 4v12" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Click to upload logo, or drag and drop</span>
        </div>
      </div>

      <input id={id} ref={inputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <p className="mt-2 text-xs text-gray-400">{helperText}</p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {previewUrl && (
        <div className="mt-3 flex items-center gap-3">
          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
            <img src={previewUrl} alt={file?.name || 'Current image'} className="w-full h-full object-cover" />
          </div>
          {file && (
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
              <div className="ml-auto text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => onFileChange(null)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Remove</button>
              <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Change</button>
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
