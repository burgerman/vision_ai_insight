"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  preview: string | null;
}

export default function ImageUpload({ onFileSelect, disabled, preview }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      onFileSelect(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative h-[180px] w-full border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50",
        isDragging ? "border-accent bg-accent/5" : "border-border",
        disabled && "opacity-50 cursor-not-allowed",
        preview && "border-solid"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div className="relative w-full h-full group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Click to change</span>
          </div>
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-border/50">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PNG, JPG up to 10MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}