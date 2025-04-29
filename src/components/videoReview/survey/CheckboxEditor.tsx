// src\components\projects\survey\CheckboxEditor.tsx
import { useState } from "react";
import { CheckboxQuestion } from "@/types/videoReview";
import { QuestionEditor } from "./QuestionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface CheckboxEditorProps {
  question: CheckboxQuestion;
  onChange: (question: CheckboxQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function CheckboxEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
}: CheckboxEditorProps) {
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    onChange({
      ...question,
      options: [...question.options, newOption.trim()]
    });
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== index)
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    onChange({
      ...question,
      options: newOptions
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
        <div className="space-y-2">
          <Label>Checkbox Options</Label>
          {question.options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Add a new option"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddOption();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddOption}
            disabled={!newOption.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {question.options.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add at least one option for your checkbox question
          </p>
        )}
      </div>
    </QuestionEditor>
  );
}