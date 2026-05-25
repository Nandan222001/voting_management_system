import { useEffect, useState } from 'react'
import { getInitials } from '../../utils/helpers'
import { resolveMediaUrl } from '../../utils/images'

export default function ImageAvatar({
  src,
  name,
  alt,
  sizeClass = 'w-10 h-10',
  shapeClass = 'rounded-full',
  imageClassName = '',
  fallbackClassName = 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  style,
}) {
  const resolvedSrc = resolveMediaUrl(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [resolvedSrc])

  const baseClass = `${sizeClass} ${shapeClass} flex-shrink-0 overflow-hidden`
  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || name || 'Uploaded image'}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${baseClass} object-cover ${imageClassName}`}
      />
    )
  }

  return (
    <div
      aria-label={alt || name || 'Image unavailable'}
      className={`${baseClass} flex items-center justify-center font-bold ${fallbackClassName}`}
      style={style}
    >
      {getInitials(name)}
    </div>
  )
}
