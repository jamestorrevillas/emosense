// src/pages/auth/SignUpPage.tsx 
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Mail, Lock, User } from "lucide-react";
import Logo from "@/assets/images/logo.png";

export const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setError("");
      setIsLoading(true);
      await signUp(formData.email, formData.password, formData.name);
      navigate("/app/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Get started with EmoSense analytics
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
              
              <div className="space-y-4">
              <Input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  icon={<User className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />

                <Input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  icon={<Mail className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />

                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  icon={<Lock className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />

                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  icon={<Lock className="h-4 w-4" />}
                  className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center text-white">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600">Already have an account? </span>
                <Link 
                  to="/auth/signin" 
                  className="text-[#011BA1] hover:text-[#00008B] hover:underline font-medium"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Sign in
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