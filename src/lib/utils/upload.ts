// src\lib\utils\upload.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  // Create a reference to the file location
  const storageRef = ref(storage, path);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

export const validateImage = (file: File): string | null => {
  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return "File size must be less than 2MB";
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return "File must be JPEG, PNG, or GIF";
  }

  return null;
};