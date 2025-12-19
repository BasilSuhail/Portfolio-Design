import fs from "fs/promises";
import path from "path";
import { supabase, isSupabaseConfigured } from "./supabase";

const blogsPath = path.join(process.cwd(), "blogs.json");

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentType?: 'html' | 'pdf'; // New: Type of content
  pdfUrl?: string; // New: URL to PDF file if contentType is 'pdf'
  content_type?: 'html' | 'pdf';
  pdf_url?: string;
  excerpt?: string;
  coverImage?: string;
  cover_image?: string;
  published: boolean;
  featuredInWriting?: boolean;
  featured_in_writing?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// Normalize blog object (convert snake_case to camelCase)
function normalizeBlog(blog: any): Blog {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    contentType: blog.content_type || blog.contentType || 'html',
    pdfUrl: blog.pdf_url || blog.pdfUrl,
    excerpt: blog.excerpt,
    coverImage: blog.cover_image || blog.coverImage,
    published: blog.published,
    featuredInWriting: blog.featured_in_writing ?? blog.featuredInWriting ?? false,
    createdAt: blog.created_at || blog.createdAt,
    updatedAt: blog.updated_at || blog.updatedAt,
  };
}

// Convert camelCase to snake_case for Supabase
function toSupabaseFormat(blog: Partial<Blog>) {
  const result: any = { ...blog };

  if (blog.coverImage) {
    result.cover_image = blog.coverImage;
    delete result.coverImage;
  }

  if (blog.contentType) {
    result.content_type = blog.contentType;
    delete result.contentType;
  }

  if (blog.pdfUrl) {
    result.pdf_url = blog.pdfUrl;
    delete result.pdfUrl;
  }

  if (blog.featuredInWriting !== undefined) {
    result.featured_in_writing = blog.featuredInWriting;
    delete result.featuredInWriting;
  }

  if (blog.createdAt) {
    result.created_at = blog.createdAt;
    delete result.createdAt;
  }

  if (blog.updatedAt) {
    result.updated_at = blog.updatedAt;
    delete result.updatedAt;
  }

  return result;
}

// Get all published blogs
export async function getAllBlogs(): Promise<Blog[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeBlog);
  }

  // Fallback to JSON file
  const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  const blogs = JSON.parse(data);
  return blogs.filter((blog: Blog) => blog.published).map(normalizeBlog);
}

// Get all blogs (including drafts) for admin
export async function getAllBlogsAdmin(): Promise<Blog[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeBlog);
  }

  // Fallback to JSON file
  const data = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  const blogs = JSON.parse(data);
  return blogs.map(normalizeBlog);
}

// Get single blog by slug
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) return null;
    return data ? normalizeBlog(data) : null;
  }

  // Fallback to JSON file
  const dataStr = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  const blogs = JSON.parse(dataStr);
  const blog = blogs.find((b: Blog) => b.slug === slug && b.published);
  return blog ? normalizeBlog(blog) : null;
}

// Create new blog
export async function createBlog(blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<Blog> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('blogs')
      .insert([toSupabaseFormat(blogData)])
      .select()
      .single();

    if (error) throw error;
    return normalizeBlog(data);
  }

  // Fallback to JSON file
  const dataStr = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  const blogs = JSON.parse(dataStr);

  const newBlog: Blog = {
    id: Date.now().toString(),
    ...blogData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  blogs.push(newBlog);
  await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));

  return normalizeBlog(newBlog);
}

// Update blog
export async function updateBlog(id: string, updates: Partial<Blog>): Promise<Blog | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('blogs')
      .update({ ...toSupabaseFormat(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return normalizeBlog(data);
  }

  // Fallback to JSON file
  const dataStr = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  const blogs = JSON.parse(dataStr);

  const index = blogs.findIndex((b: Blog) => b.id === id);
  if (index === -1) return null;

  blogs[index] = {
    ...blogs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));
  return normalizeBlog(blogs[index]);
}

// Delete blog
export async function deleteBlog(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Fallback to JSON file
  const dataStr = await fs.readFile(blogsPath, "utf-8").catch(() => "[]");
  let blogs = JSON.parse(dataStr);

  blogs = blogs.filter((b: Blog) => b.id !== id);
  await fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2));

  return true;
}
