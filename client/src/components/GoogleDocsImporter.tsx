import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Link as LinkIcon, Upload } from "lucide-react";
import mammoth from "mammoth";

interface GoogleDocsImporterProps {
  onImport: (html: string) => void;
}

export function GoogleDocsImporter({ onImport }: GoogleDocsImporterProps) {
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract Google Docs ID from URL
  const extractDocId = (url: string): string | null => {
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Import from Google Docs URL
  const handleUrlImport = async () => {
    const docId = extractDocId(googleDocsUrl);
    if (!docId) {
      alert("Invalid Google Docs URL. Please paste a valid Google Docs link.");
      return;
    }

    setIsImporting(true);
    try {
      // Google Docs export as .docx URL
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=docx`;

      // Fetch the .docx file
      const response = await fetch(exportUrl, {
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error("Failed to download document. Make sure the document is publicly accessible or you're logged into Google.");
      }

      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        onImport(result.value);
        setGoogleDocsUrl("");

        // Show any conversion warnings/messages
        if (result.messages.length > 0) {
          console.log("Conversion messages:", result.messages);
        }
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert(
        "Failed to import document. Please make sure:\n" +
        "1. The document is publicly accessible (Share → Anyone with the link can view)\n" +
        "2. You're logged into Google in this browser\n\n" +
        "Alternatively, download the document as .docx and use the file upload option below."
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Import from .docx file upload
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert("Please upload a .docx file (Microsoft Word format)");
      return;
    }

    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        onImport(result.value);

        // Show any conversion warnings/messages
        if (result.messages.length > 0) {
          console.log("Conversion messages:", result.messages);
        }
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to convert document. Please make sure it's a valid .docx file.");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Import from Google Docs</h3>
      </div>

      {/* Google Docs URL Import */}
      <div className="space-y-2">
        <Label htmlFor="google-docs-url" className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Paste Google Docs Link
        </Label>
        <div className="flex gap-2">
          <Input
            id="google-docs-url"
            type="url"
            placeholder="https://docs.google.com/document/d/..."
            value={googleDocsUrl}
            onChange={(e) => setGoogleDocsUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleUrlImport}
            disabled={!googleDocsUrl || isImporting}
            variant="secondary"
          >
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Make sure the document is publicly accessible (Share → Anyone with the link)
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t"></div>
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="flex-1 border-t"></div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="docx-file" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload .docx File
        </Label>
        <input
          ref={fileInputRef}
          id="docx-file"
          type="file"
          accept=".docx"
          onChange={handleFileImport}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
            cursor-pointer"
          disabled={isImporting}
        />
        <p className="text-xs text-muted-foreground">
          Download your Google Doc as .docx (File → Download → Microsoft Word)
        </p>
      </div>
    </div>
  );
}
