// src/types/video.ts

// Selected video file state
export interface VideoFile {
    file: File;
    preview: string;  // Object URL for preview
    name: string;
    size: number;
    type: string;
  }
  
  // Upload status type
  export type UploadStatusType = 
    | 'idle' 
    | 'selecting' 
    | 'selected' 
    | 'uploading' 
    | 'success' 
    | 'error';
  
  // Upload progress state
  export interface UploadStatus {
    progress: number;
    status: UploadStatusType;
    error?: string;
  }
  
  // Cloudinary upload response
  export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    thumbnail_url?: string;
    duration?: number;
    format?: string;
    width?: number;
    height?: number;
    original_filename?: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    folder: string;
  }
  
  // Props for VideoUpload component
  export interface VideoUploadProps {
    onSelect: (file: File) => void;
    onClear: () => void;
    selectedFile?: VideoFile;
    uploadStatus: UploadStatus;
    maxSize?: number; // in MB, defaults to 100
  }