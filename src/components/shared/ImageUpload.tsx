// src\components\shared\ImageUpload.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { deleteAsset } from '@/lib/cloudinary/upload';

interface ImageUploadProps {
  onSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
  maxSize?: number;
  currentImageId?: string;  // Add this prop
}

export const ImageUpload = ({ 
  onSelect, 
  isLoading, 
  accept = "image/jpeg,image/png,image/gif", 
  maxSize = 1,
  currentImageId  // Add this prop
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    const validTypes = accept.split(',');
    if (!validTypes.includes(file.type)) {
      return `Please select a valid file type (${accept})`;
    }

    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File must be smaller than ${maxSize}MB`;
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Delete old image if exists
    if (currentImageId) {
      try {
        await deleteAsset(currentImageId, 'image')
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with upload even if deletion fails
      }
    }

    onSelect(file);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <Button 
        type="button"
        variant="outline" 
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Camera className="h-4 w-4" />
        Change Photo
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};