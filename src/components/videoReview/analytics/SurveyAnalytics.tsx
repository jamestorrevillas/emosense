// src/components/videoReview/analytics/SurveyAnalytics.tsx
import { useState, useEffect } from "react";
import { collection, doc, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Survey, Question } from "@/types/videoReview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SurveyAnalyticsProps {
  projectId: string;
  survey: Survey;
}

interface AnalyzedResponses {
  [questionId: string]: {
    totalResponses: number;
    responses: {
      [value: string]: number;  // value -> count
    };
    percentages: {
      [value: string]: number;  // value -> percentage
    };
  };
}

export function SurveyAnalytics({ projectId, survey }: SurveyAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzedResponses, setAnalyzedResponses] = useState<AnalyzedResponses>({});

  useEffect(() => {
    const responsesRef = collection(doc(db, "projects", projectId), "responses");
    const responsesQuery = query(responsesRef);
    
    const unsubscribe = onSnapshot(responsesQuery, (snapshot) => {
      try {
        // Get completed responses
        const responses = snapshot.docs
          .filter(doc => doc.data().status === 'completed')
          .map(doc => doc.data().data.survey);

        if (responses.length === 0) {
          setLoading(false);
          return;
        }

        // Initialize analysis structure
        const analysis: AnalyzedResponses = {};
        
        // Process each question
        survey.questions.forEach(question => {
          const questionResponses: { [key: string]: number } = {};
          let totalResponses = 0;

          // Initialize response counts for all options (for multiple choice and yes/no)
          if (question.type === 'multiple_choice' || question.type === 'checkbox') {
            question.options.forEach(option => {
              questionResponses[option] = 0;
            });
          } else if (question.type === 'yes_no') {
            questionResponses['Yes'] = 0;
            questionResponses['No'] = 0;
          }

          // Count responses for this question
          responses.forEach(response => {
            const answer = response[question.id];
            if (answer !== undefined) {
              totalResponses++;

              if (Array.isArray(answer)) {
                // Handle checkbox responses
                answer.forEach(value => {
                  questionResponses[value] = (questionResponses[value] || 0) + 1;
                });
              } else if (question.type === 'yes_no') {
                // Handle yes/no responses
                const value = String(answer).toLowerCase();
                const normalizedValue = value === 'true' || value === 'yes' ? 'Yes' : 'No';
                questionResponses[normalizedValue]++;
              } else if (question.type === 'multiple_choice') {
                // Handle multiple choice
                questionResponses[answer] = (questionResponses[answer] || 0) + 1;
              } else {
                // Handle other single value responses
                const value = String(answer);
                questionResponses[value] = (questionResponses[value] || 0) + 1;
              }
            }
          });

          // Calculate percentages
          const percentages: { [key: string]: number } = {};
          Object.entries(questionResponses).forEach(([value, count]) => {
            percentages[value] = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
          });

          analysis[question.id] = {
            totalResponses,
            responses: questionResponses,
            percentages
          };
        });

        setAnalyzedResponses(analysis);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("Error processing responses:", err);
        setError("Failed to analyze survey responses");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId, survey]);

  const renderQuestionAnalysis = (question: Question) => {
    const analysis = analyzedResponses[question.id];
    if (!analysis) return null;

    switch (question.type) {
      case 'rating_scale': {
        // Convert values to array and sort by response count
        const values = Array.from(
          { length: (question.maxValue - question.minValue) / (question.step || 1) + 1 },
          (_, i) => question.minValue + i * (question.step || 1)
        ).sort((a, b) => {
          const countA = analysis.responses[a] || 0;
          const countB = analysis.responses[b] || 0;
          return countB - countA; // Sort descending
        });

        return (
          <div className="space-y-3">
            {values.map(value => {
              const count = analysis.responses[value] || 0;
              const percentage = analysis.percentages[value] || 0;

              return (
                <div key={value} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {value} {value === question.minValue && question.minLabel ? `(${question.minLabel})` : ''}
                      {value === question.maxValue && question.maxLabel ? `(${question.maxLabel})` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {count} {count === 1 ? 'response' : 'responses'} | {percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-64 bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'multiple_choice':
      case 'checkbox':
      case 'yes_no': {
        const options = question.type === 'yes_no' 
          ? ['Yes', 'No'] 
          : question.options;

        // Sort options by response count descending
        const sortedOptions = [...options].sort((a, b) => {
          const countA = analysis.responses[a] || 0;
          const countB = analysis.responses[b] || 0;
          return countB - countA;
        });

        return (
          <div className="space-y-3">
            {sortedOptions.map((option) => {
              const count = analysis.responses[option] || 0;
              const percentage = analysis.percentages[option] || 0;

              return (
                <div key={option} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} {count === 1 ? 'response' : 'responses'} | {percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-64 bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'text':
        return (
          <div className="space-y-4">
            {Object.entries(analysis.responses).map(([response], idx) => {
              if (!response?.trim()) return null;
              const responseNumber = analysis.totalResponses - idx;

              return (
                <div key={idx} className="relative pl-4 border-l-2 border-muted-foreground/20">
                  <div className="text-sm text-foreground bg-muted/50 p-4 rounded-md">
                    {response}
                  </div>
                  <div className="absolute left-4 -top-2 bg-background px-2 text-xs text-muted-foreground">
                    Response {responseNumber}
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Results</CardTitle>
        <CardDescription>
          Analysis of survey responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {survey.questions.map((question, index) => (
            <Card key={question.id} className="border border-black">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Question {index + 1}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-xs bg-[#011BA1] text-white">
                    {question.type.replace('_', ' ')}
                  </Badge>
                  {question.required && (
                    <Badge className="text-xs text-black bg-transparent border-none">
                      Required
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mt-2">
                    {question.text || "Untitled Question"}
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                {renderQuestionAnalysis(question)}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}