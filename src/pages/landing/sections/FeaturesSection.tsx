// src/pages/landing/sections/FeaturesSection.tsx
import { Container } from "./Container";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  LineChart,
  Users, 
  Star,
  MessageSquare,
  VideoIcon,
  Shield,
  Sparkles
} from "lucide-react";

const features = [
  {
    title: "Real-time Emotion Detection",
    description: "Track viewer emotions as they watch your content using advanced AI.",
    icon: Brain
  },
  {
    title: "Comprehensive Analytics",
    description: "Get detailed insights into emotional responses and engagement patterns.",
    icon: LineChart
  },
  {
    title: "User Feedback Collection",
    description: "Gather structured feedback through customizable surveys and ratings.",
    icon: MessageSquare
  },
  {
    title: "Video Integration",
    description: "Seamlessly integrate with your video content for analysis.",
    icon: VideoIcon
  },
  {
    title: "Audience Insights",
    description: "Understand your audience better with emotional response data.",
    icon: Users
  },
  {
    title: "Quick Ratings",
    description: "Collect immediate feedback with customizable rating systems.",
    icon: Star
  },
  {
    title: "Privacy First",
    description: "Enterprise-grade security and privacy protection for all users.",
    icon: Shield
  },
  {
    title: "Real-time Processing",
    description: "Process and analyze emotional responses as they happen.",
    icon: Sparkles
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Powerful features for deep insights
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to understand and analyze viewer emotional responses
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-[#011BA1]/10 w-12 h-12 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-[#011BA1]" />
                </div>
                <h3 className="font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}