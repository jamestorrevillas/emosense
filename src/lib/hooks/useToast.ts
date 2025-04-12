// src/lib/hooks/useToast.ts
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
}

function useToast() {
  function toast({ title, description, variant = "default", duration = 5000 }: ToastOptions) {
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
    }

    // Create toast element
    const toastElement = document.createElement('div');
    
    // Apply styling based on variant
    let variantStyles = '';
    switch (variant) {
      case 'success':
        variantStyles = 'border-green-500 bg-green-50 text-green-800';
        break;
      case 'warning':
        variantStyles = 'border-yellow-500 bg-yellow-50 text-yellow-800';
        break;
      case 'info':
        variantStyles = 'border-blue-500 bg-blue-50 text-blue-800';
        break;
      case 'destructive':
        variantStyles = 'border-red-500 bg-red-50 text-red-800';
        break;
      default:
        variantStyles = 'border-slate-200 bg-white text-slate-900';
    }

    toastElement.className = `rounded-lg shadow-lg border-l-4 p-4 
      ${variantStyles}
      transform transition-all duration-300 ease-in-out opacity-0 translate-y-2 max-w-md w-full`;

    // Add content
    if (title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'font-semibold';
      titleDiv.textContent = title;
      toastElement.appendChild(titleDiv);
    }

    if (description) {
      const descDiv = document.createElement('div');
      descDiv.className = 'text-sm';
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
      toastElement.style.transform = 'translateY(8px)';
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