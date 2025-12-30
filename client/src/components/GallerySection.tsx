import { useState, useEffect } from "react";
import { GalleryGrid } from "./GalleryGrid";

interface Photo {
  id: number;
  src: string;
  alt: string;
  location: string;
  date: string;
  orientation: "portrait" | "landscape" | "square";
}

export function GallerySection() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState(false);

  const loadGallery = async () => {
    try {
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery");
      const data = await res.json();
      setPhotos(data.photos || []);
      setIsVisible(data.visible !== false);
      setError(false);
    } catch (e) {
      console.error("Gallery fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Hide if loading, error, not visible, or no photos
  if (loading || error || !isVisible || photos.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            GALLERY
          </span>
          <p className="text-foreground/80">
            Moments captured through my lens
          </p>
        </div>

        <GalleryGrid photos={photos} />
      </div>
    </section>
  );
}
