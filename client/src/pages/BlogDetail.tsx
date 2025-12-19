import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import "react-quill/dist/quill.snow.css";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentType?: 'html' | 'pdf';
  pdfUrl?: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BlogDetail() {
  const params = useParams();
  const slug = params.slug;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
    }
  }, [slug]);

  const fetchBlog = async (slug: string) => {
    try {
      const response = await fetch(`/api/blogs/${slug}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      const data = await response.json();
      setBlog(data);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/blog">
              <Button>View All Posts</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <time dateTime={blog.createdAt}>
              {new Date(blog.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">{blog.title}</h1>

          {blog.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {blog.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="max-w-5xl mx-auto px-6 -mt-8 mb-12">
          <div className="aspect-video w-full overflow-hidden rounded-lg shadow-2xl">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Blog Content */}
      <article className="max-w-5xl mx-auto px-6 pb-20">
        {blog.contentType === 'pdf' && blog.pdfUrl ? (
          // PDF Viewer
          <PdfViewer pdfUrl={blog.pdfUrl} title={blog.title} />
        ) : (
          // HTML Content
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-4
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-6 prose-ul:space-y-2
              prose-ol:my-6 prose-ol:space-y-2
              prose-li:text-foreground/90
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50
              prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-code:text-sm prose-code:font-mono prose-code:before:content-none
              prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border
              prose-img:rounded-lg prose-img:shadow-md
              prose-table:border-collapse prose-table:w-full
              prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:p-3
              prose-td:border prose-td:border-border prose-td:p-3"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        )}
      </article>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <Link href="/blog">
            <Button size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Read More Articles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
