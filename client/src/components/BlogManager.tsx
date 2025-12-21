import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit, Save, Upload, Image as ImageIcon, FileText } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { secureFetch } from "@/lib/csrf";
import { GoogleDocsImporter } from "./GoogleDocsImporter";

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
  featuredInWriting?: boolean;
  customDate?: string; // Custom display date for blog posts
  createdAt: string;
  updatedAt: string;
}

export function BlogManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const emptyBlog: Omit<Blog, "id" | "createdAt" | "updatedAt"> = {
    title: "",
    slug: "",
    content: "",
    contentType: "html",
    pdfUrl: "",
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
      // For PDF blogs, set placeholder content if not provided
      const blogData = {
        ...editingBlog,
        content: editingBlog.contentType === 'pdf' && !editingBlog.content
          ? `PDF Document: ${editingBlog.title}`
          : editingBlog.content
      };

      const response = await secureFetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
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
      const response = await secureFetch(`/api/admin/blogs/${blog.id}`, {
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
      const response = await secureFetch(`/api/admin/blogs/${id}`, {
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

  // Handle image upload (for cover image or inline images)
  const handleImageUpload = async (file: File, isInline: boolean = false): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await secureFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

      return data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async (file: File): Promise<string> => {
    setIsPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await secureFetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("PDF upload failed");

      const data = await response.json();

      toast({
        title: "Success",
        description: `PDF uploaded successfully! Size: ${data.size}`,
      });

      return data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsPdfUploading(false);
    }
  };

  // Upload PDF for blog
  const uploadPdfForBlog = async () => {
    if (!pdfInputRef.current) return;

    const file = pdfInputRef.current.files?.[0];
    if (!file) return;

    try {
      const url = await handlePdfUpload(file);

      // Update editing blog with PDF URL and change content type
      if (editingBlog) {
        setEditingBlog({
          ...editingBlog,
          pdfUrl: url,
          contentType: 'pdf',
        });
      }

      // Reset file input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    } catch (error) {
      console.error("PDF upload error:", error);
    }
  };

  // Insert image into editor at cursor
  const insertImageIntoEditor = async () => {
    if (!fileInputRef.current) return;

    const file = fileInputRef.current.files?.[0];
    if (!file) return;

    try {
      const url = await handleImageUpload(file, true);

      // Insert image into Quill editor
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        quill.insertEmbed(range?.index || 0, 'image', url);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Failed to insert image:", error);
    }
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
              <Label htmlFor="customDate">Custom Display Date (Optional)</Label>
              <Input
                id="customDate"
                type="date"
                value={blog.customDate || ""}
                onChange={(e) =>
                  setEditingBlog({ ...(blog as Blog), customDate: e.target.value })
                }
                placeholder="YYYY-MM-DD"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use creation date. This date will be shown on blog cards.
              </p>
            </div>

            {/* Content Type Selector */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="html"
                    checked={blog.contentType === 'html'}
                    onChange={(e) =>
                      setEditingBlog({ ...(blog as Blog), contentType: e.target.value as 'html' | 'pdf' })
                    }
                    className="w-4 h-4"
                  />
                  <span>Rich Text (HTML)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="pdf"
                    checked={blog.contentType === 'pdf'}
                    onChange={(e) =>
                      setEditingBlog({ ...(blog as Blog), contentType: e.target.value as 'html' | 'pdf' })
                    }
                    className="w-4 h-4"
                  />
                  <span>PDF Document</span>
                </label>
              </div>
            </div>

            {/* PDF Upload Section - Show only when content type is PDF */}
            {blog.contentType === 'pdf' && (
              <div className="space-y-2">
                <Label>Upload PDF Document</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={uploadPdfForBlog}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isPdfUploading}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isPdfUploading ? "Uploading..." : blog.pdfUrl ? "Change PDF" : "Upload PDF"}
                    </Button>
                    {blog.pdfUrl && (
                      <a
                        href={blog.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent"
                      >
                        View Current PDF
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📄 Upload your research paper, report, or any PDF document (max 50MB)
                  </p>
                  {blog.pdfUrl && (
                    <Input
                      value={blog.pdfUrl}
                      onChange={(e) =>
                        setEditingBlog({ ...(blog as Blog), pdfUrl: e.target.value })
                      }
                      placeholder="/uploads/document.pdf"
                      className="text-xs"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Rich Text Editor - Show only when content type is HTML */}
            {blog.contentType === 'html' && (
              <div className="space-y-4">
                {/* Google Docs Importer */}
                <GoogleDocsImporter
                  onImport={(html) => {
                    setEditingBlog({ ...(blog as Blog), content: html });
                  }}
                />

                <div className="flex items-center justify-between">
                  <Label>Content (Rich Text Editor)</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={insertImageIntoEditor}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Insert Image"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Tip: You can also paste from Google Docs (Ctrl/Cmd+V) to preserve formatting, or drag & drop images directly into the editor
              </p>
              <div className="bg-white dark:bg-gray-900 rounded-md">
                <ReactQuill
                  ref={quillRef}
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
            )}

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
