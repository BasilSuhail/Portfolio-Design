import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { secureFetch } from "@/lib/csrf";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
}

export function ImageUpload({ label, value, onChange, placeholder, helperText }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await secureFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      // Ensure the URL starts with / for relative paths
      const imageUrl = data.url.startsWith('/') ? data.url : `/${data.url}`;
      onChange(imageUrl);

      toast({
        title: "Success",
        description: `Image uploaded successfully! Use: ${imageUrl}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "https://example.com/image.png or upload below"}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearImage}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`file-${label}`)?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        <input
          id={`file-${label}`}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {value && (
        <div className="mt-2 p-2 border rounded-lg">
          <img
            src={value}
            alt="Preview"
            className="max-w-full max-h-32 object-contain mx-auto"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/150?text=Invalid+Image";
            }}
          />
        </div>
      )}
    </div>
  );
}
