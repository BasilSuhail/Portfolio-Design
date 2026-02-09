import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import { Helmet } from "react-helmet-async";
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
  customDate?: string;
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
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{blog.title} | Basil Suhail</title>
        <meta name="description" content={blog.excerpt || blog.content.substring(0, 160).replace(/<[^>]*>/g, '')} />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt || blog.content.substring(0, 160).replace(/<[^>]*>/g, '')} />
        {blog.coverImage && <meta property="og:image" content={blog.coverImage} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.excerpt || blog.content.substring(0, 160).replace(/<[^>]*>/g, '')} />
        {blog.coverImage && <meta name="twitter:image" content={blog.coverImage} />}

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/uploads/optimized/favicon.webp" />
        <link rel="canonical" href={`https://basilsuhail.com/blog/${blog.slug}`} />

        {/* Article Metadata */}
        <meta property="article:published_time" content={blog.customDate || blog.createdAt} />
        <meta property="article:modified_time" content={blog.updatedAt} />

        {/* SEO Keywords from content */}
        <meta name="keywords" content={blog.title.toLowerCase().split(' ').join(', ')} />
      </Helmet>

      {/* Compact Hero Section */}
      <div className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="w-4 h-4" />
            <time dateTime={blog.customDate || blog.createdAt}>
              {new Date(blog.customDate || blog.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight text-foreground">{blog.title}</h1>

          {blog.excerpt && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {blog.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Cover Image - Compact */}
      {blog.coverImage && (
        <div className="max-w-3xl mx-auto px-6 mt-8 mb-8">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Blog Content */}
      <article className="max-w-3xl mx-auto px-6 pb-20">
        {blog.contentType === 'pdf' && blog.pdfUrl ? (
          // PDF Viewer
          <PdfViewer pdfUrl={blog.pdfUrl} title={blog.title} />
        ) : (
          // HTML Content with High Contrast Support
          <div
            className="prose prose-base dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
              prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:decoration-primary/50 hover:prose-a:decoration-primary
              prose-strong:text-foreground prose-strong:font-bold
              prose-em:text-foreground
              prose-ul:my-4 prose-ul:space-y-1
              prose-ol:my-4 prose-ol:space-y-1
              prose-li:text-foreground prose-li:leading-relaxed
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted
              prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:text-foreground
              prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-code:border prose-code:border-border
              prose-pre:bg-muted prose-pre:text-foreground prose-pre:border-2 prose-pre:border-border
              prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-6
              prose-hr:border-border prose-hr:my-8
              prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:border-2 prose-th:border-border prose-th:bg-muted prose-th:p-3 prose-th:text-foreground prose-th:font-bold
              prose-td:border prose-td:border-border prose-td:p-3 prose-td:text-foreground"
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
