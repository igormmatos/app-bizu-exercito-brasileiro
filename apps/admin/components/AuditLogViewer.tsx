import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { AuditLog } from '../types';
import { History, User, Activity } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    DataService.getAuditLogs().then(setLogs);
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
        case 'CREATE': return 'bg-green-100 text-green-800';
        case 'DELETE': return 'bg-red-100 text-red-800';
        case 'UPDATE': return 'bg-blue-100 text-blue-800';
        case 'PUBLISH': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center">
            <History className="w-6 h-6 mr-3 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Auditoria do Sistema</h1>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
                {logs.map((log) => (
                    <li key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        {log.action === 'LOGIN' ? <User className="w-5 h-5 text-slate-500" /> : <Activity className="w-5 h-5 text-slate-500" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        <span className="font-bold">{log.adminEmail}</span> realizou <span className="font-mono">{log.action}</span> em <span className="font-mono">{log.entityType}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">{log.details}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                    {log.action}
                                </span>
                                <time className="text-xs text-gray-400">
                                    {new Date(log.timestamp).toLocaleString()}
                                </time>
                            </div>
                        </div>
                    </li>
                ))}
                {logs.length === 0 && (
                    <li className="p-8 text-center text-gray-500">Nenhum registro de auditoria encontrado.</li>
                )}
            </ul>
        </div>
    </div>
  );
};