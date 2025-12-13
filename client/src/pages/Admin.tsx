import { useState } from "react";
import { useContent } from "@/hooks/use-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, Trash2 } from "lucide-react";

export default function Admin() {
  const { data: content, isLoading, refetch } = useContent();
  const [editedContent, setEditedContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Failed to load content.</p>
      </div>
    );
  }

  const currentContent = editedContent || content;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentContent),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast({
        title: "Success",
        description: "Content saved successfully!",
      });

      refetch();
      setEditedContent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (path: string[], value: any) => {
    const updated = JSON.parse(JSON.stringify(currentContent));
    let current = updated;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setEditedContent(updated);
  };

  const addItem = (arrayPath: string, newItem: any) => {
    const updated = JSON.parse(JSON.stringify(currentContent));
    updated[arrayPath].push(newItem);
    setEditedContent(updated);
  };

  const removeItem = (arrayPath: string, index: number) => {
    const updated = JSON.parse(JSON.stringify(currentContent));
    updated[arrayPath].splice(index, 1);
    setEditedContent(updated);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <ThemeToggle />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Portfolio CMS</h1>
            <p className="text-muted-foreground">Edit your portfolio content</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              View Site
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editedContent}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="tech">Tech Stack</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="visibility">
            <Card>
              <CardHeader>
                <CardTitle>Section Visibility</CardTitle>
                <CardDescription>Show or hide sections on your portfolio homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Projects Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your portfolio projects
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.projects}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "projects"], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Experience Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your work experience
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.experience}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "experience"], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Tech Stack Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display technologies you use
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.techStack}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "techStack"], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Testimonials Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display client testimonials
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.testimonials}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "testimonials"], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Writing Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your blog posts and articles
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.writing}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "writing"], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Contact Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display contact form and social links
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.contact}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "contact"], checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Edit your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={currentContent.profile.name}
                    onChange={(e) => updateContent(["profile", "name"], e.target.value)}
                  />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={currentContent.profile.title}
                    onChange={(e) => updateContent(["profile", "title"], e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={currentContent.profile.bio}
                    onChange={(e) => updateContent(["profile", "bio"], e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Add inline images using [img:url] or [img:url:alt-text]
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={currentContent.profile.email}
                    onChange={(e) => updateContent(["profile", "email"], e.target.value)}
                  />
                </div>
                <ImageUpload
                  label="Avatar Image"
                  value={currentContent.profile.avatarUrl}
                  onChange={(url) => updateContent(["profile", "avatarUrl"], url)}
                  helperText="Upload your profile picture or paste image URL"
                />
                <div>
                  <Label>Avatar Fallback</Label>
                  <Input
                    value={currentContent.profile.avatarFallback}
                    onChange={(e) => updateContent(["profile", "avatarFallback"], e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Manage your portfolio projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.projects.map((project: any, index: number) => (
                  <div key={project.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Project {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("projects", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={project.title}
                        onChange={(e) => updateContent(["projects", index, "title"], e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Short Description</Label>
                      <Textarea
                        value={project.description || ""}
                        onChange={(e) => updateContent(["projects", index, "description"], e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Live Project URL</Label>
                        <Input
                          value={project.liveUrl || ""}
                          onChange={(e) => updateContent(["projects", index, "liveUrl"], e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label>GitHub URL (optional)</Label>
                        <Input
                          value={project.githubUrl || ""}
                          onChange={(e) => updateContent(["projects", index, "githubUrl"], e.target.value)}
                          placeholder="https://github.com/username/repo"
                        />
                      </div>
                    </div>
                    <ImageUpload
                      label="Main Project Image"
                      value={project.imageUrl}
                      onChange={(url) => updateContent(["projects", index, "imageUrl"], url)}
                      helperText="Main image shown on homepage and project detail page"
                    />
                    <div>
                      <Label>Long Description (Project Detail Page)</Label>
                      <Textarea
                        value={project.longDescription || ""}
                        onChange={(e) => updateContent(["projects", index, "longDescription"], e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Additional Images (comma-separated URLs)</Label>
                      <Textarea
                        value={(project.additionalImages || []).join(", ")}
                        onChange={(e) => {
                          const urls = e.target.value.split(",").map(url => url.trim()).filter(url => url);
                          updateContent(["projects", index, "additionalImages"], urls);
                        }}
                        rows={2}
                        placeholder="/uploads/image1.png, /uploads/image2.png"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("projects", {
                      id: String(Date.now()),
                      title: "New Project",
                      imageUrl: "",
                      description: "",
                      longDescription: "",
                      liveUrl: "",
                      githubUrl: "",
                      additionalImages: [],
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Edit your work experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.experiences.map((exp: any, index: number) => (
                  <div key={exp.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Experience {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("experiences", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date Range</Label>
                        <Input
                          value={exp.dateRange}
                          onChange={(e) => updateContent(["experiences", index, "dateRange"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateContent(["experiences", index, "company"], e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={exp.role}
                        onChange={(e) => updateContent(["experiences", index, "role"], e.target.value)}
                      />
                    </div>
                    <ImageUpload
                      label="Company Logo (Optional)"
                      value={exp.companyLogoUrl || ""}
                      onChange={(url) => updateContent(["experiences", index, "companyLogoUrl"], url)}
                      helperText="If provided, this will replace the color circle"
                    />
                    <div>
                      <Label>Company Color (Fallback)</Label>
                      <Input
                        type="color"
                        value={exp.companyColor || "#666666"}
                        onChange={(e) => updateContent(["experiences", index, "companyColor"], e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used if no logo is provided
                      </p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateContent(["experiences", index, "description"], e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("experiences", {
                      id: String(Date.now()),
                      dateRange: "2024 - NOW",
                      role: "New Role",
                      company: "Company Name",
                      companyLogoUrl: "",
                      companyColor: "#666666",
                      description: "Description of your role and achievements",
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Experience
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials</CardTitle>
                <CardDescription>Manage client testimonials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.testimonials.map((testimonial: any, index: number) => (
                  <div key={testimonial.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Testimonial {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("testimonials", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div>
                      <Label>Quote</Label>
                      <Textarea
                        value={testimonial.quote}
                        onChange={(e) => updateContent(["testimonials", index, "quote"], e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Author Name</Label>
                        <Input
                          value={testimonial.authorName}
                          onChange={(e) => updateContent(["testimonials", index, "authorName"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Author Role</Label>
                        <Input
                          value={testimonial.authorRole}
                          onChange={(e) => updateContent(["testimonials", index, "authorRole"], e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Author Fallback</Label>
                      <Input
                        value={testimonial.authorFallback}
                        onChange={(e) => updateContent(["testimonials", index, "authorFallback"], e.target.value)}
                        placeholder="Initials (e.g., JD)"
                      />
                    </div>
                    <ImageUpload
                      label="Company Logo (Optional)"
                      value={testimonial.companyLogoUrl || ""}
                      onChange={(url) => updateContent(["testimonials", index, "companyLogoUrl"], url)}
                      helperText="If provided, this will replace the color circle"
                    />
                    <div>
                      <Label>Company Color (Fallback)</Label>
                      <Input
                        type="color"
                        value={testimonial.companyColor || "#FFB800"}
                        onChange={(e) => updateContent(["testimonials", index, "companyColor"], e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used if no logo is provided
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("testimonials", {
                      id: String(Date.now()),
                      quote: "Add testimonial quote here",
                      authorName: "Author Name",
                      authorRole: "Role at Company",
                      authorFallback: "AN",
                      companyLogoUrl: "",
                      companyColor: "#FFB800",
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Testimonial
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tech">
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
                <CardDescription>Edit technologies you use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.technologies.map((tech: any, index: number) => (
                  <div key={tech.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Technology {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("technologies", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={tech.name}
                          onChange={(e) => updateContent(["technologies", index, "name"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Icon</Label>
                        <Input
                          value={tech.icon}
                          onChange={(e) => updateContent(["technologies", index, "icon"], e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("technologies", {
                      id: String(Date.now()),
                      name: "New Technology",
                      icon: "icon-name",
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Technology
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="writing">
            <Card>
              <CardHeader>
                <CardTitle>Writing / Blog Posts</CardTitle>
                <CardDescription>Manage your blog posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.posts.map((post: any, index: number) => (
                  <div key={post.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Post {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("posts", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          value={post.date}
                          onChange={(e) => updateContent(["posts", index, "date"], e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Title</Label>
                        <Input
                          value={post.title}
                          onChange={(e) => updateContent(["posts", index, "title"], e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Read Time (minutes)</Label>
                      <Input
                        type="number"
                        value={post.readTime}
                        onChange={(e) => updateContent(["posts", index, "readTime"], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("posts", {
                      id: String(Date.now()),
                      date: new Date().toLocaleDateString("en-GB"),
                      title: "New Blog Post",
                      readTime: 5,
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Post
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>Edit your social media links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.socialLinks.map((link: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold capitalize">{link.platform}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("socialLinks", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateContent(["socialLinks", index, "label"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={link.value}
                          onChange={(e) => updateContent(["socialLinks", index, "value"], e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateContent(["socialLinks", index, "url"], e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("socialLinks", {
                      platform: "new-platform",
                      label: "New Platform",
                      value: "@username",
                      url: "https://example.com",
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Social Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
