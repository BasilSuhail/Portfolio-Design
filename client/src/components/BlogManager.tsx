import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  featuredInWriting?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function BlogManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const emptyBlog: Omit<Blog, "id" | "createdAt" | "updatedAt"> = {
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    coverImage: "",
    published: false,
    featuredInWriting: false,
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/admin/blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!editingBlog) return;

    try {
      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBlog),
      });

      if (!response.ok) throw new Error("Failed to create blog");

      toast({
        title: "Success",
        description: "Blog created successfully!",
      });

      setIsCreating(false);
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create blog",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (blog: Blog) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blog),
      });

      if (!response.ok) throw new Error("Failed to update blog");

      toast({
        title: "Success",
        description: "Blog updated successfully!",
      });

      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update blog",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete blog");

      toast({
        title: "Success",
        description: "Blog deleted successfully!",
      });

      fetchBlogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete blog",
        variant: "destructive",
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (isLoading) {
    return <div>Loading blogs...</div>;
  }

  if (isCreating || editingBlog) {
    const blog = editingBlog || emptyBlog;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isCreating ? "Create New Blog" : "Edit Blog"}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              setEditingBlog(null);
            }}
          >
            Cancel
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={blog.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditingBlog({
                    ...(blog as Blog),
                    title,
                    slug: generateSlug(title),
                  });
                }}
                placeholder="Enter blog title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={blog.slug}
                onChange={(e) =>
                  setEditingBlog({ ...(blog as Blog), slug: e.target.value })
                }
                placeholder="blog-url-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Short Description)</Label>
              <Input
                id="excerpt"
                value={blog.excerpt || ""}
                onChange={(e) =>
                  setEditingBlog({ ...(blog as Blog), excerpt: e.target.value })
                }
                placeholder="Brief description of the blog"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={blog.coverImage || ""}
                onChange={(e) =>
                  setEditingBlog({ ...(blog as Blog), coverImage: e.target.value })
                }
                placeholder="/uploads/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Rich Text Editor)</Label>
              <div className="bg-white dark:bg-gray-900 rounded-md">
                <ReactQuill
                  theme="snow"
                  value={blog.content}
                  onChange={(content) =>
                    setEditingBlog({ ...(blog as Blog), content })
                  }
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ indent: "-1" }, { indent: "+1" }],
                      [{ align: [] }],
                      ["blockquote", "code-block"],
                      ["link", "image"],
                      [{ color: [] }, { background: [] }],
                      ["clean"],
                    ],
                  }}
                  formats={[
                    "header",
                    "bold",
                    "italic",
                    "underline",
                    "strike",
                    "list",
                    "bullet",
                    "indent",
                    "align",
                    "blockquote",
                    "code-block",
                    "link",
                    "image",
                    "color",
                    "background",
                  ]}
                  style={{ minHeight: "400px" }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={blog.published}
                  onCheckedChange={(checked) =>
                    setEditingBlog({ ...(blog as Blog), published: checked })
                  }
                />
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this blog visible to the public
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={blog.featuredInWriting || false}
                  onCheckedChange={(checked) =>
                    setEditingBlog({ ...(blog as Blog), featuredInWriting: checked })
                  }
                />
                <div>
                  <Label htmlFor="featured">Feature in Writing Section</Label>
                  <p className="text-xs text-muted-foreground">
                    Show this blog in the homepage Writing section
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                if (isCreating) {
                  handleCreate();
                } else if (editingBlog) {
                  handleUpdate(editingBlog);
                }
              }}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? "Create Blog" : "Update Blog"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingBlog(emptyBlog as Blog);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Blog
        </Button>
      </div>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No blogs yet. Create your first blog post!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => (
            <Card key={blog.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{blog.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{blog.slug}
                    </p>
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          blog.published
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                      {blog.featuredInWriting && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBlog(blog)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(blog.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
