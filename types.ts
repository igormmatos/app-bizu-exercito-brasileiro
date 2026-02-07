export enum ContentType {
  PDF = 'PDF',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  itemCount: number;
}

export interface ContentItem {
  id: string;
  categoryId: string;
  type: ContentType;
  title: string;
  description: string;
  versionLabel: string;
  sourceReference?: string;
  url?: string; // For mock purposes, points to file location
  fileSize?: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EDITOR';
  name: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'LOGIN';
  entityType: 'CONTENT' | 'CATEGORY' | 'SYSTEM';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalDownloads: number;
  totalItems: number;
  activeCategories: number;
  recentUploads: number;
}