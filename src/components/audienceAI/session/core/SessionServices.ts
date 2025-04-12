// src/components/audienceAI/session/core/SessionServices.ts
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc,
    getDocs,
    query,
    where,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  import { StoredEmotionData, sanitizeForFirestore, SessionMetrics } from './SessionUtils';
  
  // Create a new session document in Firestore
  export async function createSession(userId: string): Promise<string> {
    const sessionData = {
      userId,
      title: "Untitled Session",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "in_progress",
      duration: 0,
      maxFaceCount: 0,
      autoSaved: true,
      presentationMetrics: {
        attentionScore: 0,
        engagementScore: 0,
        emotionalImpactScore: 0,
        overallScore: 0
      }
    };
    
    // Save to Firestore
    const sessionsRef = collection(db, "audienceSessions");
    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  }
  
  // Save emotion data to Firestore
  export async function saveEmotionData(sessionId: string, dataPoints: StoredEmotionData[]): Promise<void> {
    if (!sessionId || dataPoints.length === 0) return;
    
    // Sanitize items before saving to Firestore to remove undefined values
    const sanitizedItems = dataPoints.map(item => sanitizeForFirestore(item));
    
    // Save them in parallel
    const emotionCollectionRef = collection(db, `audienceSessions/${sessionId}/emotionData`);
    
    await Promise.all(
      sanitizedItems.map(dataPoint => addDoc(emotionCollectionRef, dataPoint))
    );
  }
  
  // Update session metrics 
  export async function updateSessionMetrics(
    sessionId: string, 
    duration: number, 
    maxFaceCount: number, 
    metrics?: Partial<SessionMetrics>
  ): Promise<void> {
    if (!sessionId) return;
    
    const sessionRef = doc(db, "audienceSessions", sessionId);
    
    // Calculate some basic metrics if not provided
    const defaultMetrics = {
      attentionScore: Math.min(95, 50 + (maxFaceCount * 5)),
      engagementScore: Math.min(90, 40 + (Math.min(duration, 600000) / 60000 * 10)),
      emotionalImpactScore: 75, 
    };
    
    const finalMetrics = {
      ...defaultMetrics,
      ...metrics,
    };
    
    // Ensure overall score is calculated
    if (!finalMetrics.overallScore) {
      finalMetrics.overallScore = Math.round(
        (finalMetrics.attentionScore + finalMetrics.engagementScore + finalMetrics.emotionalImpactScore) / 3
      );
    }
    
    // Update the session document
    await updateDoc(sessionRef, {
      status: "recorded",
      duration,
      maxFaceCount,
      updatedAt: serverTimestamp(),
      presentationMetrics: finalMetrics
    });
  }
  
  // Finalize session with name
  export async function finalizeSession(
    sessionId: string, 
    title: string
  ): Promise<void> {
    if (!sessionId) return;
    
    const titleToUse = title.trim() || "Untitled Session";
    const sessionRef = doc(db, "audienceSessions", sessionId);
    
    // Update the session document with the user-provided title
    await updateDoc(sessionRef, {
      title: titleToUse,
      status: "completed",
      updatedAt: serverTimestamp()
    });
  }
  
  // Check for duplicate session names
  export async function checkDuplicateSessionName(
    userId: string,
    name: string,
    currentSessionId?: string
  ): Promise<boolean> {
    if (!userId) return false;
    
    const sessionsRef = collection(db, "audienceSessions");
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("title", "==", name)
    );
    
    const snapshot = await getDocs(q);
    
    // Check if any document found is not the current session
    for (const doc of snapshot.docs) {
      if (doc.id !== currentSessionId) {
        return true; // Found a different session with same name
      }
    }
    
    return false; // No duplicates found (or only found current session)
  }
  
  // Generate the next untitled session name
  export async function getNextUntitledName(userId: string): Promise<string> {
    if (!userId) return "Untitled Session";
    
    const sessionsRef = collection(db, "audienceSessions");
    const q = query(
      sessionsRef,
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return "Untitled Session";
    }
    
    // Collect all existing session titles
    const existingTitles = snapshot.docs.map(doc => doc.data().title as string);
    
    // Check if "Untitled Session" exists
    const hasUntitledSession = existingTitles.includes("Untitled Session");
    
    // Find all numbered untitled sessions
    const untitledNumberPattern = /^Untitled Session (\d+)$/;
    const numberedSessions = existingTitles
      .filter(title => untitledNumberPattern.test(title))
      .map(title => {
        const match = title.match(untitledNumberPattern);
        return match ? parseInt(match[1], 10) : 0;
      })
      .sort((a, b) => a - b);
    
    // If no "Untitled Session" exists, use it
    if (!hasUntitledSession) {
      return "Untitled Session";
    }
    
    // Find the first available number
    let nextNumber = 1;
    for (const num of numberedSessions) {
      if (num !== nextNumber) {
        break;
      }
      nextNumber++;
    }
    
    return `Untitled Session ${nextNumber}`;
  }