// src/components/auth/SessionWarning.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSessionTimeout } from "@/lib/hooks/useSessionTimeout";
import { Timer } from "lucide-react";

export function SessionWarning() {
  const { showWarning, timeLeft, handleLogout, resetSession } = useSessionTimeout();

  return (
    <Dialog 
      open={showWarning} 
      onOpenChange={(open) => !open && resetSession()}
      modal={true}
    >
      <DialogContent>
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <Timer className="h-5 w-5" />
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            Your session will expire in {Math.ceil(timeLeft / 60000)} minutes.
            Would you like to continue your session?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => void handleLogout()}
            className="rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          >
            Logout Now
          </Button>
          <Button 
            onClick={resetSession}
            className="rounded-xl bg-[#011BA1] hover:bg-[#00008B] text-white"
          >
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}