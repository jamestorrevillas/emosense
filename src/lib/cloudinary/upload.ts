// src/lib/cloudinary/upload.ts
import { cloudinaryConfig } from './config';
import sha1 from 'crypto-js/sha1';

interface UploadResponse {
  secure_url: string;
  public_id: string;
  thumbnail_url?: string;
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  original_filename?: string;
  eager?: Array<{
    secure_url: string;
    transformation: string;
  }>;
}

export const uploadImage = async (
  file: File,
  folder: string = 'emosense/profile-images'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPresets.profile);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const generateThumbnail = (videoUrl: string) => {
  // Convert video URL to image URL for thumbnail
  const thumbnailUrl = videoUrl
    .replace('/video/upload/', '/video/upload/f_jpg,w_320,h_180,c_fill,so_0/')
    .replace('.mp4', '.jpg');
  
  console.log('Generated thumbnail URL:', thumbnailUrl);
  
  return thumbnailUrl;
};

export const uploadVideo = async (
  file: File,
  folder: string = 'emosense/project-videos'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPresets.video);
  formData.append('folder', folder);
  formData.append('resource_type', 'video');

  // Generate thumbnails at different timestamps
  formData.append('eager', [
    // Thumbnail at start
    'w_320,h_180,c_fill,so_0',
    // Thumbnail at 2 seconds
    'w_320,h_180,c_fill,so_2',
    // Thumbnail at 25%
    'w_320,h_180,c_fill,so_25p'
  ].join('|'));

  const fileName = file.name.replace(/\.[^/.]+$/, "");
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  formData.append('public_id', `${folder}/${sanitizedFileName}`);

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/video/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error?.message || 'Upload failed');
    }

    // Get the first thumbnail from eager transformations
    const thumbnail_url = responseData.eager?.[0]?.secure_url;

    return {
      secure_url: responseData.secure_url,
      public_id: responseData.public_id,
      thumbnail_url,
      duration: responseData.duration,
      format: responseData.format,
      width: responseData.width,
      height: responseData.height,
      original_filename: file.name,
      eager: responseData.eager
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteAsset = async (publicId: string, resourceType: 'image' | 'video' = 'video'): Promise<void> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = generateSignature(publicId, timestamp);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', cloudinaryConfig.apiKey);
    formData.append('timestamp', timestamp.toString());

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary response:', errorData);
      throw new Error(`Failed to delete ${resourceType}`);
    }

    console.log(`${resourceType} deleted successfully from Cloudinary`);
  } catch (error) {
    console.error(`Error deleting ${resourceType} from Cloudinary:`, error);
    throw error;
  }
};

function generateSignature(publicId: string, timestamp: number): string {
  const str = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
  return sha1(str).toString();
}