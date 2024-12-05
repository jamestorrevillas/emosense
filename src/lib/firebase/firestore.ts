// src\lib\firebase\firestore.ts
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

export const initializeUserData = async (userId: string, data: {
  email: string;
  displayName?: string;
  photoURL?: string;
}) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      email: data.email,
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};