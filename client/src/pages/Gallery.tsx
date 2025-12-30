import { useState, useEffect } from "react";
import { Link } from "wouter";
import { GalleryGrid } from "@/components/GalleryGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface Photo {
  id: number;
  src: string;
  alt: string;
  location: string;
  date: string;
  orientation: "portrait" | "landscape" | "square";
}

export default function Gallery() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <p className="text-center text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !isVisible) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Gallery Not Available</h2>
            <p className="text-muted-foreground">
              The gallery is currently unavailable.
            </p>
            <Link href="/">
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gallery | Portfolio</title>
        <meta name="description" content="Photo gallery - moments captured through my lens" />
        <link rel="icon" type="image/jpeg" href="/uploads/favicon.jpg" />
      </Helmet>

      <ThemeToggle />

      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-2">
              Gallery
            </h1>
            <p className="text-foreground/80">
              A collection of my gallery
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No photos in the gallery yet. Check back soon!
            </p>
          </div>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </div>
    </div>
  );
}
