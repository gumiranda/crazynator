import { useState } from 'react';
import { toast } from 'sonner';

interface UploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  fileUrl?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
}

interface PresignedUrlResponse {
  success: boolean;
  uploadUrl?: string;
  key?: string;
  fileUrl?: string;
  error?: string;
}

interface UseImageUploadReturn {
  uploadImage: (file: File, method?: 'direct' | 'presigned') => Promise<string | null>;
  isUploading: boolean;
  uploadedImages: string[];
  removeImage: (url: string) => void;
  clearImages: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const uploadImageDirect = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result: UploadResponse = await response.json();

    if (result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  };

  const uploadImagePresigned = async (file: File): Promise<string | null> => {
    // 1. Obter URL presignada
    const presignedResponse = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    const presignedResult: PresignedUrlResponse = await presignedResponse.json();

    if (!presignedResult.success || !presignedResult.uploadUrl) {
      throw new Error(presignedResult.error || 'Failed to get upload URL');
    }

    // 2. Upload direto para R2
    const uploadResponse = await fetch(presignedResult.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    // 3. Retornar URL do arquivo
    return presignedResult.fileUrl || null;
  };

  const uploadImage = async (file: File, method: 'direct' | 'presigned' = 'presigned'): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    
    try {
      let fileUrl: string | null;

      if (method === 'presigned') {
        fileUrl = await uploadImagePresigned(file);
      } else {
        fileUrl = await uploadImageDirect(file);
      }

      if (fileUrl) {
        setUploadedImages(prev => [...prev, fileUrl]);
        toast.success('Image uploaded successfully');
        return fileUrl;
      } else {
        toast.error('Upload failed');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
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