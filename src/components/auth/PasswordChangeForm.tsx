// src/components/auth/PasswordChangeForm.tsx
import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export const PasswordChangeForm = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError("Password must contain at least one letter and one number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      try {
        await reauthenticateWithCredential(user, credential);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes('auth/invalid-credential') || 
              err.message.includes('auth/wrong-password')) {
            setError("Current password is incorrect");
          } else {
            setError("Authentication failed. Please try again.");
          }
        } else {
          setError("An unexpected error occurred");
        }
        setIsLoading(false);
        return;
      }

      await updatePassword(user, formData.newPassword);

      // Show confirmation dialog
      setShowConfirmDialog(true);
      setSuccess("Password updated successfully!");

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowForm(false);
      
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        switch (err.message) {
          case 'Firebase: Error (auth/requires-recent-login).':
            setError("Please sign in again before changing your password");
            break;
          case 'Firebase: Error (auth/invalid-credential).':
            setError("Current password is incorrect");
            break;
          case 'Firebase: Error (auth/weak-password).':
            setError("Password should be at least 6 characters");
            break;
          default:
            setError("Failed to update password. Please try again.");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/auth/signin', { 
        state: { 
          message: "Your password has been changed. Please sign in with your new password." 
        } 
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError("");
    setSuccess("");
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Password</h3>
          <p className="text-sm text-muted-foreground">
            Change your password to keep your account secure
          </p>
        </div>
        <Button
          variant="outline"
          onClick={showForm ? handleCancel : () => setShowForm(true)}
          disabled={isLoading}
        >
          {showForm ? "Cancel" : "Change Password"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/15 text-green-500 text-sm p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter your new password"
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters and contain at least one letter and one number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Confirm your new password"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Confirmation Dialog */}
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog}>
        <DialogContent 
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Password Updated Successfully</DialogTitle>
            <DialogDescription>
              For security reasons, you'll need to sign in again with your new password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSignOut} className="bg-[#011BA1] hover:bg-[#00008B]">
              Okay, got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};