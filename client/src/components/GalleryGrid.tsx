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

  // Group photos by location to add dividers between different batches
  const photoGroups: { location: string; photos: Photo[] }[] = []
  let currentGroup: Photo[] = []
  let currentLocation = ""

  photos.forEach((photo, index) => {
    if (index === 0) {
      currentLocation = photo.location
      currentGroup = [photo]
    } else if (photo.location === currentLocation) {
      currentGroup.push(photo)
    } else {
      photoGroups.push({ location: currentLocation, photos: currentGroup })
      currentLocation = photo.location
      currentGroup = [photo]
    }
  })

  if (currentGroup.length > 0) {
    photoGroups.push({ location: currentLocation, photos: currentGroup })
  }

  return (
    <>
      <div className="space-y-8">
        {photoGroups.map((group, groupIndex) => (
          <div key={`${group.location}-${groupIndex}`}>
            {groupIndex > 0 && (
              <div className="mb-8 border-t border-border/40" />
            )}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {group.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="break-inside-avoid block w-full overflow-hidden rounded bg-muted transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <img src={photo.src || "/placeholder.svg"} alt={photo.alt} className="w-full h-auto object-contain" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </>
  )
}
