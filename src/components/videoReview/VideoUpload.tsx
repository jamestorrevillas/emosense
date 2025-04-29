// src/components/projects/VideoUpload.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Video, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoUploadProps, UploadStatusType } from '@/types/video';

export const VideoUpload = ({
  onSelect,
  onClear,
  selectedFile,
  uploadStatus,
  maxSize = 100, // Default max size is 100MB
}: VideoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | undefined => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return 'Please select a video file';
    }

    // Check file size (MB)
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size must be less than ${maxSize}MB`;
    }
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      console.error(error);
      return;
    }

    onSelect(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadStatusColor = (status: UploadStatusType): string => {
    switch (status) {
      case 'error':
        return 'bg-destructive';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-primary';
    }
  };

  const getUploadStatusText = (status: UploadStatusType, progress: number): string => {
    switch (status) {
      case 'success':
        return 'Upload complete';
      case 'uploading':
        return `${progress}% uploaded`;
      default:
        return `${progress}% uploaded`;
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
        aria-label="Video file upload"
      />

      {!selectedFile && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors",
            dragOver ? "border-primary bg-accent/50" : "border-muted-foreground/25",
            "cursor-pointer"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Upload your video</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Drag and drop your video here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, WebM or OGG (Max {maxSize}MB)
            </p>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="bg-accent/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex-shrink-0">
                {selectedFile.preview ? (
                  <video
                    src={selectedFile.preview}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <Video className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
                </p>
                {(uploadStatus.status === 'uploading' || uploadStatus.status === 'success') && (
                  <div className="mt-2">
                    <Progress 
                      value={uploadStatus.progress} 
                      className={cn(
                        "h-1",
                        getUploadStatusColor(uploadStatus.status)
                      )}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getUploadStatusText(uploadStatus.status, uploadStatus.progress)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {uploadStatus.status !== 'uploading' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="flex-shrink-0"
                title="Remove video"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove video</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {uploadStatus.error && (
        <div className="px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md">
          {uploadStatus.error}
        </div>
      )}
      
    </div>
  );
};