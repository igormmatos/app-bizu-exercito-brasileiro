import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { DashboardStats } from '../types';
import { 
  Download, 
  FileText, 
  FolderCheck, 
  UploadCloud,
  TrendingUp 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{name: string, items: number}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const dashboardStats = await DataService.getDashboardStats();
      const categories = await DataService.getCategories();
      
      setStats(dashboardStats);
      
      const data = categories.map(c => ({
        name: c.name.split(' ')[0], // Shorten name for chart
        items: c.itemCount
      }));
      setChartData(data);
    };

    fetchData();
  }, []);

  if (!stats) return <div className="p-4">Carregando indicadores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <span className="text-sm text-gray-500">Última atualização: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Downloads (Estimado)</p>
              <p className="text-2xl font-bold text-army-800">{stats.totalDownloads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Download className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 flex items-center font-medium">
             <TrendingUp className="w-3 h-3 mr-1" /> +12% esta semana
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Itens no Catálogo</p>
              <p className="text-2xl font-bold text-army-800">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full text-purple-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Documentos, Áudios e Imagens
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Categorias Ativas</p>
              <p className="text-2xl font-bold text-army-800">{stats.activeCategories}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600">
              <FolderCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Disponíveis para download offline
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Uploads Recentes</p>
              <p className="text-2xl font-bold text-army-800">{stats.recentUploads}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full text-orange-600">
              <UploadCloud className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Nos últimos 30 dias
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição de Conteúdo por Categoria</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f4f7f5'}} />
              <Bar dataKey="items" fill="#548462" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};