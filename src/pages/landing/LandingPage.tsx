// src/pages/landing/LandingPage.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, PlayCircle } from "lucide-react";
import { Container } from "./sections/Container";
import { FeaturesSection } from "./sections/FeaturesSection";
import { PlaygroundDemo } from "./sections/PlaygroundDemo";
import { ResultsDemo } from "./sections/ResultsDemo";
import logoImage from '@/assets/images/logo.png'

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={logoImage}
                alt="EmoSense Logo" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-[#011BA1]">
                EmoSense
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                asChild 
                className="text-slate-600 hover:text-[#011BA1]"
              >
                <Link to="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="bg-[#011BA1] hover:bg-[#00008B]">
                <Link to="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 pt-16 pb-32">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <img 
                    src={logoImage}
                    alt="EmoSense Logo" 
                    className="h-12 w-auto"
                  />
                  <h1 className="text-4xl font-bold text-[#011BA1]">
                    EmoSense
                  </h1>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#011BA1]/10 px-4 py-1.5 text-sm font-medium text-[#011BA1]">
                  Video Emotion Analytics Platform
                </span>
              </div>
              
              <h1 className="mb-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Transform Feedback with Emotion AI
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600">
                EmoSense revolutionizes feedback by analyzing emotions in real-time. 
                Get deeper insights into audience engagement, emotional responses, and content effectiveness 
                through advanced AI-powered emotion detection for both video content and live presentations.
              </p>
              
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button 
                  asChild
                  size="lg"
                  className="bg-[#011BA1] hover:bg-[#00008B] min-w-[200px] h-12"
                >
                  <Link to="/auth/signup">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild
                  variant="outline" 
                  size="lg"
                  className="min-w-[200px] h-12"
                >
                  <Link to="/playground">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Try Playground
                  </Link>
                </Button>
              </div>
              {/* Scroll prompt */}
              <div className="mt-12 text-sm text-muted-foreground animate-bounce">
                <div className="flex flex-col items-center gap-2">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                  <p>Scroll down to explore our features</p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Separator />

        {/* Features Section */}
        <FeaturesSection />

        <Separator />

        {/* Results Sample */}
        <ResultsDemo />

        <Separator />

        {/* Playground Demo */}
        <PlaygroundDemo />
      </main>
    </div>
  );
};

export default LandingPage;