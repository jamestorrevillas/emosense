// src/lib/firebase/passwordReset.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    deleteDoc,
    updateDoc,
    Timestamp,
    doc 
  } from 'firebase/firestore';
  import { 
    getAuth, 
    signInWithEmailAndPassword,
    updatePassword,
    signOut
  } from 'firebase/auth';
  import { db } from './config';
  import emailjs from '@emailjs/browser';
  
  // Check if email exists in users collection
  export const checkEmailExists = async (email: string): Promise<boolean> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };
  
  // Generate a random 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Send confirmation code
  export const sendConfirmationCode = async (email: string): Promise<void> => {
    // Check if email exists
    const exists = await checkEmailExists(email);
    if (!exists) {
      throw new Error('No account found with this email address');
    }
  
    // Generate new code
    const code = generateCode();
    
    // Store code in Firestore
    const codesRef = collection(db, 'resetCodes');
    await addDoc(codesRef, {
      email,
      code,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)), // 15 minutes
      used: false
    });
  
    // Send email using EmailJS
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          verification_code: code,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
    } catch (error) {
      console.error('Email error:', error);
      throw new Error('Failed to send verification email');
    }
  };
  
  // Verify confirmation code
  export const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const codesRef = collection(db, 'resetCodes');
    const q = query(
      codesRef, 
      where('email', '==', email),
      where('code', '==', code),
      where('used', '==', false)
    );
  
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
  
    const resetCode = snapshot.docs[0];
    const data = resetCode.data();
    
    // Check if code is expired
    if (data.expiresAt.toDate() < new Date()) {
      await deleteDoc(resetCode.ref);
      throw new Error('Code has expired');
    }
    
    return true;
  };
  
  // Reset password
  export const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
    const auth = getAuth();
  
    try {
      // First verify the code is valid
      const isValid = await verifyCode(email, code);
      if (!isValid) {
        throw new Error('Invalid or expired code');
      }
  
      // Get user document to verify the email exists
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email));
      const userSnapshot = await getDocs(userQuery);
  
      if (userSnapshot.empty) {
        throw new Error('User not found');
      }
  
      // Sign in temporarily with provided email and code
      // Note: In this case, we're using the verification code as a temporary password
      await signInWithEmailAndPassword(auth, email, code);
  
      // Now that we're signed in, we can update the password
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
  
        // Update last password change timestamp
        await updateDoc(doc(db, 'users', userSnapshot.docs[0].id), {
          lastPasswordChange: Timestamp.now()
        });
      }
  
      // Clean up used codes
      const codesRef = collection(db, 'resetCodes');
      const codesQuery = query(codesRef, where('email', '==', email));
      const codesSnapshot = await getDocs(codesQuery);
      
      // Delete all codes for this email
      const deletePromises = codesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
  
      // Sign out after password change
      await signOut(auth);
  
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error('Failed to reset password. Please try again.');
    }
  };