"use client"

import { useState } from "react"
import { PhotoModal } from "./PhotoModal"

interface Photo {
  id: number
  src: string
  alt: string
  location: string
  date: string
  orientation: "portrait" | "landscape" | "square"
}

interface GalleryGridProps {
  photos: Photo[]
}

export function GalleryGrid({ photos }: GalleryGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="break-inside-avoid block w-full overflow-hidden rounded bg-muted transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <img src={photo.src || "/placeholder.svg"} alt={photo.alt} className="w-full h-auto object-contain" />
          </button>
        ))}
      </div>

      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </>
  )
}
