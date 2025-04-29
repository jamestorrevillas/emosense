// src\components\projects\survey\QuestionEditor.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BaseQuestion } from "@/types/videoReview";

interface QuestionEditorProps<T extends BaseQuestion> {
  question: T;
  onChange: (question: T) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  children?: React.ReactNode;
}

export function QuestionEditor<T extends BaseQuestion>({
  question,
  onChange,
  onDelete,
  onDuplicate,
  children,
}: QuestionEditorProps<T>) {

  const handleBasicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...question,
      [name]: value,
    } as T);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Question</CardTitle>
          <CardDescription>Configure your question settings</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete Question
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Question Text</Label>
          <Input
            id="text"
            name="text"
            value={question.text}
            onChange={handleBasicChange}
            placeholder="Enter your question"
          />
        </div>

        {children}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="required">Required</Label>
              <p className="text-sm text-muted-foreground">
                Make this question mandatory
              </p>
            </div>
            <Switch
              id="required"
              checked={question.required}
              onCheckedChange={(checked) =>
                onChange({ ...question, required: checked } as T)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}