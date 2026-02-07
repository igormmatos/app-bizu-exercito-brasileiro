import React, { useState } from 'react';
import { AdminUser } from '../types';
import { 
  LayoutDashboard, 
  Files, 
  FolderTree, 
  History, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  ArrowLeftCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: AdminUser;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  onSwitchMode: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onChangeView, onLogout, onSwitchMode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Gerenciar Conteúdo', icon: Files },
    { id: 'categories', label: 'Categorias', icon: FolderTree },
    { id: 'audit', label: 'Auditoria', icon: History },
  ];

  const handleNavClick = (view: string) => {
    onChangeView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-army-900 text-white transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-army-950 border-b border-army-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-8 h-8 text-army-400" />
            <span className="text-xl font-bold tracking-wider">BIZUS ADMIN</span>
          </div>
        </div>

        <div className="p-4 border-b border-army-800">
          <p className="text-xs text-army-300 uppercase font-semibold">Usuário Logado</p>
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-army-700 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-army-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-army-800 space-y-2">
          <button
            onClick={onSwitchMode}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-army-200 hover:bg-army-800 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeftCircle className="w-5 h-5 mr-3" />
            Voltar ao Início
          </button>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-300 hover:bg-army-800 hover:text-red-200 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between lg:hidden px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center">
            <ShieldCheck className="w-6 h-6 text-army-800 mr-2" />
            <span className="font-bold text-army-900">Bizus EB</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};