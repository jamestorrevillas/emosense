// src/components/projects/ProjectActions.tsx
import { useState } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useNavigate } from "react-router-dom";
import { deleteAsset } from "@/lib/cloudinary/upload";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Archive, 
  Loader2, 
  MoreVertical, 
  Trash2,
  AlertCircle,
  Video,
  FileBarChart,
  Link2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectActionsProps {
  project: Project;
  onStatusChange?: () => void;
  onDeleted?: () => void;
}

export function ProjectActions({ project, onStatusChange, onDeleted }: ProjectActionsProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Delete from Cloudinary
      if (project.videoId) {
        try {
          await deleteAsset(project.videoId, 'video');
        } catch (cloudinaryError) {
          console.error("Error deleting video from Cloudinary:", cloudinaryError);
        }
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "projects", project.id));
      
      // Call onDeleted callback if provided
      onDeleted?.();
      
      // Navigate to projects list
      navigate('/app/projects');
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArchive = async () => {
    try {
      const newStatus = project.status === "archived" ? "active" : "archived";
      
      await updateDoc(doc(db, "projects", project.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      onStatusChange?.();
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 p-0 hover:bg-slate-100 focus-visible:ring-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={toggleArchive}
            className="py-2 cursor-pointer"
          >
            <Archive className="mr-2 h-4 w-4" />
            {project.status === "archived" ? "Restore Project" : "Archive Project"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 py-2 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle>Delete Project</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">This will permanently delete:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Video className="h-4 w-4" />
                  <span>Project video and content</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileBarChart className="h-4 w-4" />
                  <span>All responses and analytics data</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Link2 className="h-4 w-4" />
                  <span>Share links and access tokens</span>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
              className="rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="rounded-xl gap-2 hover:bg-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}