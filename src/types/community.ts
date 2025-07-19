export interface CommunityProject {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  authorBio?: string;
  tags: string[];
  stars: number;
  views: number;
  forks: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string;
  screenshots?: string[];
  isPublic: boolean;
  featured: boolean;
  demoUrl?: string;
  githubUrl?: string;
  projectUrl: string;
}

export interface CommunityProjectFilters {
  search?: string;
  tags?: string[];
  sortBy: 'recent' | 'popular' | 'stars';
  featured?: boolean;
}

export interface CommunityProjectStats {
  totalProjects: number;
  totalDevelopers: number;
  totalViews: number;
  featuredProjects: number;
}