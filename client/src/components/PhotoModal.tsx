"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface Photo {
  id: number
  src: string
  alt: string
  location: string
  date: string
  orientation: "portrait" | "landscape" | "square"
}

interface PhotoModalProps {
  photo: Photo | null
  onClose: () => void
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  useEffect(() => {
    if (photo) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [photo])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (photo) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => window.removeEventListener("keydown", handleEscape)
  }, [photo, onClose])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full p-2 bg-muted/80 hover:bg-muted transition-colors"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative max-h-[90vh] max-w-[90vw] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.src || "/placeholder.svg"}
          alt={photo.alt}
          className="max-h-[85vh] max-w-full rounded object-contain"
        />

        <div className="mt-4 text-center">
          <p className="text-lg font-medium">{photo.location}</p>
          <p className="text-sm text-muted-foreground">{photo.date}</p>
        </div>
      </div>
    </div>
  )
}
