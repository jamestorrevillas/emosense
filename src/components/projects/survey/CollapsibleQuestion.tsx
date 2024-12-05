// src\components\projects\survey\CollapsibleQuestion.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Question } from "@/types/project";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleQuestionProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleQuestion({ 
  question, 
  isExpanded, 
  onToggle,
  children 
}: CollapsibleQuestionProps) {
  const getPreviewText = () => {
    if (!question.text) return "Untitled question";
    return question.text.length > 60 
      ? `${question.text.slice(0, 60)}...` 
      : question.text;
  };

  const getQuestionInfo = () => {
    switch (question.type) {
      case "multiple_choice":
        return `${question.options.length} options`;
      case "rating_scale":
        return `${question.minValue} to ${question.maxValue}`;
      case "text":
        return "Text response";
      case "checkbox":
        return `${question.options.length} checkboxes`;
      case "yes_no":
        return "Yes/No question";
      default:
        return "";
    }
  };

  return (
    <Card className={`relative transition-all duration-200 ${isExpanded ? '' : 'hover:bg-accent/50'}`}>
      <div 
        className={`flex items-center gap-4 p-4 cursor-pointer ${isExpanded ? '' : 'hover:bg-accent/50'}`}
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="capitalize">
              {question.type.replace('_', ' ')}
            </Badge>
            {question.required && (
              <Badge>Required</Badge>
            )}
          </div>
          <div className="text-sm font-medium truncate">
            {getPreviewText()}
          </div>
          {!isExpanded && (
            <div className="text-xs text-muted-foreground mt-1">
              {getQuestionInfo()}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t">
          {children}
        </div>
      )}
    </Card>
  );
}