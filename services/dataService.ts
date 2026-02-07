import { Category, ContentItem, ContentType, AuditLog, DashboardStats } from '../types';

// Mock Initial Data
let categories: Category[] = [
  { id: '1', name: 'Manuais e Regulamentos', description: 'RISG, R-105, C 20-20', isPublished: true, itemCount: 12 },
  { id: '2', name: 'Hinos e Canções', description: 'Canção do Exército, Fibra de Herói', isPublished: true, itemCount: 8 },
  { id: '3', name: 'Toques de Corneta', description: 'Alvorada, Silêncio, Reunir', isPublished: true, itemCount: 15 },
  { id: '4', name: 'Uniformes e Insígnias', description: 'RUE, Distintivos', isPublished: true, itemCount: 20 },
  { id: '5', name: 'Bizus Gerais', description: 'Dicas de campo, hierarquia', isPublished: false, itemCount: 5 },
];

let contentItems: ContentItem[] = [
  { 
    id: '101', categoryId: '1', type: ContentType.PDF, title: 'RISG - Regulamento Interno', 
    description: 'Regulamento Interno e dos Serviços Gerais atualizado 2024.', 
    versionLabel: 'v2.1', isPublished: true, updatedAt: '2024-05-10T10:00:00Z', 
    sourceReference: 'Portaria Nº 123', url: '#', fileSize: '2.5 MB'
  },
  { 
    id: '102', categoryId: '2', type: ContentType.AUDIO, title: 'Canção do Exército', 
    description: 'Letra e Música oficial.', 
    versionLabel: 'v1.0', isPublished: true, updatedAt: '2023-11-15T08:30:00Z', 
    sourceReference: 'SGEx', url: '#', fileSize: '4.2 MB'
  },
  { 
    id: '103', categoryId: '3', type: ContentType.AUDIO, title: 'Toque de Alvorada', 
    description: 'Toque para despertar a tropa.', 
    versionLabel: 'v1.0', isPublished: true, updatedAt: '2023-11-15T08:35:00Z', 
    sourceReference: 'Manual de Toques', url: '#', fileSize: '1.1 MB'
  },
  {
    id: '104', categoryId: '4', type: ContentType.IMAGE, title: 'Insígnia Cabo',
    description: 'Detalhes visuais da graduação de Cabo.',
    versionLabel: 'v1.0', isPublished: true, updatedAt: '2024-01-20T14:20:00Z',
    sourceReference: 'RUE', url: 'https://picsum.photos/200', fileSize: '0.5 MB'
  }
];

let auditLogs: AuditLog[] = [
  { id: 'log1', adminEmail: 'admin@eb.mil.br', action: 'LOGIN', entityType: 'SYSTEM', entityId: 'sys', details: 'Login realizado com sucesso', timestamp: '2024-05-20T08:00:00Z' },
  { id: 'log2', adminEmail: 'admin@eb.mil.br', action: 'UPDATE', entityType: 'CONTENT', entityId: '101', details: 'Atualizou versão do RISG', timestamp: '2024-05-19T14:30:00Z' },
];

export const DataService = {
  getCategories: (): Promise<Category[]> => {
    return Promise.resolve([...categories]);
  },

  addCategory: (category: Omit<Category, 'id' | 'itemCount'>): Promise<Category> => {
    const newCat = { ...category, id: Math.random().toString(36).substr(2, 9), itemCount: 0 };
    categories.push(newCat);
    DataService.addAuditLog('CREATE', 'CATEGORY', newCat.id, `Criou categoria ${newCat.name}`);
    return Promise.resolve(newCat);
  },

  toggleCategoryPublish: (id: string): Promise<void> => {
    categories = categories.map(c => c.id === id ? { ...c, isPublished: !c.isPublished } : c);
    DataService.addAuditLog('PUBLISH', 'CATEGORY', id, 'Alterou status de publicação');
    return Promise.resolve();
  },

  getContentItems: (): Promise<ContentItem[]> => {
    return Promise.resolve([...contentItems]);
  },

  addContentItem: (item: Omit<ContentItem, 'id' | 'updatedAt'>): Promise<ContentItem> => {
    const newItem = { 
      ...item, 
      id: Math.random().toString(36).substr(2, 9), 
      updatedAt: new Date().toISOString() 
    };
    contentItems.push(newItem);
    
    // Update category count
    categories = categories.map(c => c.id === item.categoryId ? { ...c, itemCount: c.itemCount + 1 } : c);

    DataService.addAuditLog('CREATE', 'CONTENT', newItem.id, `Adicionou item ${newItem.title}`);
    return Promise.resolve(newItem);
  },

  updateContentItem: (item: ContentItem): Promise<ContentItem> => {
    contentItems = contentItems.map(i => i.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : i);
    DataService.addAuditLog('UPDATE', 'CONTENT', item.id, `Atualizou item ${item.title}`);
    return Promise.resolve(item);
  },

  deleteContentItem: (id: string): Promise<void> => {
    const item = contentItems.find(i => i.id === id);
    if (item) {
        categories = categories.map(c => c.id === item.categoryId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c);
    }
    contentItems = contentItems.filter(i => i.id !== id);
    DataService.addAuditLog('DELETE', 'CONTENT', id, 'Removeu item');
    return Promise.resolve();
  },

  getAuditLogs: (): Promise<AuditLog[]> => {
    return Promise.resolve([...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  },

  addAuditLog: (action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      adminEmail: 'admin@eb.mil.br', // Mock current user
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    auditLogs.push(newLog);
  },

  getDashboardStats: (): Promise<DashboardStats> => {
    return Promise.resolve({
      totalDownloads: 12540,
      totalItems: contentItems.length,
      activeCategories: categories.filter(c => c.isPublished).length,
      recentUploads: 12
    });
  }
};