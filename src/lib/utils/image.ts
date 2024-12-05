// src\lib\utils\image.ts
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  export const validateImage = (file: File): string | null => {
    // Check file size (1MB limit for Base64)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 1MB";
    }
  
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return "File must be JPEG, PNG, or GIF";
    }
  
    return null;
  };