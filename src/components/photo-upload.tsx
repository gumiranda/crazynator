'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Eye, 
  Download, 
  Copy, 
  Trash2, 
  FolderOpen,
  Camera,
  FileImage,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  tags?: string[];
  description?: string;
}

interface PhotoUploadProps {
  projectId: string;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedTypes?: string[];
  onUpload?: (files: UploadedFile[]) => void;
  onDelete?: (fileId: string) => void;
  initialFiles?: UploadedFile[];
  uploadEndpoint?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export default function PhotoUpload({
  projectId,
  maxFileSize = 10, // 10MB default
  maxFiles = 20,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  onUpload,
  onDelete,
  initialFiles = [],
  uploadEndpoint = '/api/upload'
}: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isValidFileType = (file: File) => {
    return acceptedTypes.includes(file.type);
  };

  const isValidFileSize = (file: File) => {
    return file.size <= maxFileSize * 1024 * 1024;
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 150;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    // Simulate upload progress
    const fileId = Math.random().toString(36).substring(7);
    setUploadingFiles(prev => new Map(prev.set(fileId, 0)));

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadingFiles(prev => {
        const currentProgress = prev.get(fileId) || 0;
        if (currentProgress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return new Map(prev.set(fileId, currentProgress + 10));
      });
    }, 200);

    try {
      // Generate thumbnail for images
      const thumbnail = file.type.startsWith('image/') ? await generateThumbnail(file) : undefined;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete progress
      setUploadingFiles(prev => new Map(prev.set(fileId, 100)));
      
      // Create uploaded file object
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // In real app, this would be the server URL
        thumbnail,
        uploadedAt: new Date(),
        tags: [],
        description: ''
      };

      // Remove from uploading files
      setTimeout(() => {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 1000);

      return uploadedFile;
    } catch (error) {
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
      throw error;
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    
    // Validate files
    const invalidFiles = filesToUpload.filter(file => 
      !isValidFileType(file) || !isValidFileSize(file)
    );
    
    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid files',
        description: `${invalidFiles.length} files were rejected due to type or size restrictions.`,
        variant: 'destructive',
      });
    }

    const validFiles = filesToUpload.filter(file => 
      isValidFileType(file) && isValidFileSize(file)
    );

    if (files.length + validFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed. Some files were not uploaded.`,
        variant: 'destructive',
      });
      return;
    }

    // Upload files
    const uploadPromises = validFiles.map(uploadFile);
    
    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedFiles]);
      
      if (onUpload) {
        onUpload(uploadedFiles);
      }

      toast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${uploadedFiles.length} files.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Some files failed to upload. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
  };

  const handleDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    
    if (onDelete) {
      onDelete(fileId);
    }

    toast({
      title: 'File deleted',
      description: 'File has been removed from your project.',
    });
  };

  const handleBulkDelete = () => {
    const fileIds = Array.from(selectedFiles);
    setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)));
    setSelectedFiles(new Set());
    
    fileIds.forEach(fileId => {
      if (onDelete) {
        onDelete(fileId);
      }
    });

    toast({
      title: 'Files deleted',
      description: `${fileIds.length} files have been removed.`,
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  const copyFileUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'URL copied',
        description: 'File URL copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy URL to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderFilePreview = (file: UploadedFile) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.thumbnail || file.url}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <FileImage className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Upload & Management
        </CardTitle>
        <CardDescription>
          Upload and manage photos for your project. Drag and drop files or click to browse.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Photos</TabsTrigger>
            <TabsTrigger value="gallery">Gallery ({files.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                'hover:border-primary hover:bg-primary/5 cursor-pointer'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Upload Photos</h3>
                  <p className="text-muted-foreground">
                    Drag and drop your photos here, or click to browse
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Max {maxFileSize}MB per file</Badge>
                  <Badge variant="outline">Up to {maxFiles} files</Badge>
                  <Badge variant="outline">JPG, PNG, GIF, WebP</Badge>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Progress */}
            {uploadingFiles.size > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Uploading Files</h3>
                {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
                  <div key={fileId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            {/* Gallery Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedFiles.size === files.length ? deselectAllFiles : selectAllFiles}
                >
                  {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedFiles.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedFiles.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {files.length} / {maxFiles} files
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </Button>
              </div>
            </div>

            {/* Gallery */}
            {files.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No photos uploaded yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Photos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((file) => (
                      <Card
                        key={file.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          selectedFiles.has(file.id) && 'ring-2 ring-primary'
                        )}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <CardContent className="p-2">
                          <div className="aspect-square rounded-md overflow-hidden mb-2">
                            {renderFilePreview(file)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyFileUrl(file.url);
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file);
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <Card
                        key={file.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          selectedFiles.has(file.id) && 'ring-2 ring-primary'
                        )}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                              {renderFilePreview(file)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)} • Uploaded {file.uploadedAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyFileUrl(file.url);
                                }}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy URL
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(file);
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(file.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}