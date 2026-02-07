import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { ContentItem, ContentType, Category } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  Music, 
  Image as ImageIcon, 
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';

export const ContentManager: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [currentItem, setCurrentItem] = useState<Partial<ContentItem>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, i] = await Promise.all([
        DataService.getCategories(),
        DataService.getContentItems()
    ]);
    setCategories(c);
    setItems(i);
  };

  const handleOpenModal = (item?: ContentItem) => {
    if (item) {
        setCurrentItem(item);
    } else {
        setCurrentItem({
            title: '',
            description: '',
            type: ContentType.PDF,
            categoryId: categories[0]?.id || '',
            versionLabel: 'v1.0',
            sourceReference: '',
            isPublished: false
        });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja remover este item?')) {
        await DataService.deleteContentItem(id);
        loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    // Simulate upload delay
    await new Promise(r => setTimeout(r, 800));

    try {
        if (currentItem.id) {
            await DataService.updateContentItem(currentItem as ContentItem);
        } else {
            // Mock file URL generation
            const mockUrl = selectedFile ? URL.createObjectURL(selectedFile) : '#';
            await DataService.addContentItem({
                ...(currentItem as Omit<ContentItem, 'id' | 'updatedAt'>),
                url: mockUrl,
                fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '0 MB'
            });
        }
        setIsModalOpen(false);
        loadData();
    } catch (err) {
        console.error(err);
        alert('Erro ao salvar item.');
    } finally {
        setIsUploading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(filter.toLowerCase()) || 
                          item.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
        case ContentType.AUDIO: return <Music className="w-5 h-5 text-purple-600" />;
        case ContentType.IMAGE: return <ImageIcon className="w-5 h-5 text-blue-600" />;
        default: return <FileText className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Conteúdo</h1>
        <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-army-600 text-white rounded-lg hover:bg-army-700 transition-colors"
        >
            <Plus className="w-5 h-5 mr-2" /> Novo Item
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Buscar por título ou descrição..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <select 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-army-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
            >
                <option value="ALL">Todas Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">Título / Descrição</th>
                        <th className="px-6 py-3">Categoria</th>
                        <th className="px-6 py-3">Versão</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                    {getTypeIcon(item.type)}
                                    <span className="text-xs font-medium">{item.type}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-gray-900 font-medium">{item.title}</p>
                                <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {categories.find(c => c.id === item.categoryId)?.name}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                    {item.versionLabel}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {item.isPublished ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Publicado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Rascunho
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    <button 
                                        onClick={() => handleOpenModal(item)}
                                        className="p-1 hover:bg-gray-200 rounded text-blue-600" title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1 hover:bg-red-50 rounded text-red-600" title="Remover"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                Nenhum item encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {currentItem.id ? 'Editar Conteúdo' : 'Novo Conteúdo'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input 
                                required
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white placeholder-gray-500 focus:ring-army-500 focus:border-army-500"
                                value={currentItem.title}
                                onChange={e => setCurrentItem({...currentItem, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:ring-army-500 focus:border-army-500"
                                value={currentItem.categoryId}
                                onChange={e => setCurrentItem({...currentItem, categoryId: e.target.value})}
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea 
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white placeholder-gray-500 focus:ring-army-500 focus:border-army-500"
                            value={currentItem.description}
                            onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Arquivo</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:ring-army-500 focus:border-army-500"
                                value={currentItem.type}
                                onChange={e => setCurrentItem({...currentItem, type: e.target.value as ContentType})}
                            >
                                {Object.values(ContentType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Versão (ex: v1.0)</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white placeholder-gray-500 focus:ring-army-500 focus:border-army-500"
                                value={currentItem.versionLabel}
                                onChange={e => setCurrentItem({...currentItem, versionLabel: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fonte / Referência</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white placeholder-gray-500 focus:ring-army-500 focus:border-army-500"
                                value={currentItem.sourceReference}
                                onChange={e => setCurrentItem({...currentItem, sourceReference: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <label className="cursor-pointer">
                            <span className="bg-army-600 text-white px-3 py-1 rounded text-sm hover:bg-army-700">Escolher Arquivo</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                            />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            {selectedFile ? `Selecionado: ${selectedFile.name}` : 'Nenhum arquivo selecionado. (Max 50MB)'}
                        </p>
                        {currentItem.url && !selectedFile && (
                             <p className="text-xs text-blue-500 mt-1">Arquivo atual já existe no servidor.</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                         <input 
                            type="checkbox" 
                            id="published"
                            className="h-4 w-4 text-army-600 rounded border-gray-300 focus:ring-army-500"
                            checked={currentItem.isPublished}
                            onChange={e => setCurrentItem({...currentItem, isPublished: e.target.checked})}
                         />
                         <label htmlFor="published" className="text-sm text-gray-700 font-medium">Publicar imediatamente após salvar</label>
                    </div>

                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isUploading}
                        className="px-4 py-2 bg-army-600 text-white rounded-lg hover:bg-army-700 flex items-center disabled:opacity-50"
                    >
                        {isUploading ? 'Processando...' : 'Salvar Conteúdo'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};