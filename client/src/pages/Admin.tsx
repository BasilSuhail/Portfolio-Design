import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { BlogManager } from "@/components/BlogManager";
import { Plus, Trash2, LogOut } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { data: content, isLoading, refetch } = useContent();
  const [editedContent, setEditedContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setLocation("/admin/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

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
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="intros">Intros</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="tech">Tech Stack</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
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
                    <Label className="text-base">Education Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your education and certifications
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.education}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "education"], checked)
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

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Game Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Display Pixel Shifter game
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.sectionVisibility.game}
                    onCheckedChange={(checked) =>
                      updateContent(["sectionVisibility", "game"], checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intros">
            <Card>
              <CardHeader>
                <CardTitle>Section Introductions</CardTitle>
                <CardDescription>Edit the introduction text for each section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Projects Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.projects || ""}
                    onChange={(e) => updateContent(["sectionIntros", "projects"], e.target.value)}
                    rows={2}
                    placeholder="Below are some select projects, full walkthroughs on request"
                  />
                </div>
                <div>
                  <Label>Experience Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.experience || ""}
                    onChange={(e) => updateContent(["sectionIntros", "experience"], e.target.value)}
                    rows={2}
                    placeholder="Throughout my career, I've worked on various projects..."
                  />
                </div>
                <div>
                  <Label>Education Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.education || ""}
                    onChange={(e) => updateContent(["sectionIntros", "education"], e.target.value)}
                    rows={2}
                    placeholder="My academic background and certifications"
                  />
                </div>
                <div>
                  <Label>Tech Stack Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.techStack || ""}
                    onChange={(e) => updateContent(["sectionIntros", "techStack"], e.target.value)}
                    rows={2}
                    placeholder="Technologies I work with"
                  />
                </div>
                <div>
                  <Label>Testimonials Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.testimonials || ""}
                    onChange={(e) => updateContent(["sectionIntros", "testimonials"], e.target.value)}
                    rows={2}
                    placeholder="What people say about working with me"
                  />
                </div>
                <div>
                  <Label>Writing Section Intro</Label>
                  <Textarea
                    value={currentContent.sectionIntros?.writing || ""}
                    onChange={(e) => updateContent(["sectionIntros", "writing"], e.target.value)}
                    rows={2}
                    placeholder="My thoughts and articles"
                  />
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Education Section Labels</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Achievements Label</Label>
                      <Input
                        value={currentContent.educationLabels?.achievementsLabel || "Achievements:"}
                        onChange={(e) => updateContent(["educationLabels", "achievementsLabel"], e.target.value)}
                        placeholder="Achievements:"
                      />
                    </div>
                    <div>
                      <Label>Certifications Label</Label>
                      <Input
                        value={currentContent.educationLabels?.certificationsLabel || "Certifications:"}
                        onChange={(e) => updateContent(["educationLabels", "certificationsLabel"], e.target.value)}
                        placeholder="Certifications:"
                      />
                    </div>
                  </div>
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

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-base font-semibold">Custom Sections</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const sections = exp.customSections || [];
                            updateContent(["experiences", String(index), "customSections"], [
                              ...sections,
                              { label: "Core Focus:", items: [] }
                            ]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Section
                        </Button>
                      </div>
                      {exp.customSections?.map((section: any, sectionIdx: number) => (
                        <div key={sectionIdx} className="border rounded-lg p-3 mb-3 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <Input
                              value={section.label}
                              onChange={(e) => updateContent(
                                ["experiences", String(index), "customSections", String(sectionIdx), "label"],
                                e.target.value
                              )}
                              placeholder="Section Label (e.g., Core Focus:)"
                              className="font-medium"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const sections = [...exp.customSections];
                                sections.splice(sectionIdx, 1);
                                updateContent(["experiences", String(index), "customSections"], sections);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Textarea
                            value={section.items?.map((item: any) => item.url ? `${item.name} | ${item.url}` : item.name).join("\n") || ""}
                            onChange={(e) => {
                              const lines = e.target.value.split("\n").filter((l: string) => l.trim());
                              const items = lines.map((line: string) => {
                                const parts = line.split("|").map((p: string) => p.trim());
                                return parts.length > 1
                                  ? { name: parts[0], url: parts[1] }
                                  : { name: parts[0] };
                              });
                              updateContent(["experiences", String(index), "customSections", String(sectionIdx), "items"], items);
                            }}
                            rows={3}
                            placeholder="Item Name | URL (optional)&#10;One per line"
                            className="text-sm"
                          />
                        </div>
                      ))}
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

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Edit your education and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.education?.map((edu: any, index: number) => (
                  <div key={edu.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Education {index + 1}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem("education", index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date Range</Label>
                        <Input
                          value={edu.dateRange}
                          onChange={(e) => updateContent(["education", String(index), "dateRange"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateContent(["education", String(index), "institution"], e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateContent(["education", String(index), "degree"], e.target.value)}
                      />
                    </div>
                    <ImageUpload
                      label="Institution Logo (Optional)"
                      value={edu.institutionLogoUrl || ""}
                      onChange={(url) => updateContent(["education", String(index), "institutionLogoUrl"], url)}
                      helperText="If provided, this will replace the color circle"
                    />
                    <div>
                      <Label>Institution Color (Fallback)</Label>
                      <Input
                        type="color"
                        value={edu.institutionColor || "#666666"}
                        onChange={(e) => updateContent(["education", String(index), "institutionColor"], e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used if no logo is provided
                      </p>
                    </div>
                    <div>
                      <Label>Coursework (Optional)</Label>
                      <Textarea
                        value={edu.coursework || ""}
                        onChange={(e) => updateContent(["education", String(index), "coursework"], e.target.value)}
                        rows={2}
                        placeholder="Relevant coursework, skills learned, etc."
                      />
                    </div>
                    <div>
                      <Label>Achievements (Optional)</Label>
                      <Textarea
                        value={edu.achievements?.join("\n") || ""}
                        onChange={(e) => updateContent(["education", String(index), "achievements"], e.target.value.split("\n").filter((a: string) => a.trim()))}
                        rows={3}
                        placeholder="One achievement per line (e.g., Dean's Merit Award)"
                      />
                    </div>
                    <div>
                      <Label>Certifications (Optional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Format: Certificate Name | URL (one per line). URL is optional.
                      </p>
                      <Textarea
                        value={edu.certifications?.map((c: any) => c.url ? `${c.name} | ${c.url}` : c.name).join("\n") || ""}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n").filter((l: string) => l.trim());
                          const certs = lines.map((line: string) => {
                            const parts = line.split("|").map((p: string) => p.trim());
                            return parts.length > 1
                              ? { name: parts[0], url: parts[1] }
                              : { name: parts[0] };
                          });
                          updateContent(["education", String(index), "certifications"], certs);
                        }}
                        rows={4}
                        placeholder="Certificate Name | https://example.com/cert"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-base font-semibold">Custom Sections</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const sections = edu.customSections || [];
                            updateContent(["education", String(index), "customSections"], [
                              ...sections,
                              { label: "New Section:", items: [] }
                            ]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Section
                        </Button>
                      </div>
                      {edu.customSections?.map((section: any, sectionIdx: number) => (
                        <div key={sectionIdx} className="border rounded-lg p-3 mb-3 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <Input
                              value={section.label}
                              onChange={(e) => updateContent(
                                ["education", String(index), "customSections", String(sectionIdx), "label"],
                                e.target.value
                              )}
                              placeholder="Section Label (e.g., Academic Projects:)"
                              className="font-medium"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const sections = [...edu.customSections];
                                sections.splice(sectionIdx, 1);
                                updateContent(["education", String(index), "customSections"], sections);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Textarea
                            value={section.items?.map((item: any) => item.url ? `${item.name} | ${item.url}` : item.name).join("\n") || ""}
                            onChange={(e) => {
                              const lines = e.target.value.split("\n").filter((l: string) => l.trim());
                              const items = lines.map((line: string) => {
                                const parts = line.split("|").map((p: string) => p.trim());
                                return parts.length > 1
                                  ? { name: parts[0], url: parts[1] }
                                  : { name: parts[0] };
                              });
                              updateContent(["education", String(index), "customSections", String(sectionIdx), "items"], items);
                            }}
                            rows={3}
                            placeholder="Item Name | URL (optional)&#10;One per line"
                            className="text-sm"
                          />
                        </div>
                      ))}
                      {(!edu.customSections || edu.customSections.length === 0) && (
                        <p className="text-sm text-muted-foreground italic">
                          No custom sections yet. Click "Add Section" to create one.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    addItem("education", {
                      id: String(Date.now()),
                      dateRange: "2020 - 2024",
                      degree: "Degree Name",
                      institution: "Institution Name",
                      institutionLogoUrl: "",
                      institutionColor: "#666666",
                      coursework: "",
                      customSections: [],
                      certifications: [],
                      achievements: [],
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Education
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

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Settings</CardTitle>
                <CardDescription>Manage contact form and calendar booking options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Contact Form</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the contact form on your portfolio
                    </p>
                  </div>
                  <Switch
                    checked={currentContent.contactSettings?.showForm ?? true}
                    onCheckedChange={(checked) =>
                      updateContent(["contactSettings", "showForm"], checked)
                    }
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Calendar Booking Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Add your Cal.com or Calendly booking links
                  </p>

                  <div className="space-y-2">
                    <Label>15 Minute Meeting Link</Label>
                    <Input
                      placeholder="https://app.cal.eu/yourusername/15min"
                      value={currentContent.contactSettings?.calendarLinks?.link15min || ""}
                      onChange={(e) =>
                        updateContent(["contactSettings", "calendarLinks", "link15min"], e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>30 Minute Meeting Link</Label>
                    <Input
                      placeholder="https://app.cal.eu/yourusername/30min"
                      value={currentContent.contactSettings?.calendarLinks?.link30min || ""}
                      onChange={(e) =>
                        updateContent(["contactSettings", "calendarLinks", "link30min"], e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blogs">
            <BlogManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
