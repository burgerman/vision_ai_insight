"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

interface ResultsDisplayProps {
  html: string;
}

export default function ResultsDisplay({ html }: ResultsDisplayProps) {
  // Sanitize HTML to prevent XSS attacks while allowing safe technical reporting tags
  const sanitizedHtml = useMemo(() => {
    if (typeof window === "undefined") return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'code', 'hr'
      ],
      ALLOWED_ATTR: ['class']
    });
  }, [html]);

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-report-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden animate-in zoom-in-95 duration-500">
      <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Analysis Results</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 h-8">
          <Download className="h-3.5 w-3.5" />
          Export HTML
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 md:p-8 overflow-x-auto">
          <div 
            className="prose prose-slate max-w-none 
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-primary
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-primary/90
              [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
              [&_p]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1 [&_li]:text-muted-foreground
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm
              [&_th]:bg-muted/50 [&_th]:p-3 [&_th]:text-left [&_th]:border [&_th]:font-semibold
              [&_td]:p-3 [&_td]:border [&_td]:align-top
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-accent
              [&_hr]:my-8 [&_hr]:border-t
            "
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
