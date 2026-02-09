import { useState, useEffect } from "react";
import { Link } from "wouter";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useContent } from "@/hooks/use-content";

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
  const { data: content } = useContent();

  // Extract social links from content
  const socialLinks = {
    github: content?.socialLinks?.find((l: any) => l.platform === 'github')?.url,
    linkedin: content?.socialLinks?.find((l: any) => l.platform === 'linkedin')?.url,
    twitter: content?.socialLinks?.find((l: any) => l.platform === 'twitter')?.url,
  };

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
      <div className="min-h-screen bg-white dark:bg-neutral-900">
        <Navigation name={content?.profile?.name || "Portfolio"} />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center justify-center">
            <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-gray-400 rounded-full dark:text-neutral-500" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
        <Footer name={content?.profile?.name} socialLinks={socialLinks} />
      </div>
    );
  }

  if (error || !isVisible) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900">
        <Navigation name={content?.profile?.name || "Portfolio"} />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-neutral-200">Gallery Not Available</h2>
            <p className="text-gray-500 dark:text-neutral-400">
              The gallery is currently unavailable.
            </p>
            <Link href="/">
              <LiquidGlassButton className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </LiquidGlassButton>
            </Link>
          </div>
        </div>
        <Footer name={content?.profile?.name} socialLinks={socialLinks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Helmet>
        <title>Gallery | {content?.profile?.name || "Basil Suhail"}</title>
        <meta name="description" content="Photo gallery - moments captured through my lens" />
        <link rel="icon" type="image/png" href="/uploads/optimized/favicon.webp" />
        <link rel="canonical" href="https://basilsuhail.com/gallery" />
      </Helmet>

      <Navigation name={content?.profile?.name || "Portfolio"} />

      <main className="pt-10 pb-8">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer mb-2">
                <ArrowLeft className="size-3" />
                Back to Home
              </span>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-neutral-200">
              Gallery
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
              A collection of moments captured through my lens
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-neutral-500 text-lg">
                No photos in the gallery yet. Check back soon!
              </p>
            </div>
          ) : (
            <GalleryGrid photos={photos} />
          )}
        </div>
      </main>

      <Footer name={content?.profile?.name} socialLinks={socialLinks} />
    </div>
  );
}
