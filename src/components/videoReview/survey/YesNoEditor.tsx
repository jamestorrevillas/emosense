// src\components\projects\survey\YesNoEditor.tsx
import { YesNoQuestion } from "@/types/videoReview";
import { QuestionEditor } from "./QuestionEditor";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface YesNoEditorProps {
  question: YesNoQuestion;
  onChange: (question: YesNoQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function YesNoEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
}: YesNoEditorProps) {
  return (
    <QuestionEditor
      question={question}
      onChange={onChange}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Preview</Label>
          <Card className="p-4">
            <RadioGroup defaultValue="no">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          </Card>
        </div>
      </div>
    </QuestionEditor>
  );
}