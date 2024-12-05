// src/lib/hooks/useToast.ts
interface ToastOptions {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
  }
  
  function useToast() {
    function toast({ title, description, variant = "default", duration = 5000 }: ToastOptions) {
      // Create container if it doesn't exist
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
      }
  
      // Create toast element
      const toastElement = document.createElement('div');
      toastElement.className = `bg-white rounded-lg shadow-lg border p-4 
        ${variant === "destructive" ? "border-red-500" : "border-slate-200"}
        transform transition-all duration-300 ease-in-out`;
  
      // Add content
      if (title) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'font-semibold';
        titleDiv.textContent = title;
        toastElement.appendChild(titleDiv);
      }
  
      if (description) {
        const descDiv = document.createElement('div');
        descDiv.className = 'text-sm text-slate-500';
        descDiv.textContent = description;
        toastElement.appendChild(descDiv);
      }
  
      container.appendChild(toastElement);
  
      // Animate in
      requestAnimationFrame(() => {
        toastElement.style.opacity = '1';
        toastElement.style.transform = 'translateY(0)';
      });
  
      // Remove after duration
      setTimeout(() => {
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(-100%)';
        setTimeout(() => toastElement.remove(), 300);
  
        // Remove container if empty
        if (container?.childNodes.length === 1) {
          container.remove();
        }
      }, duration);
    }
  
    return { toast };
  }
  
  export { useToast };