// src\components\projects\survey\QuestionTypeSelect.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckSquare,
  ListPlus,
  MessageSquare,
  Star,
  ThumbsUp,
} from "lucide-react";
import { QuestionType } from "@/types/project";

interface QuestionTypeOption {
  type: QuestionType;
  icon: React.ElementType;
  title: string;
  description: string;
}

const questionTypes: QuestionTypeOption[] = [
  {
    type: "multiple_choice",
    icon: ListPlus,
    title: "Multiple Choice",
    description: "Let users choose from a list of options",
  },
  {
    type: "rating_scale",
    icon: Star,
    title: "Rating Scale",
    description: "Collect ratings on a numeric scale",
  },
  {
    type: "text",
    icon: MessageSquare,
    title: "Text Response",
    description: "Allow users to enter free-form text",
  },
  {
    type: "checkbox",
    icon: CheckSquare,
    title: "Checkboxes",
    description: "Let users select multiple options",
  },
  {
    type: "yes_no",
    icon: ThumbsUp,
    title: "Yes/No Question",
    description: "Ask a simple yes or no question",
  },
];

interface QuestionTypeSelectProps {
  onSelect: (type: QuestionType) => void;
}

export function QuestionTypeSelect({ onSelect }: QuestionTypeSelectProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Question Type</CardTitle>
        <CardDescription>
          Select the type of question you want to add
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {questionTypes.map((type) => (
          <Button
            key={type.type}
            variant="outline"
            className="h-auto flex flex-col items-start gap-2 p-4 hover:border-primary"
            onClick={() => onSelect(type.type)}
          >
            <type.icon className="h-6 w-6 text-muted-foreground" />
            <div className="text-left">
              <h3 className="font-medium">{type.title}</h3>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}