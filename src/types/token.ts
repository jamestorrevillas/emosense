// src/types/token.ts
export interface ReviewToken {
    id: string;
    projectId: string;
    token: string;
    createdAt: string;
    expiresAt: string;
    createdBy: string;
    settings: {
      allowAnonymous: boolean;
      active: boolean;
      maxResponses?: number;
    };
  }