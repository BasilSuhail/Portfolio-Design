import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { secureFetch } from "@/lib/csrf";
import { Upload, Eye, EyeOff, Trash2, Image, X } from "lucide-react";

interface Photo {
  id: number;
  src: string;
  alt: string;
  location: string;
  date: string;
  orientation: "portrait" | "landscape" | "square";
}

interface BulkUploadFile {
  file: File;
  alt: string;
  location: string;
  date: string;
  orientation: "portrait" | "landscape" | "square";
  preview: string;
}

export function GalleryManager() {
  const [galleryVisible, setGalleryVisible] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<BulkUploadFile[]>([]);
  const [defaultLocation, setDefaultLocation] = useState("");
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultOrientation, setDefaultOrientation] = useState<"portrait" | "landscape" | "square">("landscape");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Bulk delete state
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, photosRes] = await Promise.all([
        fetch("/api/admin/gallery/settings"),
        fetch("/api/admin/gallery")
      ]);

      const settings = await settingsRes.json();
      const photosData = await photosRes.json();

      setGalleryVisible(settings.visible !== false);
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Failed to fetch gallery data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await secureFetch("/api/admin/gallery/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: galleryVisible }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: "Success",
        description: "Gallery section visibility updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update gallery settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newFiles: BulkUploadFile[] = files.map((file) => ({
      file,
      alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default alt
      location: defaultLocation,
      date: defaultDate,
      orientation: defaultOrientation,
      preview: URL.createObjectURL(file),
    }));

    setBulkFiles((prev) => [...prev, ...newFiles]);
  };

  const updateBulkFile = (index: number, field: keyof BulkUploadFile, value: string) => {
    setBulkFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, [field]: value } : file
      )
    );
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate all files have required fields
    const invalidFiles = bulkFiles.filter(
      (f) => !f.alt.trim() || !f.location.trim() || !f.date.trim()
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Error",
        description: "All photos must have alt text, location, and date filled in",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: bulkFiles.length });
    let successCount = 0;
    let failCount = 0;

    try {
      // Upload each file sequentially
      for (let i = 0; i < bulkFiles.length; i++) {
        const bulkFile = bulkFiles[i];

        // Update progress before starting upload
        setUploadProgress({ current: i + 1, total: bulkFiles.length });

        // Small delay to allow UI to update and prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
          const formData = new FormData();
          formData.append("photo", bulkFile.file);
          formData.append("alt", bulkFile.alt);
          formData.append("location", bulkFile.location);
          formData.append("date", bulkFile.date);
          formData.append("orientation", bulkFile.orientation);

          console.log("Uploading photo:", bulkFile.file.name);

          const response = await secureFetch("/api/admin/gallery/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            successCount++;
            console.log("✅ Upload success:", bulkFile.file.name);
          } else {
            const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
            console.error("❌ Upload failed:", bulkFile.file.name, response.status, errorData);
            failCount++;
          }
        } catch (err) {
          console.error("❌ Upload error:", bulkFile.file.name, err);
          failCount++;
        }
      }

      // Clean up previews
      bulkFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setBulkFiles([]);
      (document.getElementById("bulk-upload") as HTMLInputElement).value = "";

      // Show result
      if (failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}!`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Uploaded ${successCount} photo(s). ${failCount} failed.`,
          variant: "destructive",
        });
      }

      // Refresh photos
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one photo to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''}?`)) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const photoId of selectedPhotos) {
        try {
          const response = await secureFetch(`/api/admin/gallery/${photoId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error("Failed to delete photo:", photoId, err);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${successCount} photo${successCount > 1 ? 's' : ''}!`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Deleted ${successCount} photo(s). ${failCount} failed.`,
          variant: "destructive",
        });
      }

      setSelectedPhotos(new Set());
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const response = await secureFetch(`/api/admin/gallery/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete photo");

      toast({
        title: "Success",
        description: "Photo deleted successfully!",
      });

      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Section Settings</CardTitle>
          <CardDescription>
            Control the visibility of the gallery section on your homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base flex items-center gap-2">
                {galleryVisible ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                Show Gallery Section
              </Label>
              <p className="text-sm text-muted-foreground">
                Display photo gallery on your homepage
              </p>
            </div>
            <Switch
              checked={galleryVisible}
              onCheckedChange={setGalleryVisible}
            />
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Upload Photos
          </CardTitle>
          <CardDescription>
            Select multiple photos and upload them all at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default metadata */}
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">Default Metadata (applied to all selected photos)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="default-location" className="text-xs">Default Location</Label>
                <Input
                  id="default-location"
                  type="text"
                  placeholder="e.g., New York"
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="default-date" className="text-xs">Default Date</Label>
                <Input
                  id="default-date"
                  type="text"
                  placeholder="e.g., Summer 2024"
                  value={defaultDate}
                  onChange={(e) => setDefaultDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="default-orientation" className="text-xs">Default Orientation</Label>
                <select
                  id="default-orientation"
                  className="w-full border border-border bg-background text-foreground rounded-md p-1.5 text-sm h-8"
                  value={defaultOrientation}
                  onChange={(e) => setDefaultOrientation(e.target.value as "portrait" | "landscape" | "square")}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>
          </div>

          {/* File selector */}
          <div>
            <Label htmlFor="bulk-upload">Select Photos (Multiple)</Label>
            <Input
              id="bulk-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelect}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hold Ctrl/Cmd to select multiple files, or drag & drop
            </p>
          </div>

          {/* Selected files preview */}
          {bulkFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{bulkFiles.length} Photo{bulkFiles.length > 1 ? 's' : ''} Selected</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    bulkFiles.forEach((f) => URL.revokeObjectURL(f.preview));
                    setBulkFiles([]);
                  }}
                >
                  Clear All
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-3">
                {bulkFiles.map((bulkFile, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-card space-y-2">
                    <div className="flex gap-3">
                      <img
                        src={bulkFile.preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{bulkFile.file.name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeBulkFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="text"
                            placeholder="Alt text *"
                            value={bulkFile.alt}
                            onChange={(e) => updateBulkFile(index, "alt", e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="text"
                            placeholder="Location *"
                            value={bulkFile.location}
                            onChange={(e) => updateBulkFile(index, "location", e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="text"
                            placeholder="Date *"
                            value={bulkFile.date}
                            onChange={(e) => updateBulkFile(index, "date", e.target.value)}
                            className="h-7 text-xs"
                          />
                          <select
                            value={bulkFile.orientation}
                            onChange={(e) => updateBulkFile(index, "orientation", e.target.value)}
                            className="border border-border bg-background text-foreground rounded-md px-2 py-1 text-xs h-7"
                          >
                            <option value="landscape">Landscape</option>
                            <option value="portrait">Portrait</option>
                            <option value="square">Square</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {isUploading && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Uploading {uploadProgress.current} of {uploadProgress.total}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Please wait, this may take a few minutes...
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...` : `Upload ${bulkFiles.length} Photo${bulkFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Gallery Photos ({photos.length})
              </CardTitle>
              <CardDescription>
                Manage your uploaded photos
              </CardDescription>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={isDeleting}
                >
                  {selectedPhotos.size === photos.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedPhotos.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete {selectedPhotos.size} Selected
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No photos uploaded yet. Upload your first photo above!
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.id} className={`border rounded-lg overflow-hidden transition-all ${selectedPhotos.has(photo.id) ? 'ring-2 ring-primary' : ''}`}>
                    <div className="relative">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedPhotos.has(photo.id)}
                          onChange={() => togglePhotoSelection(photo.id)}
                          className="w-5 h-5 rounded cursor-pointer"
                          disabled={isDeleting}
                        />
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="font-medium text-sm truncate">{photo.location}</p>
                      <p className="text-xs text-muted-foreground">{photo.date}</p>
                      <p className="text-xs text-muted-foreground truncate">{photo.alt}</p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(photo.id)}
                        className="w-full"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
