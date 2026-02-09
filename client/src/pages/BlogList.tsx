import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  customDate?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog | Basil Suhail</title>
        <meta name="description" content="Thoughts, insights, and stories about finance, data science, and technology by Basil Suhail." />
        <link rel="icon" type="image/png" href="/uploads/optimized/favicon.webp" />
        <link rel="canonical" href="https://basilsuhail.com/blog" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Thoughts, insights, and stories about finance, data science, and technology.
          </p>
        </div>

        {blogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No blog posts yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {blogs.map((blog) => (
              <Card key={blog.id} className="group hover:shadow-lg transition-shadow">
                <Link href={`/blog/${blog.slug}`}>
                  <div className="cursor-pointer">
                    {blog.coverImage && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={blog.customDate || blog.createdAt}>
                          {new Date(blog.customDate || blog.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                        {blog.title}
                      </CardTitle>
                    </CardHeader>
                    {blog.excerpt && (
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{blog.excerpt}</p>
                        <div className="flex items-center text-primary font-medium">
                          Read more
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    )}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
