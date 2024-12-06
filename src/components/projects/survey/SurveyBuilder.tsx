// src\components\projects\survey\SurveyBuilder.tsx
import { useState } from "react";
import { Question, QuestionType } from "@/types/project";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuestionTypeSelect } from "./QuestionTypeSelect";
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { RatingScaleEditor } from "./RatingScaleEditor";
import {
  DndContext, 
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableQuestion } from "./SortableQuestion";
import { TextQuestionEditor } from "./TextQuestionEditor";
import { CheckboxEditor } from "./CheckboxEditor";
import { YesNoEditor } from "./YesNoEditor";

interface SurveyBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function SurveyBuilder({ questions, onChange }: SurveyBuilderProps) {
  const [showQuestionTypeSelect, setShowQuestionTypeSelect] = useState(false);
  const [lastAddedQuestionId, setLastAddedQuestionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createNewQuestion = (type: QuestionType) => {
    const newQuestionId = crypto.randomUUID();
    const baseQuestion = {
      id: newQuestionId,
      text: "",
      required: true,
      type,
    };

    let newQuestion: Question;

    switch (type) {
      case "multiple_choice":
        newQuestion = {
          ...baseQuestion,
          type: "multiple_choice",
          options: []
        };
        break;

      case "rating_scale":
        newQuestion = {
          ...baseQuestion,
          type: "rating_scale",
          minValue: 1,
          maxValue: 5,
          step: 1,
        };
        break;

      case "text":
        newQuestion = {
          ...baseQuestion,
          type: "text",
          placeholder: "",
          maxLength: undefined,
        };
        break;

      case "checkbox":
        newQuestion = {
          ...baseQuestion,
          type: "checkbox",
          options: [],
        };
        break;

      case "yes_no":
        newQuestion = {
          ...baseQuestion,
          type: "yes_no",
        };
        break;

      default:
        throw new Error("Invalid question type");
    }

    onChange([...questions, newQuestion]);
    setShowQuestionTypeSelect(false);
    setLastAddedQuestionId(newQuestionId);
    
    setTimeout(() => {
      setLastAddedQuestionId(null);
    }, 500);
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange(newQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion = {
      ...questionToDuplicate,
      id: crypto.randomUUID(),
      text: `${questionToDuplicate.text} (Copy)`,
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicatedQuestion);
    onChange(newQuestions);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const renderQuestionEditor = (question: Question, index: number) => {
    const commonProps = {
      onDelete: () => deleteQuestion(index),
      onDuplicate: () => duplicateQuestion(index),
    };

    switch (question.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceEditor
            {...commonProps}
            question={question}
            onChange={(q) => updateQuestion(index, q)}
          />
        );

      case "rating_scale":
        return (
          <RatingScaleEditor
            {...commonProps}
            question={question}
            onChange={(q) => updateQuestion(index, q)}
          />
        );

      case "text":
        return (
          <TextQuestionEditor
            {...commonProps}
            question={question}
            onChange={(q) => updateQuestion(index, q)}
          />
        );

      case "checkbox":
        return (
          <CheckboxEditor
            {...commonProps}
            question={question}
            onChange={(q) => updateQuestion(index, q)}
          />
        );

      case "yes_no":
        return (
          <YesNoEditor
            {...commonProps}
            question={question}
            onChange={(q) => updateQuestion(index, q)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {questions.length === 0 && !showQuestionTypeSelect ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-sm text-muted-foreground text-center">
              No questions added yet. Add your first question to get started.
            </p>
            <Button onClick={() => setShowQuestionTypeSelect(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <SortableQuestion
                    key={question.id}
                    id={question.id}
                    question={question}
                    isNewlyAdded={question.id === lastAddedQuestionId}
                  >
                    {renderQuestionEditor(question, index)}
                  </SortableQuestion>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {!showQuestionTypeSelect && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowQuestionTypeSelect(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          )}
        </>
      )}

      {showQuestionTypeSelect && (
        <>
          <QuestionTypeSelect
            onSelect={createNewQuestion}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowQuestionTypeSelect(false)}
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}