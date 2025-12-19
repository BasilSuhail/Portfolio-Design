import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
}

export default function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'} flex flex-col`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-4 border-b bg-background">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewTab}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={`${isFullscreen ? 'flex-1' : 'w-full'} bg-gray-100 dark:bg-gray-900`}>
        <iframe
          src={`${pdfUrl}#view=FitH`}
          className={`w-full ${isFullscreen ? 'h-full' : 'h-[800px]'} border-0`}
          title={title}
        />
      </div>

      {/* Fallback for mobile or browsers that don't support iframe PDF viewing */}
      <noscript>
        <div className="p-8 text-center">
          <p className="mb-4">Your browser doesn't support PDF viewing.</p>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </noscript>
    </div>
  );
}
