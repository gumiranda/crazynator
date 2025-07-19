import { useState } from 'react';
import { toast } from 'sonner';

interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
}

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string | null>;
  isUploading: boolean;
  uploadedImages: string[];
  removeImage: (url: string) => void;
  clearImages: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success && result.url) {
        setUploadedImages(prev => [...prev, result.url!]);
        toast.success('Image uploaded successfully');
        return result.url;
      } else {
        toast.error(result.error || 'Upload failed');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url));
  };

  const clearImages = () => {
    setUploadedImages([]);
  };

  return {
    uploadImage,
    isUploading,
    uploadedImages,
    removeImage,
    clearImages,
  };
};