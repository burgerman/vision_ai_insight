"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch } from "lucide-react";
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
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'code', 'hr', 'span', 'div', 'img'
      ],
      ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^&#/?!:.]+[\/?:#])/i,
    });
  }, [html]);

  return (
    <Card className="shadow-2xl border-none ring-1 ring-border/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="bg-muted/30 border-b py-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <FileSearch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Analysis Report</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Detailed intelligence insights</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white/50 dark:bg-black/10">
        <style dangerouslySetInnerHTML={{ __html: `
          .analysis-point {
            position: absolute;
            width: 12px;
            height: 12px;
            transform: translate(-50%, -50%);
            pointer-events: auto;
          }
          .analysis-marker {
            width: 100%;
            height: 100%;
            background-color: #2962FF;
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(41, 98, 255, 0.8);
          }
          .analysis-label {
            position: absolute;
            background-color: #2962FF;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            transform: translate(14px, -10px);
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          .dark .analysis-marker {
            background-color: #FF4081;
            box-shadow: 0 0 15px rgba(255, 64, 129, 0.8);
          }
          .dark .analysis-label {
            background-color: #FF4081;
          }
        `}} />
        <div className="p-8 md:p-12 lg:p-16 overflow-x-auto">
          <article 
            className="mx-auto max-w-4xl
              [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:mb-8 [&_h1]:mt-4 [&_h1]:text-primary [&_h1]:border-b-2 [&_h1]:pb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-6 [&_h2]:mt-12 [&_h2]:text-primary/90 [&_h2]:border-l-4 [&_h2]:border-primary/30 [&_h2]:pl-4
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-4 [&_h3]:mt-8 [&_h3]:text-foreground
              [&_p]:mb-6 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:text-lg
              [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:mb-8 [&_ul]:space-y-3
              [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:mb-8 [&_ol]:space-y-3
              [&_li]:text-muted-foreground [&_li]:pl-2 [&_li]:text-lg
              [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-10 [&_img]:shadow-xl [&_img]:ring-1 [&_img]:ring-border/50
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-10 [&_table]:shadow-md [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border-hidden
              [&_th]:bg-muted/80 [&_th]:p-4 [&_th]:text-left [&_th]:border [&_th]:font-bold [&_th]:text-primary [&_th]:text-sm [&_th]:uppercase [&_th]:tracking-wider
              [&_td]:p-4 [&_td]:border [&_td]:align-top [&_td]:bg-card/50 [&_td]:text-muted-foreground
              [&_strong]:text-foreground [&_strong]:font-bold
              [&_code]:bg-muted [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-md [&_code]:text-accent [&_code]:font-mono [&_code]:text-sm
              [&_hr]:my-16 [&_hr]:border-t-2 [&_hr]:border-muted/50
              [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:my-10 [&_blockquote]:text-muted-foreground/90 [&_blockquote]:text-xl
              [&_.relative]:relative [&_.absolute]:absolute [&_.inset-0]:inset-0 [&_.w-full]:w-full [&_.h-auto]:h-auto [&_.block]:block
            "
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
