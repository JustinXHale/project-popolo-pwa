import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { SitePhoto } from '../../types/models'
import './PhotoLightbox.css'

interface PhotoViewerState {
  photos: SitePhoto[]
  index: number
}

interface PhotoViewerContextValue {
  open: (photos: SitePhoto[], index: number) => void
  close: () => void
}

const PhotoViewerContext = createContext<PhotoViewerContextValue | null>(null)

export function usePhotoViewer() {
  const ctx = useContext(PhotoViewerContext)
  if (!ctx) {
    throw new Error('usePhotoViewer must be used within PhotoViewerProvider')
  }
  return ctx
}

export function PhotoViewerProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<PhotoViewerState | null>(null)
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const open = useCallback((photos: SitePhoto[], index: number) => {
    if (!photos.length) return
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setViewer({
      photos,
      index: Math.max(0, Math.min(index, photos.length - 1)),
    })
  }, [])

  const close = useCallback(() => {
    setViewer(null)
    const restore = restoreFocusRef.current
    restoreFocusRef.current = null
    requestAnimationFrame(() => restore?.focus())
  }, [])

  const go = useCallback((delta: number) => {
    setViewer((prev) => {
      if (!prev || prev.photos.length < 2) return prev
      const next =
        (prev.index + delta + prev.photos.length) % prev.photos.length
      return { ...prev, index: next }
    })
  }, [])

  useEffect(() => {
    if (!viewer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [viewer, close, go])

  const value = useMemo(() => ({ open, close }), [open, close])
  const current = viewer ? viewer.photos[viewer.index] : null

  return (
    <PhotoViewerContext.Provider value={value}>
      {children}
      {viewer && current ? (
        <div
          ref={dialogRef}
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="photo-lightbox__backdrop"
            aria-label="Close photo"
            onClick={close}
          />
          <div className="photo-lightbox__panel">
            <button
              ref={closeRef}
              type="button"
              className="photo-lightbox__close"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
            {viewer.photos.length > 1 ? (
              <>
                <button
                  type="button"
                  className="photo-lightbox__nav photo-lightbox__nav--prev"
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="photo-lightbox__nav photo-lightbox__nav--next"
                  onClick={() => go(1)}
                  aria-label="Next photo"
                >
                  ›
                </button>
              </>
            ) : null}
            <img
              src={current.src}
              alt={current.alt}
              className="photo-lightbox__img"
            />
            <div className="photo-lightbox__meta" id={titleId}>
              <p>{current.caption ?? current.alt}</p>
              {viewer.photos.length > 1 ? (
                <p className="photo-lightbox__count">
                  {viewer.index + 1} / {viewer.photos.length}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </PhotoViewerContext.Provider>
  )
}

export function ClickablePhoto({
  photo,
  photos,
  index,
  className,
}: {
  photo: SitePhoto
  photos: SitePhoto[]
  index: number
  className?: string
}) {
  const { open } = usePhotoViewer()
  return (
    <button
      type="button"
      className={['clickable-photo', className].filter(Boolean).join(' ')}
      onClick={() => open(photos, index)}
      aria-label={`View larger: ${photo.alt}`}
    >
      <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
    </button>
  )
}

export function PhotoGrid({ photos }: { photos: SitePhoto[] }) {
  if (!photos.length) return null
  return (
    <ul className="photo-gallery">
      {photos.map((photo, index) => (
        <li key={`${photo.src}-${index}`} className="photo-gallery__item">
          <ClickablePhoto photo={photo} photos={photos} index={index} />
        </li>
      ))}
    </ul>
  )
}
