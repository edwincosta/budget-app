import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { sharingService } from '@/services/api';
import { UserShare, SharePermission } from '@/types';

const ShareManager: React.FC = () => {
  const [invitations, setInvitations] = useState<UserShare[]>([]);
  const [sentInvitations, setSentInvitations] = useState<UserShare[]>([]);
  const [activeShares, setActiveShares] = useState<{ sharedByMe: UserShare[]; sharedWithMe: UserShare[] }>({
    sharedByMe: [],
    sharedWithMe: []
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<SharePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const permissionLabels: Record<SharePermission, string> = {
    READ_ACCOUNTS: 'Visualizar Contas',
    WRITE_ACCOUNTS: 'Editar Contas',
    READ_TRANSACTIONS: 'Visualizar Transações',
    WRITE_TRANSACTIONS: 'Editar Transações',
    READ_BUDGETS: 'Visualizar Orçamentos',
    WRITE_BUDGETS: 'Editar Orçamentos',
    READ_CATEGORIES: 'Visualizar Categorias',
    WRITE_CATEGORIES: 'Editar Categorias'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      
      const [invitationsData, sentInvitationsData, activeSharesData] = await Promise.all([
        sharingService.getInvitations().catch((error) => {
          // Se for erro 404 ou dados não encontrados, retorna array vazio silenciosamente
          if (error?.response?.status === 404 || error?.response?.data?.message?.includes('não encontrado')) {
            return [];
          }
          throw error;
        }),
        sharingService.getSentInvitations().catch((error) => {
          if (error?.response?.status === 404 || error?.response?.data?.message?.includes('não encontrado')) {
            return [];
          }
          throw error;
        }),
        sharingService.getActiveShares().catch((error) => {
          if (error?.response?.status === 404 || error?.response?.data?.message?.includes('não encontrado')) {
            return { sharedByMe: [], sharedWithMe: [] };
          }
          throw error;
        })
      ]);
      
      setInvitations(invitationsData || []);
      setSentInvitations(sentInvitationsData || []);
      setActiveShares(activeSharesData || { sharedByMe: [], sharedWithMe: [] });
    } catch (error) {
      console.error('Erro ao carregar dados de compartilhamento:', error);
      setHasError(true);
      // Inicializar com dados vazios em caso de erro real
      setInvitations([]);
      setSentInvitations([]);
      setActiveShares({ sharedByMe: [], sharedWithMe: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || selectedPermissions.length === 0) {
      toast.error('Preencha o email e selecione ao menos uma permissão');
      return;
    }

    try {
      await sharingService.sendInvite({
        email: inviteEmail,
        permissions: selectedPermissions
      });
      
      toast.success('Convite enviado com sucesso!');
      setShowInviteForm(false);
      setInviteEmail('');
      setSelectedPermissions([]);
      loadData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erro ao enviar convite';
      toast.error(errorMessage);
    }
  };

  const handleRespondToInvite = async (shareId: string, action: 'accept' | 'reject') => {
    try {
      await sharingService.respondToInvite(shareId, { action });
      toast.success(action === 'accept' ? 'Convite aceito!' : 'Convite rejeitado!');
      loadData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erro ao responder convite';
      toast.error(errorMessage);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Tem certeza que deseja revogar este compartilhamento?')) {
      return;
    }

    try {
      await sharingService.revokeShare(shareId);
      toast.success('Compartilhamento revogado!');
      loadData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erro ao revogar compartilhamento';
      toast.error(errorMessage);
    }
  };

  const handlePermissionChange = (permission: SharePermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Estado de erro de conectividade
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Compartilhamento</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.774 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro ao carregar dados de compartilhamento
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Compartilhamento</h1>
        <button
          onClick={() => setShowInviteForm(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          Convidar Usuário
        </button>
      </div>

      {/* Formulário de Convite */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Convidar Usuário</h2>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Usuário
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissões
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(permissionLabels).map(([permission, label]) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission as SharePermission)}
                        onChange={() => handlePermissionChange(permission as SharePermission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  Enviar Convite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convites Recebidos */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Convites Recebidos</h2>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900">
                      {invitation.owner?.name} ({invitation.owner?.email})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permissões: {invitation.permissions.map(p => permissionLabels[p]).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Convite enviado em {new Date(invitation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespondToInvite(invitation.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleRespondToInvite(invitation.id, 'reject')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convites Enviados */}
      {sentInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Convites Enviados (Pendentes)</h2>
          <div className="space-y-4">
            {sentInvitations.map((invitation) => (
              <div key={invitation.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900">
                      {invitation.sharedWith?.name} ({invitation.sharedWith?.email})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permissões: {invitation.permissions.map(p => permissionLabels[p]).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Convite enviado em {new Date(invitation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1 font-medium">
                      Status: Aguardando resposta
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compartilhamentos que eu fiz */}
      {activeShares.sharedByMe.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Meus Compartilhamentos</h2>
          <div className="space-y-4">
            {activeShares.sharedByMe.map((share) => (
              <div key={share.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900">
                      {share.sharedWith?.name} ({share.sharedWith?.email})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permissões: {share.permissions.map(p => permissionLabels[p]).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Compartilhado em {new Date(share.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeShare(share.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium flex-shrink-0"
                  >
                    Revogar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compartilhamentos que tenho acesso */}
      {activeShares.sharedWithMe.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Acesso Compartilhado</h2>
          <div className="space-y-4">
            {activeShares.sharedWithMe.map((share) => (
              <div key={share.id} className="border border-gray-200 rounded-lg p-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {share.owner?.name} ({share.owner?.email})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Suas permissões: {share.permissions.map(p => permissionLabels[p]).join(', ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aceito em {new Date(share.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <a
                    href={`/dashboard?sharedUser=${share.ownerId}`}
                    className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Acessar Dados
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio - Melhorado */}
      {invitations.length === 0 && sentInvitations.length === 0 && activeShares.sharedByMe.length === 0 && activeShares.sharedWithMe.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum compartilhamento encontrado
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Você ainda não possui compartilhamentos ativos. Comece convidando outro usuário para compartilhar seus dados financeiros ou aguarde convites de outros usuários.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowInviteForm(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Convidar Primeiro Usuário
              </button>
              <div className="text-sm text-gray-400">
                <p>💡 <strong>Dica:</strong> Com o compartilhamento você pode:</p>
                <ul className="text-left inline-block mt-2 space-y-1">
                  <li>• Compartilhar visualização de contas e transações</li>
                  <li>• Permitir colaboração em orçamentos familiares</li>
                  <li>• Controlar quais dados cada pessoa pode ver/editar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareManager;
