'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { InvitationLink } from '@/types';

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/invitations');
      setInvitations(response.data.invitationLinks);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar enlaces');
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async () => {
    try {
      setCreating(true);
      const response = await api.post('/api/admin/invitations', { expiresInDays });
      setInvitations([response.data.invitationLink, ...invitations]);
      setShowCreateForm(false);
      setExpiresInDays(7);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear enlace');
    } finally {
      setCreating(false);
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este enlace?')) return;

    try {
      await api.delete(`/api/admin/invitations/${id}`);
      setInvitations(invitations.filter(inv => inv.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar enlace');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Podrías mostrar un toast de éxito aquí
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enlaces de Invitación</h1>
          <p className="text-gray-600">Gestiona los enlaces para registro de profesores</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Crear Enlace
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Enlace</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700">
                Días de expiración
              </label>
              <input
                type="number"
                id="expiresInDays"
                min="1"
                max="30"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createInvitation}
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Enlace'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de enlaces */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {invitations.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              No hay enlaces de invitación creados aún
            </li>
          ) : (
            invitations.map((invitation) => (
              <li key={invitation.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Código: {invitation.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          Creado: {new Date(invitation.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expira: {new Date(invitation.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invitation.isUsed
                            ? 'bg-green-100 text-green-800'
                            : invitation.isExpired
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {invitation.isUsed
                            ? 'Usado'
                            : invitation.isExpired
                            ? 'Expirado'
                            : 'Activo'}
                        </span>
                      </div>
                    </div>
                    {invitation.isUsed && invitation.usedBy && (
                      <div className="mt-2 text-sm text-gray-600">
                        Usado por: {invitation.usedBy.nombre} ({invitation.usedBy.email})
                        {invitation.usedAt && ` - ${new Date(invitation.usedAt).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {!invitation.isUsed && !invitation.isExpired && (
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/register?invitation=${invitation.code}`)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Copiar URL
                      </button>
                    )}
                    {!invitation.isUsed && (
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
