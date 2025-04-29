// src/pages/auth/SignInPage.tsx
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Info, Mail, Lock } from "lucide-react";
import Logo from "@/assets/images/logo.png";

export const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const from = location.state?.from?.pathname || "/app/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setIsLoading(true);
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (location.state?.message) {
      return location.state.message;
    }
    if (location.state?.manualLogout) {
      return "You have signed out successfully.";
    }
    if (location.state?.sessionExpired) {
      return "Your session has expired. Please sign in again.";
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] font-['Roboto','Segoe_UI',sans-serif] p-4">
      <div className="w-full max-w-[400px] space-y-4">
        {/* Home Link */}
        <Link 
          to="/" 
          className="w-full text-center block text-sm text-slate-600 hover:text-[#011BA1] transition-colors"
        >
          ← Back to Home
        </Link>
  
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src={Logo}
              alt="EmoSense Logo" 
              className="h-8 w-auto"
            />
            <h1 className="text-3xl font-bold text-[#011BA1]">EmoSense</h1>
          </div>
          <p className="text-slate-600">Emotion Analytics Platform</p>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {getStatusMessage() && (
                <Alert className="border-blue-500 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    {getStatusMessage()}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
              <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Mail className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Lock className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link 
                  to="/auth/forgot-password"
                  className="text-sm text-[#011BA1] hover:text-[#00008B] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                className="w-full bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center text-white">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600">Don't have an account? </span>
                <Link 
                  to="/auth/signup" 
                  className="text-[#011BA1] hover:text-[#00008B] hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-4">
          © 2024 EmoSense. All rights reserved.
        </p>
      </div>
    </div>
  );
};