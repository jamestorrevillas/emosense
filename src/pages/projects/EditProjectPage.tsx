// src/pages/projects/EditProjectPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Project, 
  QuickRatingSettings, 
  QuickRatingType, 
  RATING_TYPES, 
  Question 
} from "@/types/project";
import { VideoFile, UploadStatus, CloudinaryUploadResponse } from "@/types/video";
import { deleteAsset } from "@/lib/cloudinary/upload";
import { cloudinaryConfig } from "@/lib/cloudinary/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickRating } from "@/components/projects/QuickRating";
import { SurveyBuilder } from "@/components/projects/survey/SurveyBuilder";
import { VideoUpload } from "@/components/projects/VideoUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const EditProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);

  // Form States
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Quick Rating States
  const [enableQuickRating, setEnableQuickRating] = useState<boolean>(true);
  const [ratingType, setRatingType] = useState<QuickRatingType>("stars");
  const [ratingTitle, setRatingTitle] = useState<string>("How would you rate this video?");
  const [ratingDescription, setRatingDescription] = useState<string>("");

  // Video States
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | undefined>();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    progress: 0,
    status: 'idle'
  });

  // Cleanup effect for object URL
  useEffect(() => {
    return () => {
      if (selectedVideo?.preview) {
        URL.revokeObjectURL(selectedVideo.preview);
      }
    };
  }, [selectedVideo]);

  const handleVideoSelect = async (file: File) => {
    try {
      setUploadStatus({ status: 'selecting', progress: 0 });

      // Create object URL for preview
      const preview = URL.createObjectURL(file);
      
      // Store selected file info
      setSelectedVideo({
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      
      setUploadStatus({ status: 'selected', progress: 0 });
    } catch (err) {
      console.error('Error handling video selection:', err);
      setUploadStatus({
        status: 'error',
        progress: 0,
        error: 'Failed to process selected video'
      });
    }
  };

  const handleVideoClear = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(undefined);
    setUploadStatus({ status: 'idle', progress: 0 });
  };

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        setError("");

        const projectRef = doc(db, "projects", id);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          setError("Project not found");
          return;
        }

        const projectData = projectSnap.data() as Project;

        // Verify user owns this project
        if (projectData.userId !== user.uid) {
          setError("You don't have permission to edit this project");
          return;
        }

        // Set project data
        setProject(projectData);
        
        // Set form values
        setTitle(projectData.title);
        setDescription(projectData.description);
        setQuestions(projectData.survey?.questions || []);
        setEnableQuickRating(projectData.quickRating?.enabled || false);
        setRatingType(projectData.quickRating?.type || 'stars');
        setRatingTitle(projectData.quickRating?.title || '');
        setRatingDescription(projectData.quickRating?.description || "");

      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !user) return;

    try {
      setIsSaving(true);
      setError("");

      let videoUpdateData = {};

      // Handle video upload if new video is selected
      if (selectedVideo) {
        setUploadStatus({ status: 'uploading', progress: 0 });

        // Upload new video to Cloudinary with progress tracking
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        
        // Prepare upload data
        formData.append('file', selectedVideo.file);
        formData.append('upload_preset', cloudinaryConfig.uploadPresets.video);
        formData.append('folder', 'emosense/project-videos');
        formData.append('resource_type', 'video');

        const fileName = selectedVideo.file.name.replace(/\.[^/.]+$/, "");
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        formData.append('public_id', `emosense/project-videos/${sanitizedFileName}`);
        
        // Create upload promise with progress tracking
        const uploadPromise = new Promise<CloudinaryUploadResponse>((resolve, reject) => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadStatus({ status: 'uploading', progress });
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.response);
              resolve(response);
            } else {
              reject(new Error('Upload failed'));
            }
          };
          
          xhr.onerror = () => reject(new Error('Upload failed'));
        });

        // Send the request
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/video/upload`);
        xhr.send(formData);

        // Wait for upload to complete
        const uploadResult = await uploadPromise;
        setUploadStatus({ status: 'success', progress: 100 });

        // Delete old video from Cloudinary
        try {
          await deleteAsset(project.videoId, 'video');
        } catch (deleteError) {
          console.error("Error deleting old video:", deleteError);
          // Continue with update even if deletion fails
        }

        // Prepare video update data
        videoUpdateData = {
          videoUrl: uploadResult.secure_url,
          videoId: uploadResult.public_id,
          thumbnailUrl: uploadResult.thumbnail_url || null,
        };

        // Only add videoFileName if it exists
        if (uploadResult.original_filename) {
          videoUpdateData = {
            ...videoUpdateData,
            videoFileName: uploadResult.original_filename
          };
        }
      }

      // Prepare quick rating settings
      const quickRatingSettings: QuickRatingSettings = {
        enabled: enableQuickRating,
        type: ratingType,
        required: true,
        title: ratingTitle,
        description: ratingDescription || "",
        scale: RATING_TYPES[ratingType],
        labels: RATING_TYPES[ratingType].labels,
      };

      // Clean up questions with proper type handling
      const cleanQuestions = questions.map(question => {
        const { ...cleanQuestion } = question;

        switch (cleanQuestion.type) {
          case 'text':
            if (cleanQuestion.placeholder === undefined) delete cleanQuestion.placeholder;
            if (cleanQuestion.maxLength === undefined) delete cleanQuestion.maxLength;
            break;
          case 'rating_scale':
            if (cleanQuestion.minLabel === undefined) delete cleanQuestion.minLabel;
            if (cleanQuestion.maxLabel === undefined) delete cleanQuestion.maxLabel;
            if (cleanQuestion.step === undefined) delete cleanQuestion.step;
            break;
        }

        return cleanQuestion;
      });

      // Update project in Firestore
      const updateData = {
        title,
        description,
        quickRating: quickRatingSettings,
        survey: {
          ...project.survey,
          questions: cleanQuestions,
        },
        updatedAt: new Date().toISOString(),
        ...videoUpdateData,
      };

      await updateDoc(doc(db, "projects", project.id), updateData);

      // Navigate back to project details
      navigate(`/app/projects/${project.id}`);

    } catch (err) {
      console.error("Error updating project:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update project"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#011BA1]" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-xl">
              {error || "Project not found"}
            </div>
            <Button 
              asChild
              className="bg-[#011BA1] hover:bg-[#00008B]"
            >
              <Link to="/app/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              type="button"
              onClick={() => navigate(`/app/projects/${project.id}`)}
              className="text-slate-600 hover:text-[#011BA1]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Badge 
              variant="outline" 
              className={`text-xs ${
                project.status === "active" 
                  ? "bg-green-50 text-green-600 border-green-300" 
                  : "bg-slate-50 text-slate-600 border-slate-300"
              }`}
            >
              {project.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
            <CardDescription>
              Update your project details and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Project Title</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Video Upload Section */}
            <div className="space-y-4">
              <Label className="text-base">Project Video</Label>
              {!selectedVideo && (
                <div className="mb-4">
                  <div className="overflow-hidden rounded-xl border bg-muted aspect-video">
                    <video
                      src={project.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      poster={project.thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current video: {project.videoFileName || 'video file'}
                  </p>
                </div>
              )}
              <VideoUpload
                onSelect={handleVideoSelect}
                onClear={handleVideoClear}
                selectedFile={selectedVideo}
                uploadStatus={uploadStatus}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Rating Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Rating</CardTitle>
            <CardDescription>
              Configure the rating that appears right after the video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quick-rating" className="text-base">Enable Quick Rating</Label>
                <p className="text-sm text-muted-foreground">
                  Collect immediate feedback after video playback
                </p>
              </div>
              <Switch
                id="quick-rating"
                checked={enableQuickRating}
                onCheckedChange={setEnableQuickRating}
              />
            </div>

            {enableQuickRating && (
              <>
                <Separator />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base">Rating Type</Label>
                    <Select
                      value={ratingType}
                      onValueChange={(value: QuickRatingType) => setRatingType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stars">Stars Rating</SelectItem>
                        <SelectItem value="numeric">Numeric Rating</SelectItem>
                        <SelectItem value="thumbs">Thumbs Up/Down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating-title" className="text-base">Rating Title</Label>
                    <Input
                      id="rating-title"
                      placeholder="Enter rating title"
                      value={ratingTitle}
                      onChange={(e) => setRatingTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating-description" className="text-base">Rating Description</Label>
                    <Input
                      id="rating-description"
                      placeholder="Enter rating description"
                      value={ratingDescription}
                      onChange={(e) => setRatingDescription(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-base">Rating Preview</Label>
                    <QuickRating
                      settings={{
                        enabled: true,
                        type: ratingType,
                        required: true,
                        title: ratingTitle,
                        description: ratingDescription,
                        scale: RATING_TYPES[ratingType],
                        labels: RATING_TYPES[ratingType].labels,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Survey Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Questions</CardTitle>
            <CardDescription>
              Add, edit, or remove questions to collect detailed feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SurveyBuilder
              questions={questions}
              onChange={setQuestions}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/app/projects/${project.id}`)}
            disabled={isSaving || uploadStatus.status === 'uploading'}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-4">
            {uploadStatus.status === 'uploading' && (
              <p className="text-sm text-muted-foreground">
                Uploading video...
              </p>
            )}
            <Button 
              type="submit" 
              disabled={isSaving || uploadStatus.status === 'uploading'}
              className="min-w-[120px] bg-[#011BA1] hover:bg-[#00008B]"
            >
              {uploadStatus.status === 'uploading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStatus.progress}%
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};