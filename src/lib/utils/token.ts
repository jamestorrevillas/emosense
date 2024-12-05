// src/lib/utils/token.ts
import { 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ReviewToken } from "@/types/token";

// Generate a secure token
export function generateToken(): string {
  const random = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(random)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create a new token
export async function createToken(
  projectId: string, 
  userId: string,
  settings: ReviewToken['settings']
): Promise<ReviewToken> {
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + 30); // 30 days expiry

  const tokenData: Omit<ReviewToken, 'id'> = {
    projectId,
    token: generateToken(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: userId,
    settings
  };

  const docRef = await addDoc(collection(db, "tokens"), tokenData);

  return {
    id: docRef.id,
    ...tokenData
  };
}

// Validate a token
export async function validateToken(
  projectId: string,
  token: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    console.log('Starting token validation for:', { projectId, token });
    
    // Query for token
    const tokensRef = collection(db, "tokens");
    const tokenQuery = query(
      tokensRef, 
      where("projectId", "==", projectId),
      where("token", "==", token)
    );

    console.log('Executing token query...');
    const querySnapshot = await getDocs(tokenQuery);
    console.log('Query completed, documents found:', !querySnapshot.empty);

    if (querySnapshot.empty) {
      return { isValid: false, error: "Invalid or expired access token" };
    }

    const tokenData = querySnapshot.docs[0].data() as ReviewToken;
    console.log('Token data retrieved:', { ...tokenData, token: '***' });

    // Check expiration
    const now = new Date();
    const expiryDate = new Date(tokenData.expiresAt);
    if (expiryDate < now) {
      return { isValid: false, error: "This access token has expired" };
    }

    // Check if token is active
    if (!tokenData.settings.active) {
      return { isValid: false, error: "This access token is no longer active" };
    }

    // Check if project exists and is active
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        return { isValid: false, error: "Project not found" };
      }

      const project = projectSnap.data();
      if (project.status !== 'active') {
        return { isValid: false, error: "This project is not currently accepting responses" };
      }
    } catch (projectError) {
      console.error('Error checking project status:', projectError);
      return { isValid: false, error: "Unable to verify project status" };
    }

    return { isValid: true };
  } catch (err) {
    console.error('Token validation error:', err);
    return { 
      isValid: false, 
      error: "Unable to validate access token. Please try again or contact support." 
    };
  }
}