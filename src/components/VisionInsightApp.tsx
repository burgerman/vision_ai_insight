"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Sparkles, Send } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import ResultsDisplay from "@/components/ResultsDisplay";
import { aiSafetyPreCheck } from "@/ai/flows/ai-safety-pre-check";

export default function VisionInsightApp() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Identify and label any defects in this image");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "validating" | "processing">("idle");
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
    setResultHtml(null);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return;

    setLoading(true);
    setResultHtml(null);
    setError(null);
    setStatus("validating");

    try {
      // 1. Convert file to data URI for safety check
      const imageDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Gemini Safety Pre-Check
      const safetyResult = await aiSafetyPreCheck({
        textPrompt: prompt,
        imageDataUri,
      });

      if (!safetyResult.isSafe) {
        throw new Error(`Safety check failed: ${safetyResult.message}`);
      }

      // 3. Main Execution
      setStatus("processing");
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("image", file);

      const response = await fetch("http://localhost:8000/robot-helper", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to process image with backend service.");
      }

      const html = await response.text();
      setResultHtml(html);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
      setStatus("idle");
    }
  };

  const isSubmitDisabled = !file || !prompt || loading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="shadow-xl border-none ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Analyze New Image
          </CardTitle>
          <CardDescription>
            Upload a technical photo and provide instructions for the AI analyst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Upload Image
                </label>
                <ImageUpload 
                  onFileSelect={handleFileSelect} 
                  disabled={loading} 
                  preview={preview}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Instructions
                </label>
                <Textarea
                  placeholder="Identify and label any defects in this image"
                  className="flex-1 min-h-[180px] resize-none focus:ring-accent"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitDisabled}
                className="w-full md:w-auto px-12 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {status === "validating" ? "Validating inputs..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Analyze Image
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {resultHtml && (
        <ResultsDisplay html={resultHtml} />
      )}
    </div>
  );
}