import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Category } from '../types';
import { Plus, Folder, Power, Edit3 } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await DataService.getCategories();
    setCategories(data);
  };

  const handleTogglePublish = async (id: string) => {
    await DataService.toggleCategoryPublish(id);
    loadCategories();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newCatName) return;
    
    await DataService.addCategory({
        name: newCatName,
        description: newCatDesc,
        isPublished: true
    });
    
    setNewCatName('');
    setNewCatDesc('');
    setIsFormOpen(false);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center px-4 py-2 bg-army-600 text-white rounded-lg hover:bg-army-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Nova Categoria
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg border border-army-200 shadow-sm animate-fade-in mb-6">
            <h3 className="font-semibold mb-4 text-gray-800">Adicionar Nova Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                    type="text" 
                    placeholder="Nome da Categoria" 
                    className="border border-gray-300 p-2 rounded w-full text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    required
                />
                <input 
                    type="text" 
                    placeholder="Descrição curta (opcional)" 
                    className="border border-gray-300 p-2 rounded w-full text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500"
                    value={newCatDesc}
                    onChange={e => setNewCatDesc(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-army-600 text-white rounded">Salvar</button>
            </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className={`bg-white rounded-lg shadow-sm border transition-shadow hover:shadow-md ${cat.isPublished ? 'border-gray-200' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-army-50 rounded-lg">
                  <Folder className="w-6 h-6 text-army-600" />
                </div>
                <button 
                    onClick={() => handleTogglePublish(cat.id)}
                    className={`p-2 rounded-full transition-colors ${cat.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={cat.isPublished ? 'Publicado' : 'Não Publicado'}
                >
                    <Power className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="mt-4 text-lg font-bold text-gray-900">{cat.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{cat.description || 'Sem descrição'}</p>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">{cat.itemCount} itens</span>
                <button className="text-army-600 hover:text-army-800 flex items-center">
                    <Edit3 className="w-3 h-3 mr-1" /> Editar
                </button>
              </div>
            </div>
            {!cat.isPublished && (
                <div className="bg-yellow-100 px-6 py-2 text-xs text-yellow-800 font-medium rounded-b-lg">
                    Rascunho (Invisível no App)
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};