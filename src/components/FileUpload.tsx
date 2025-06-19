"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, XCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (fileContent: string, fileName: string) => void;
  acceptedFileType?: string; // e.g., ".csv, .txt"
  buttonText?: string;
  labelText?: string;
}

export default function FileUpload({ 
  onFileUpload, 
  acceptedFileType = ".csv",
  buttonText = "Upload File",
  labelText = "Choose a CSV file"
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "text/csv" || acceptedFileType.includes(file.name.slice(file.name.lastIndexOf(".")))) {
         setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: `Please select a valid file type (e.g., ${acceptedFileType}).`,
          variant: "destructive",
        });
        setSelectedFile(null);
        event.target.value = ""; // Reset file input
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onFileUpload(content, selectedFile.name);
        toast({ title: "File Processed", description: `${selectedFile.name} has been processed.` });
        setSelectedFile(null); 
        // Reset the input field visually - this requires a key change or direct DOM manipulation
        // For simplicity, we'll rely on selectedFile being null to update UI
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

      } catch (error) {
        toast({ title: "Error Processing File", description: "Could not read or process the file.", variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      toast({ title: "Error Reading File", description: "An error occurred while reading the file.", variant: "destructive" });
      setIsUploading(false);
    };
    reader.readAsText(selectedFile);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
      <Label htmlFor="file-upload-input" className="text-lg font-medium flex items-center gap-2">
        <UploadCloud className="h-6 w-6 text-primary" /> {labelText}
      </Label>
      <Input 
        id="file-upload-input" 
        type="file" 
        accept={acceptedFileType} 
        onChange={handleFileChange}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />
      {selectedFile && (
        <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span>{selectedFile.name}</span> 
            <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
          </div>
          <Button variant="ghost" size="icon" onClick={clearSelection} aria-label="Clear file selection">
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      )}
      <Button 
        onClick={handleUpload} 
        disabled={!selectedFile || isUploading} 
        className="w-full md:w-auto"
      >
        {isUploading ? "Processing..." : buttonText}
      </Button>
    </div>
  );
}
