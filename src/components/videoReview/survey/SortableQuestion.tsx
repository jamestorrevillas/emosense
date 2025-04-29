// src\components\projects\survey\SortableQuestion.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip } from "lucide-react";
import { Question } from "@/types/videoReview";
import { CollapsibleQuestion } from "./CollapsibleQuestion";
import { useState, useEffect } from "react";

interface SortableQuestionProps {
  id: string;
  question: Question;
  children: React.ReactNode;
  isNewlyAdded?: boolean;
}

export function SortableQuestion({ 
  id, 
  question, 
  children,
  isNewlyAdded = false
}: SortableQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(isNewlyAdded);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  useEffect(() => {
    if (isNewlyAdded) {
      setIsExpanded(true);
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isNewlyAdded, id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      id={id}
      ref={setNodeRef} 
      style={style}
      className={`relative ${isDragging ? 'z-50 opacity-50' : 'z-0'}`}
    >
      <div 
        className="absolute left-4 top-[26px] h-12 flex items-center"
        {...attributes}
        {...listeners}
      >
        <Grip className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      <div className="pl-12">
        <CollapsibleQuestion
          question={question}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        >
          {children}
        </CollapsibleQuestion>
      </div>
    </div>
  );
}