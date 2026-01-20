import { ArrowRight } from "lucide-react";
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
  customDate?: string;
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
      const featured = data.filter((b: Blog) => b.featuredInWriting);
      setBlogs(featured.length > 0 ? featured : data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || blogs.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 sm:mt-14" data-testid="section-writing" data-section="writing">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-medium text-gray-800 dark:text-neutral-200">
            Writing
          </h2>
          <Link href="/blog">
            <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer">
              View all
              <ArrowRight className="size-3" />
            </span>
          </Link>
        </div>

        {intro && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
            {intro}
          </p>
        )}

        {/* Articles List - Preline Style */}
        <ul className="space-y-3">
          {blogs.map((blog) => (
            <li key={blog.id}>
              <Link href={`/blog/${blog.slug}`}>
                <div
                  className="group flex justify-between items-center gap-x-3 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-100 cursor-pointer dark:hover:bg-neutral-800 transition-colors"
                  data-testid={`link-post-${blog.id}`}
                >
                  <div className="grow">
                    <p className="text-sm text-gray-800 dark:text-neutral-200 group-hover:text-gray-600 dark:group-hover:text-neutral-400">
                      {blog.title}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-xs text-gray-400 dark:text-neutral-600">
                      {new Date(blog.customDate || blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
