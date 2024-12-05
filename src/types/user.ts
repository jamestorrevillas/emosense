// src\types\user.ts
export interface User {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    photoId?: string; // Cloudinary public_id
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface UserProfile {
    displayName: string;
    email: string;
    photoURL: string;
    photoId: string;
  }