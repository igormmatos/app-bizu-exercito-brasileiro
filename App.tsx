import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ContentManager } from './components/ContentManager';
import { CategoryManager } from './components/CategoryManager';
import { AuditLogViewer } from './components/AuditLogViewer';
import { MobileApp } from './components/MobileApp';
import { AuthService } from './services/authService';
import { AdminUser } from './types';
import { Shield, Smartphone } from 'lucide-react';

function App() {
  const [appMode, setAppMode] = useState<'SELECT' | 'ADMIN' | 'APP'>('SELECT');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setAppMode('SELECT');
  };

  const handleSwitchMode = () => {
    setAppMode('SELECT');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-700"></div>
        <p className="text-army-800 font-medium">Carregando Bizus do Exército...</p>
      </div>
    );
  }

  // 1. Gateway Screen (Select Mode)
  if (appMode === 'SELECT') {
    return (
      <div className="min-h-screen bg-army-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Camo Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
               <pattern id="camop" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                   <path d="M10,10 C20,20 40,10 50,30" stroke="white" fill="none" strokeWidth="2" />
               </pattern>
               <rect width="100%" height="100%" fill="url(#camop)" />
           </svg>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
          {/* Mobile App Option */}
          <div 
            onClick={() => setAppMode('APP')}
            className="group bg-white rounded-2xl p-8 cursor-pointer shadow-2xl transform transition-all hover:-translate-y-2 hover:shadow-army-500/50 flex flex-col items-center text-center border-b-8 border-army-600"
          >
            <div className="h-24 w-24 bg-army-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-army-200 transition-colors">
              <Smartphone className="w-12 h-12 text-army-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acessar App</h2>
            <p className="text-gray-500 mb-6">Visualização do Recruta/Aluno. Consulta offline de manuais, toques e canções.</p>
            <span className="inline-flex items-center text-army-600 font-bold group-hover:underline">
              Entrar sem login &rarr;
            </span>
          </div>

          {/* Admin Panel Option */}
          <div 
            onClick={() => setAppMode('ADMIN')}
            className="group bg-slate-800 rounded-2xl p-8 cursor-pointer shadow-2xl transform transition-all hover:-translate-y-2 hover:shadow-black/50 flex flex-col items-center text-center border-b-8 border-slate-950"
          >
            <div className="h-24 w-24 bg-slate-700 rounded-full flex items-center justify-center mb-6 group-hover:bg-slate-600 transition-colors">
              <Shield className="w-12 h-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Painel Admin</h2>
            <p className="text-slate-400 mb-6">Área restrita para gestão de conteúdo, upload de arquivos e auditoria.</p>
            <span className="inline-flex items-center text-slate-300 font-bold group-hover:underline">
              {currentUser ? `Continuar como ${currentUser.name} ->` : 'Fazer Login ->'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mobile App View
  if (appMode === 'APP') {
    return <MobileApp onExit={() => setAppMode('SELECT')} />;
  }

  // 3. Admin Panel View
  if (!currentUser) {
    return (
      <div className="relative">
        <button 
          onClick={() => setAppMode('SELECT')} 
          className="absolute top-4 left-4 z-50 text-slate-500 hover:text-slate-800 font-medium flex items-center"
        >
          &larr; Voltar
        </button>
        <Login onLoginSuccess={handleLogin} />
      </div>
    );
  }

  const renderAdminView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'content': return <ContentManager />;
      case 'categories': return <CategoryManager />;
      case 'audit': return <AuditLogViewer />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      user={currentUser} 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onLogout={handleLogout}
      onSwitchMode={handleSwitchMode}
    >
      {renderAdminView()}
    </Layout>
  );
}

export default App;