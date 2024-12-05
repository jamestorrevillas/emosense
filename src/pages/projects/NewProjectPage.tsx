// src/pages/projects/NewProjectPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoUpload } from "@/components/projects/VideoUpload";
import { QuickRating } from "@/components/projects/QuickRating";
import { SurveyBuilder } from "@/components/projects/survey/SurveyBuilder";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { cloudinaryConfig } from "@/lib/cloudinary/config";
import { 
  RATING_TYPES, 
  QuickRatingType, 
  type Project, 
  type QuickRatingSettings, 
  type Question 
} from "@/types/project";
import { VideoFile, UploadStatus, CloudinaryUploadResponse } from "@/types/video";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

export const NewProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Quick Rating States
  const [enableQuickRating, setEnableQuickRating] = useState(true);
  const [ratingType, setRatingType] = useState<QuickRatingType>("stars");
  const [ratingTitle, setRatingTitle] = useState("How would you rate this video?");
  const [ratingDescription, setRatingDescription] = useState("Your feedback helps us improve");

  // Video States
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | undefined>();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    progress: 0,
    status: 'idle'
  });

  // Cleanup effect for object URL
  useEffect(() => {
    return () => {
      // Cleanup object URL when component unmounts
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

  const handleClear = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(undefined);
    setUploadStatus({ status: 'idle', progress: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVideo) {
      setError(!selectedVideo ? "Please select a video" : "No user found");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setUploadStatus({ status: 'uploading', progress: 0 });

      // Upload video to Cloudinary with progress tracking
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
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadStatus({ status: 'uploading', progress });
        }
      };

      // Create a promise for the upload
      const uploadPromise = new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.response) as CloudinaryUploadResponse;
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

      // Wait for upload to complete and get result
      const uploadResult = await uploadPromise;
      setUploadStatus({ status: 'success', progress: 100 });

      const projectId = crypto.randomUUID();

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

      // Clean up questions data
      const cleanedQuestions = questions.map(question => {
        const cleanQuestion = { ...question };
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
          case 'multiple_choice':
            if (cleanQuestion.allowMultiple === undefined) delete cleanQuestion.allowMultiple;
            break;
        }
        return cleanQuestion;
      });

      // Create project object
      const project: Project = {
        id: projectId,
        userId: user.uid,
        title,
        description,
        status: 'active',
        videoUrl: uploadResult.secure_url,
        videoId: uploadResult.public_id,
        videoFileName: uploadResult.original_filename || undefined,
        thumbnailUrl: uploadResult.thumbnail_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          allowSkip: true,
          showProgressBar: true,
          collectAnonymousResponses: true
        },
        quickRating: quickRatingSettings,
        survey: {
          id: crypto.randomUUID(),
          projectId,
          questions: cleanedQuestions,
          settings: {
            showQuestionsAtEnd: true,
            allowSkip: true,
            showProgressBar: true
          }
        }
      };

      // Save to Firestore
      await setDoc(doc(db, "projects", projectId), project);

      // Navigate to project details
      navigate(`/app/projects/${projectId}`);

    } catch (err) {
      console.error('Error creating project:', err);
      setUploadStatus({
        status: 'error',
        progress: 0,
        error: 'Failed to upload video'
      });
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              type="button"
              onClick={() => navigate('/app/projects')}
              className="text-slate-600 hover:text-[#011BA1]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Add your video content and configure feedback collection
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
                  placeholder="Tell viewers what this video is about"
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
              <VideoUpload
                onSelect={handleVideoSelect}
                onClear={handleClear}
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
                      placeholder="e.g., How would you rate this video?"
                      value={ratingTitle}
                      onChange={(e) => setRatingTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating-description" className="text-base">Rating Description</Label>
                    <Input
                      id="rating-description"
                      placeholder="Optional description or instructions"
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
                        title: ratingTitle || "How would you rate this video?",
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
              Add questions to collect detailed feedback
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
            onClick={() => navigate('/app/projects')}
            disabled={isLoading || uploadStatus.status === 'uploading'}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-4">
            {uploadStatus.status === 'uploading' && (
              <p className="text-sm text-muted-foreground">
                Uploading video... {uploadStatus.progress}%
              </p>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || uploadStatus.status === 'uploading'}
              className="min-w-[120px] bg-[#011BA1] hover:bg-[#00008B]"
            >
              {uploadStatus.status === 'uploading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStatus.progress}%
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};