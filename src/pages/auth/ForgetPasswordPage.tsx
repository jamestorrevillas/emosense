// src/pages/auth/ForgetPasswordPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft, Mail, Lock, KeyRound, CheckCircle2 } from "lucide-react";
import { checkEmailExists, sendConfirmationCode, verifyCode, resetPassword } from "@/lib/firebase/passwordReset";

export const ForgetPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // Mask email for display
  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + 
      '*'.repeat(username.length - 2) + 
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  // Handle sending confirmation code
  const handleSendCode = async () => {
    try {
      setError("");
      setIsLoading(true);

      // Check if email exists
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        setError("No account found with this email address");
        return;
      }

      await sendConfirmationCode(email);
      
      // Start countdown for resend (60 seconds)
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setSuccessMessage(`Code sent to ${maskEmail(email)}`);
      setStep('code');

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code verification
  const handleVerifyCode = async () => {
    try {
      setError("");
      setIsLoading(true);

      const isValid = await verifyCode(email, code);
      
      if (!isValid) {
        setError("Invalid code. Please try again.");
        return;
      }

      // Show success message and move to password step
      setSuccessMessage("Code verified successfully!");
      setIsVerified(true);
      setTimeout(() => {
        setStep('password');
        setSuccessMessage(''); // Clear success message when moving to password step
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    try {
      setError("");

      // Validate passwords
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);

      // Only proceed if code was verified
      if (!isVerified) {
        setError("Please verify your code first");
        return;
      }

      await resetPassword(email, code, newPassword);
      
      // Navigate to sign in with success message
      navigate('/auth/signin', { 
        state: { 
          passwordReset: true,
          message: "Password reset instructions have been sent to your email. Please check your inbox to complete the process." 
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] font-['Roboto','Segoe_UI',sans-serif] p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src="/src/assets/images/logo.png" 
              alt="EmoSense Logo" 
              className="h-8 w-auto"
            />
            <h1 className="text-3xl font-bold text-[#011BA1]">EmoSense</h1>
          </div>
          <p className="text-slate-600">Video Emotion Analytics Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              {step === 'email' && "Enter your email to receive a confirmation code"}
              {step === 'code' && "Enter the code sent to your email"}
              {step === 'password' && "Create a new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {step === 'email' && (
                <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    icon={<Mail className="h-4 w-4" />}
                    className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                  />

                  <Button 
                    type="submit"
                    className="w-full bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </form>
              )}

              {step === 'code' && (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter confirmation code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isLoading}
                    icon={<KeyRound className="h-4 w-4" />}
                    className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                    maxLength={6}
                  />

                  {countdown > 0 && (
                    <p className="text-sm text-center text-slate-600">
                      Resend code in {countdown}s
                    </p>
                  )}

                  {countdown === 0 && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-[#011BA1]"
                      onClick={handleSendCode}
                      disabled={isLoading}
                    >
                      Resend Code
                    </Button>
                  )}

                  <Button 
                    type="submit"
                    className="w-full bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </form>
              )}

              {step === 'password' && isVerified ? (
                <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    icon={<Lock className="h-4 w-4" />}
                    className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                  />

                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    icon={<Lock className="h-4 w-4" />}
                    className="focus:border-[#011BA1] focus:ring-[#011BA1]"
                  />

                  <Button 
                    type="submit"
                    className="w-full bg-[#011BA1] hover:bg-[#00008B] active:bg-[#000070] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              ) : step === 'password' ? (
                // Show error if somehow reached password step without verification
                <div className="text-center space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please verify your code first
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => setStep('code')}
                    variant="outline"
                    className="mt-2"
                  >
                    Go Back to Code Verification
                  </Button>
                </div>
              ) : null}

              {/* Back to Sign In Link */}
              <div className="text-center pt-2">
                <Link 
                  to="/auth/signin"
                  className="inline-flex items-center text-sm text-[#011BA1] hover:text-[#00008B] hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
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