// src\components\videoReview\survey\TextQuestionEditor.tsx
import { TextQuestion } from "@/types/videoReview";
import { QuestionEditor } from "./QuestionEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextQuestionEditorProps {
  question: TextQuestion;
  onChange: (question: TextQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function TextQuestionEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
}: TextQuestionEditorProps) {
  const handleMaxLengthChange = (value: string) => {
    const maxLength = value ? parseInt(value) : undefined;
    onChange({
      ...question,
      maxLength: isNaN(maxLength!) ? undefined : maxLength,
    });
  };

  return (
    <QuestionEditor
      question={question}
      onChange={onChange}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="space-y-4">
        {/* Response Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              placeholder="Enter placeholder text..."
              value={question.placeholder || ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  placeholder: e.target.value,
                })
              }
              className="text-muted-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLength">Maximum Length</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxLength"
                type="number"
                min="1"
                placeholder="No limit"
                value={question.maxLength || ""}
                onChange={(e) => handleMaxLengthChange(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">characters</span>
            </div>
          </div>
        </div>

        {/* Response Preview */}
        <div className="space-y-2">
          <Label>Response Preview</Label>
          <div className="p-4 rounded-lg border bg-muted/50">
            <Input
              disabled
              placeholder={question.placeholder || "Type your answer here..."}
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <div className="mt-1 text-xs text-muted-foreground text-right">
                {`0/${question.maxLength} characters`}
              </div>
            )}
          </div>
        </div>
      </div>
    </QuestionEditor>
  );
}