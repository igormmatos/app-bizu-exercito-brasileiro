import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { AdminUser } from '../types';
import { Shield, Loader2, Lock } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await AuthService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
         <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <pattern id="camop" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                 <path d="M10,10 C20,20 40,10 50,30" stroke="black" fill="none" />
             </pattern>
             <rect width="100%" height="100%" fill="url(#camop)" />
         </svg>
      </div>

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-slate-200">
        <div className="bg-army-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full">
                <Shield className="w-10 h-10 text-army-800" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Bizus do Exército</h2>
          <p className="text-army-200 text-sm mt-1">Acesso Administrativo Restrito</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Militar</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-army-500"
                placeholder="admin@eb.mil.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-army-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                    <input id="remember" type="checkbox" className="h-4 w-4 text-army-600 focus:ring-army-500 border-gray-300 rounded" />
                    <label htmlFor="remember" className="ml-2 block text-gray-900">Lembrar acesso</label>
                </div>
                <a href="#" className="text-army-600 hover:text-army-500 font-medium">Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-army-600 hover:bg-army-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-army-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Entrar no Painel
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Sistema de uso exclusivo para gerenciamento de conteúdo.</p>
            <p>Dica: Use <b>admin@eb.mil.br</b> / <b>selva</b></p>
          </div>
        </div>
      </div>
    </div>
  );
};