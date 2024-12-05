// src/styles/design-system-template.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Plus
} from 'lucide-react';

const DesignSystem = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-['Roboto','Segoe_UI',sans-serif]">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-1">EmoSense Design System</h1>
        <p className="text-muted-foreground">A unified design system for video emotion analytics</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Color System */}
        <Card>
          <CardHeader>
            <CardTitle>Color System</CardTitle>
            <CardDescription>Core colors and their usage patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary</Label>
                <div className="h-24 rounded-lg bg-[#011BA1] flex items-end p-2">
                  <code className="text-xs text-white">#011BA1</code>
                </div>
              </div>
              <div>
                <Label>Hover State</Label>
                <div className="h-24 rounded-lg bg-[#00008B] flex items-end p-2">
                  <code className="text-xs text-white">#00008B</code>
                </div>
              </div>
            </div>

            {/* System Colors */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Success</Label>
                <div className="h-12 rounded-lg bg-green-500 flex items-end p-2">
                  <code className="text-xs text-white">bg-green-500</code>
                </div>
              </div>
              <div>
                <Label>Warning</Label>
                <div className="h-12 rounded-lg bg-yellow-500 flex items-end p-2">
                  <code className="text-xs text-white">bg-yellow-500</code>
                </div>
              </div>
              <div>
                <Label>Error</Label>
                <div className="h-12 rounded-lg bg-red-500 flex items-end p-2">
                  <code className="text-xs text-white">bg-red-500</code>
                </div>
              </div>
              <div>
                <Label>Info</Label>
                <div className="h-12 rounded-lg bg-blue-500 flex items-end p-2">
                  <code className="text-xs text-white">bg-blue-500</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Text styles and hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Heading 1</h1>
              <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">Heading 2</h2>
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Heading 3</h3>
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Heading 4</h4>
              <Separator />
              <p className="leading-7">Regular paragraph text with <strong>bold emphasis</strong> and <em>italic emphasis</em>.</p>
              <p className="text-sm text-muted-foreground">Small muted text for less important information.</p>
              <p className="text-xs text-muted-foreground">Extra small text for metadata.</p>
            </div>
          </CardContent>
        </Card>

        {/* Component Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Component Examples</CardTitle>
            <CardDescription>Common UI patterns and components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Buttons */}
            <div className="space-y-4">
              <Label>Buttons</Label>
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                >
                  Primary Action
                </Button>
                <Button 
                  variant="outline"
                  className="border-[#011BA1] text-[#011BA1] hover:bg-[#011BA1] hover:text-white"
                >
                  Outline Button
                </Button>
                <Button 
                  variant="link"
                  className="text-[#011BA1] hover:text-[#00008B]"
                >
                  Link Button
                </Button>
                <Button 
                  className="bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  With Icon
                </Button>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-4">
              <Label>Status Badges</Label>
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-[#011BA1]">Default</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            {/* Alert Messages */}
            <div className="space-y-4">
              <Label>Alerts</Label>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>A general information message.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>An error message with important information.</AlertDescription>
                </Alert>
                <Alert className="border-yellow-500">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700">A warning message about potential issues.</AlertDescription>
                </Alert>
                <Alert className="border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">A success message confirming an action.</AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Form Elements */}
            <div className="space-y-4">
              <Label>Form Elements</Label>
              <div className="grid gap-4 max-w-sm">
                <div className="space-y-2">
                  <Label>Input Label</Label>
                  <Input 
                    type="text" 
                    placeholder="Enter text..."
                    className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                  />
                </div>
              </div>
            </div>

            {/* Basic Card */}
            <div className="space-y-4">
              <Label>Card Layout</Label>
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Supporting description text</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Card content goes here.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystem;