import React, { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

function UploadZone({ onFileSelect, isLoading }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

  const validateFile = (file) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are allowed')
      return false
    }

    if (file.size > MAX_SIZE) {
      setError('File size must be less than 10MB')
      return false
    }

    return true
  }

  const handleFile = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(selectedFile)
      
      onFileSelect(selectedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFile(droppedFiles[0])
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="card cursor-pointer border-2 border-dashed border-amber/40 hover:border-amber/60 transition-colors"
        >
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-amber" />
            </div>
            <h3 className="text-xl font-bold text-cream mb-2">Upload Cattle Image</h3>
            <p className="text-cream/70 mb-4 text-center">
              Drag and drop your image here, or click to browse
            </p>
            <p className="text-sm text-cream/50">
              JPG, JPEG, or PNG • Max 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="card space-y-4 fade-in-up">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/30">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-cream font-medium truncate">{file?.name}</p>
            <p className="text-cream/60 text-sm">
              {(file?.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearFile}
              disabled={isLoading}
              className="btn btn-secondary flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </button>
            <button
              onClick={() => onFileSelect?.(file)}
              disabled={isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Analysing...' : 'Analyse Breed'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

export default UploadZone
