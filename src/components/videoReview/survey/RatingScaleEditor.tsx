// src\components\videoReview\survey\RatingScaleEditor.tsx
import { RatingScaleQuestion } from "@/types/videoReview";
import { QuestionEditor } from "./QuestionEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RatingScaleEditorProps {
  question: RatingScaleQuestion;
  onChange: (question: RatingScaleQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SCALE_PRESETS = [
  { name: "1-5 Scale", min: 1, max: 5, step: 1 },
  { name: "1-10 Scale", min: 1, max: 10, step: 1 },
  { name: "0-100 Percentage", min: 0, max: 100, step: 10 },
];

export function RatingScaleEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
}: RatingScaleEditorProps) {
  const handleScalePresetChange = (preset: string) => {
    const selectedPreset = SCALE_PRESETS.find(p => p.name === preset);
    if (selectedPreset) {
      onChange({
        ...question,
        minValue: selectedPreset.min,
        maxValue: selectedPreset.max,
        step: selectedPreset.step
      });
    }
  };

  return (
    <QuestionEditor
      question={question}
      onChange={onChange}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="space-y-4">
        {/* Scale Preset Selector */}
        <div className="space-y-2">
          <Label>Scale Preset</Label>
          <Select
            onValueChange={handleScalePresetChange}
            value={SCALE_PRESETS.find(
              p =>
                p.min === question.minValue &&
                p.max === question.maxValue &&
                p.step === question.step
            )?.name}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a scale" />
            </SelectTrigger>
            <SelectContent>
              {SCALE_PRESETS.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Scale Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Min Value</Label>
            <Input
              type="number"
              value={question.minValue}
              onChange={(e) =>
                onChange({
                  ...question,
                  minValue: parseInt(e.target.value)
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Max Value</Label>
            <Input
              type="number"
              value={question.maxValue}
              onChange={(e) =>
                onChange({
                  ...question,
                  maxValue: parseInt(e.target.value)
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Step</Label>
            <Input
              type="number"
              value={question.step}
              onChange={(e) =>
                onChange({
                  ...question,
                  step: parseInt(e.target.value)
                })
              }
            />
          </div>
        </div>

        {/* Scale Labels */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min Label (Optional)</Label>
            <Input
              value={question.minLabel || ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  minLabel: e.target.value
                })
              }
              placeholder="e.g., Not at all likely"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Label (Optional)</Label>
            <Input
              value={question.maxLabel || ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  maxLabel: e.target.value
                })
              }
              placeholder="e.g., Extremely likely"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex justify-between items-center p-4 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">
              {question.minLabel || question.minValue}
            </div>
            <div className="flex gap-2">
              {Array.from(
                { length: (question.maxValue - question.minValue) / (question.step || 1) + 1 },
                (_, i) => question.minValue + i * (question.step || 1)
              ).map((value) => (
                <div
                  key={value}
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
                >
                  {value}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {question.maxLabel || question.maxValue}
            </div>
          </div>
        </div>
      </div>
    </QuestionEditor>
  );
}