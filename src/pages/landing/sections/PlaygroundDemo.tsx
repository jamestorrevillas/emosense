// src/pages/landing/sections/PlaygroundDemo.tsx
import { Link } from "react-router-dom";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Camera, ChevronRight, LineChart } from "lucide-react";
import playgroundPreview from '@/assets/images/playground-preview.png'

export function PlaygroundDemo() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-8">
                <div className="rounded-full bg-[#011BA1]/10 p-2">
                  <Brain className="h-6 w-6 text-[#011BA1]" />
                </div>
                <span className="inline-flex items-center rounded-full bg-[#011BA1]/10 px-3 py-1 text-sm font-medium text-[#011BA1]">
                  Interactive Demo
                </span>
              </div>
              
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                Try EmoSense Playground
              </h2>
              
              <p className="text-lg text-slate-600 mb-8">
                Experience emotion detection in real-time. Our interactive playground lets you test the technology using your webcam and see analytics in action.
              </p>

              <Button 
                asChild
                size="lg" 
                className="bg-[#011BA1] hover:bg-[#00008B]"
                >
                <Link to="/playground">
                    Try it now
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Feature List */}
            <div className="mt-12 grid gap-4">
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="rounded-lg bg-[#011BA1]/10 p-2">
                    <Camera className="h-5 w-5 text-[#011BA1]" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Real-time Detection</h3>
                    <p className="text-sm text-slate-600">
                      See emotion detection in action using your webcam
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                    <div className="rounded-lg bg-[#011BA1]/10 p-2">
                    <LineChart className="h-5 w-5 text-[#011BA1]" />
                    </div>
                    <div>
                    <h3 className="font-medium mb-1">Comprehensive Analysis</h3>
                    <p className="text-sm text-slate-600">
                        Get detailed emotion analysis after tracking sessions
                    </p>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Preview Image */}
          <div className="lg:pl-8">
            <div className="relative">
              <div className="absolute inset-0 scale-[0.80] transform rounded-2xl bg-[#011BA1] blur-3xl opacity-10" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-xl">
                {/* You'll need to replace this with your actual screenshot */}
                <img
                  src={playgroundPreview}
                  alt="EmoSense Playground"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}