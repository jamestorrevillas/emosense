// src\App.tsx
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import './styles/custom-components.css';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>EmoSense UI Components</CardTitle>
            <CardDescription>Testing our shadcn/ui components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buttons Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Default Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Inputs</h3>
              <div className="grid gap-4">
                <Input type="text" placeholder="Default input" />
                <Input type="email" placeholder="Email input" />
                <Input type="password" placeholder="Password input" />
                <div className="flex gap-2">
                  <Input type="text" placeholder="Search..." />
                  <Button>Search</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;