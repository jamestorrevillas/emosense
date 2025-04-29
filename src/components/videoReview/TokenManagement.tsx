// src/components/videoReview/TokenManagement.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  query, 
  where, 
  doc,
  getDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ReviewToken } from "@/types/token";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { createToken } from "@/lib/utils/token";
import { 
  Link2, 
  Loader2, 
  XCircle,
  Calendar,
  Copy,
  Plus,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TokenStats } from './TokenStats';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TokenManagementProps {
  projectId: string;
}

export function TokenManagement({ projectId }: TokenManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ReviewToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<ReviewToken | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const tokensRef = collection(db, "tokens");
    const q = query(
      tokensRef,
      where("projectId", "==", projectId),
      where("createdBy", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const tokenData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<ReviewToken, 'id'>)
        })) as ReviewToken[];

        // Filter active tokens
        const validTokens = tokenData.filter(token => {
          const isExpired = new Date(token.expiresAt) < new Date();
          return token.settings.active && !isExpired;
        });

        setTokens(validTokens.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to load share links");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId, user]);

  const generateNewLink = async () => {
    if (!user) return;

    try {
      setIsGenerating(true);
      setError(null);

      // First verify project ownership
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists() || projectSnap.data().userId !== user.uid) {
        throw new Error("You don't have permission to create share links for this project");
      }

      await createToken(projectId, user.uid, {
        allowAnonymous: true,
        active: true
      });

      toast({
        title: "Success",
        description: "New share link generated successfully",
      });
    } catch (err) {
      console.error("Error generating token:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate share link";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async (token: ReviewToken) => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/review/${projectId}/${token.token}`;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      console.error("Error copying link:", err);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const handleRevoke = async (token: ReviewToken) => {
    setTokenToRevoke(token);
  };

  const confirmRevoke = async () => {
    if (!tokenToRevoke || !user) return;

    try {
      setRevoking(tokenToRevoke.id);
      setError(null);

      // Verify project ownership
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectSnap.data();
      if (projectData.userId !== user.uid) {
        throw new Error("You don't have permission to revoke this link");
      }

      // Delete the token
      await deleteDoc(doc(db, "tokens", tokenToRevoke.id));

      toast({
        title: "Success",
        description: "Share link revoked successfully",
      });
    } catch (err) {
      console.error("Error revoking token:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to revoke share link";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
      setTokenToRevoke(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>
            Manage active share links for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tokens.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No active share links
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map(token => {
                const baseUrl = window.location.origin;
                const url = `${baseUrl}/review/${projectId}/${token.token}`;

                return (
                  <div 
                    key={token.id}
                    className="border rounded-lg p-4 transition-all duration-200 hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate max-w-[500px]">{url}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleCopyLink(token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDistanceToNow(new Date(token.createdAt))} ago
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(token)}
                        disabled={revoking === token.id}
                        className="flex-shrink-0"
                      >
                        {revoking === token.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Stats section */}
                    <div className="mt-4 pt-4 border-t">
                      <TokenStats token={token} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate New Link Button */}
          <div className="mt-6">
            <Button 
              onClick={generateNewLink} 
              disabled={isGenerating}
              className="w-full rounded-xl bg-[#011BA1] hover:bg-[#00008B] transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Share Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <Dialog 
        open={!!tokenToRevoke} 
        onOpenChange={() => setTokenToRevoke(null)}
      >
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Revoke Share Link</DialogTitle>
            </div>
            <DialogDescription className="text-slate-600">
              Are you sure you want to revoke this share link? This action will immediately prevent any 
              new responses from being submitted using this link.
            </DialogDescription>
          </DialogHeader>

          {tokenToRevoke && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <p className="font-medium text-sm">Share link details:</p>
                
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDistanceToNow(new Date(tokenToRevoke.createdAt))} ago</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Status: Active</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>This action cannot be undone</span>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTokenToRevoke(null)}
              disabled={!!revoking}
              className="rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevoke}
              disabled={!!revoking}
              className="rounded-xl gap-2 hover:bg-red-600"
            >
              {revoking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Revoke Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}