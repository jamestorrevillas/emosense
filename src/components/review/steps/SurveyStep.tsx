// src/components/review/steps/SurveyStep.tsx
import { useState, useEffect } from "react";
import { collection, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useReview } from "@/contexts/ReviewContext";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

export function SurveyStep() {
  const { nextStep, projectData, responses, mode } = useReview();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, string | number | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add check for no survey or no questions
  useEffect(() => {
    if (!projectData.survey?.questions?.length) {
      nextStep();
    }
  }, [projectData.survey?.questions, nextStep]);

  // Return null if no survey or no questions
  if (!projectData.survey?.questions?.length) {
    return null;
  }

  const questions = projectData.survey.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleResponse = (questionId: string, value: string | number | string[]) => {
    setSurveyResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    setError(null);
  };

  const handleCheckboxResponse = (questionId: string, option: string, checked: boolean) => {
    const currentValues = (surveyResponses[questionId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);
    handleResponse(questionId, newValues);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    if (currentQuestion.required && !surveyResponses[currentQuestion.id]) {
      setError("Please provide an answer before continuing");
      return;
    }
    setError(null);
    
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const finalResponse = {
        projectId: projectData.id,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: {
          emotion: responses.emotionResponse || null,
          quickRating: responses.quickRating || null,
          survey: surveyResponses
        },
        mode: mode,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        }
      };

      const responseRef = collection(doc(db, "projects", projectData.id), "responses");
      await addDoc(responseRef, finalResponse);
      nextStep();
    } catch (err) {
      console.error("Error submitting responses:", err);
      setError(err instanceof Error ? err.message : "Failed to submit responses");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                {mode === 'preview' && (
                  <Badge variant="secondary">Preview Mode</Badge>
                )}
              </div>
              {currentQuestion.required && (
                <span className="text-sm text-destructive">* Required</span>
              )}
            </div>
            <Badge 
              variant="outline" 
              className="capitalize text-xs bg-[#011BA1] text-white"
            >
              {currentQuestion.type.replace('_', ' ')}
            </Badge>
          </div>
          <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Input */}
          <div className={`${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={(surveyResponses[currentQuestion.id] as string)?.toString()}
                onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                className="space-y-4"
              >
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 rounded-lg border p-4 transition-all duration-200 hover:bg-accent"
                  >
                    <RadioGroupItem 
                      value={option} 
                      id={`${currentQuestion.id}-${index}`}
                      className="data-[state=checked]:border-primary data-[state=checked]:border-2"
                    />
                    <Label 
                      htmlFor={`${currentQuestion.id}-${index}`}
                      className="flex-grow cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'checkbox' && (
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  const currentValues = (surveyResponses[currentQuestion.id] as string[]) || [];
                  return (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 rounded-lg border p-4 transition-all duration-200 hover:bg-accent"
                    >
                      <Checkbox
                        id={`${currentQuestion.id}-${index}`}
                        checked={currentValues.includes(option)}
                        onCheckedChange={(checked) => {
                          handleCheckboxResponse(currentQuestion.id, option, checked as boolean);
                        }}
                        className="data-[state=checked]:border-primary data-[state=checked]:border-2"
                      />
                      <Label 
                        htmlFor={`${currentQuestion.id}-${index}`}
                        className="flex-grow cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              currentQuestion.maxLength && currentQuestion.maxLength > 100 ? (
                <div className="space-y-2">
                  <Textarea
                    value={(surveyResponses[currentQuestion.id] as string) || ''}
                    onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    maxLength={currentQuestion.maxLength}
                    rows={4}
                    className="resize-none transition-colors focus-visible:ring-primary"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {((surveyResponses[currentQuestion.id] as string) || '').length}/{currentQuestion.maxLength} characters
                  </div>
                </div>
              ) : (
                <Input
                  type="text"
                  value={(surveyResponses[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  maxLength={currentQuestion.maxLength}
                  className="transition-colors focus-visible:ring-primary"
                />
              )
            )}

            {currentQuestion.type === 'yes_no' && (
              <RadioGroup
                value={(surveyResponses[currentQuestion.id] as string)?.toString()}
                onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                className="space-y-4"
              >
                {['Yes', 'No'].map((option) => (
                  <div 
                    key={option}
                    className="flex items-center space-x-2 rounded-lg border p-4 transition-all duration-200 hover:bg-accent"
                  >
                    <RadioGroupItem 
                      value={option.toLowerCase()} 
                      id={`${currentQuestion.id}-${option}`}
                      className="data-[state=checked]:border-primary data-[state=checked]:border-2"
                    />
                    <Label 
                      htmlFor={`${currentQuestion.id}-${option}`}
                      className="flex-grow cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'rating_scale' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center py-6">
                  <div className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    {currentQuestion.minLabel || currentQuestion.minValue}
                  </div>
                  <div className="flex gap-2">
                    {Array.from(
                      { length: (currentQuestion.maxValue - currentQuestion.minValue) / (currentQuestion.step || 1) + 1 },
                      (_, i) => currentQuestion.minValue + i * (currentQuestion.step || 1)
                    ).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleResponse(currentQuestion.id, value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                          ${surveyResponses[currentQuestion.id] === value
                            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md"
                            : "border-gray-200 hover:border-primary/50 hover:text-primary hover:scale-105 hover:shadow-sm"
                          }
                          disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    {currentQuestion.maxLabel || currentQuestion.maxValue}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isLoading}
              className="transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-[#011BA1] hover:bg-[#00008B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {isLastQuestion ? 'Submit' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}