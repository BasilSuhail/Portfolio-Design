import { Clock, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export interface BlogPost {
  id: string;
  date: string;
  title: string;
  readTime: number;
  url?: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  createdAt: string;
  featuredInWriting?: boolean;
}

interface WritingSectionProps {
  posts: BlogPost[];
  intro?: string;
}

export default function WritingSection({ intro }: WritingSectionProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedBlogs();
  }, []);

  const fetchFeaturedBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      const data = await response.json();
      // Get only blogs marked as featured, or show latest 5 if none featured
      const featured = data.filter((b: Blog) => b.featuredInWriting);
      setBlogs(featured.length > 0 ? featured : data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateReadTime = (excerpt?: string) => {
    // Estimate 200 words per minute, assume average blog is 800-1000 words
    return excerpt ? Math.ceil(excerpt.split(" ").length / 40) : 5;
  };

  if (isLoading) {
    return null; // Don't show section while loading
  }

  if (blogs.length === 0) {
    return null; // Don't show section if no blogs
  }

  return (
    <section className="py-16" data-testid="section-writing">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            WRITING
          </span>
          {intro && (
            <p className="text-foreground/80">
              {intro}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
            >
              <a
                className="grid grid-cols-[100px_1fr_auto] gap-4 items-center py-3 px-3 -mx-3 rounded-lg hover-elevate active-elevate-2 transition-colors cursor-pointer"
                data-testid={`link-post-${blog.id}`}
              >
                <span className="text-sm text-muted-foreground font-mono">
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
                <span className="font-medium truncate">{blog.title}</span>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(blog.excerpt)} m</span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/blog">
            <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              View all posts
              <ExternalLink className="w-4 h-4" />
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
