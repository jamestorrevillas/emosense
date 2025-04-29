// src/components/projects/ShareDialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/useToast";
import { Share2, Copy, ExternalLink, Link2, X } from "lucide-react";
import { Project } from "@/types/videoReview";
import { useAuth } from "@/contexts/AuthContext";
import { createToken } from "@/lib/utils/token";
import { Alert } from "@/components/ui/alert";

interface ShareDialogProps {
  project: Project;
}

export function ShareDialog({ project }: ShareDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const { toast } = useToast();

  const generateShareUrl = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to share projects",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      const tokenData = await createToken(project.id, user.uid, {
        allowAnonymous: true,
        active: true
      });

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/review/${project.id}/${tokenData.token}`;
      setShareUrl(url);

      toast({
        title: "Success",
        description: "Share link generated successfully",
      });
    } catch (err) {
      console.error("Error generating share URL:", err);
      toast({
        title: "Error",
        description: "Failed to generate share URL",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Success",
        description: "Link copied to clipboard. The review will open in a new tab when accessed.",
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

  const handlePreview = () => {
    window.open(`/review/${project.id}/preview`, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2 text-[#011BA1]">
            <Share2 className="h-5 w-5" />
            <DialogTitle>Share Project</DialogTitle>
          </div>
          <DialogDescription>
            Create and share a link to collect feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Preview Button */}
            <Button
              variant="outline"
              onClick={handlePreview}
              className="w-full rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Review
            </Button>

            {/* Share Link */}
            <div className="space-y-3">
              <Label>Share Link</Label>
              <div className="flex items-center w-full space-x-2">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                  <Link2 className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 overflow-hidden">
                    <Input
                      value={shareUrl}
                      readOnly
                      placeholder="Generate a link to share"
                      className="border-0 bg-transparent p-0 focus-visible:ring-0 w-full text-ellipsis"
                    />
                  </div>
                </div>
                {shareUrl ? (
                  <Button 
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl border-slate-200 hover:bg-slate-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={generateShareUrl}
                    disabled={isGenerating}
                    className="shrink-0 rounded-xl bg-[#011BA1] hover:bg-[#00008B]"
                  >
                    Generate
                  </Button>
                )}
              </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can submit a review
            </p>
          </div>

          {/* Status Info */}
          <Alert className="bg-slate-50 border-slate-200">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Status:</span>{" "}
                {project.status === 'active' ? 'Accepting responses' : 'Not accepting responses'}
              </p>
            </div>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}