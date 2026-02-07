import { AdminUser } from '../types';
import { DataService } from './dataService';

const MOCK_USER: AdminUser = {
  id: 'admin-001',
  email: 'admin@eb.mil.br',
  name: 'Sgt. Silva',
  role: 'ADMIN'
};

export const AuthService = {
  login: async (email: string, password: string): Promise<AdminUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@eb.mil.br' && password === 'selva') {
          DataService.addAuditLog('LOGIN', 'SYSTEM', 'sys', 'Login efetuado com sucesso');
          resolve(MOCK_USER);
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 1000);
    });
  },

  logout: (): Promise<void> => {
    return Promise.resolve();
  }
};