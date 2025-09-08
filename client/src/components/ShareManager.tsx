import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { sharingService } from '@/services/api';
import { UserShare, SharePermission, ShareResponse } from '@/types';

const ShareManager: React.FC = () => {
  const [invitations, setInvitations] = useState<UserShare[]>([]);
  const [sentInvitations, setSentInvitations] = useState<UserShare[]>([]);
  const [activeShares, setActiveShares] = useState<{ sharedByMe: UserShare[]; sharedWithMe: UserShare[] }>({
    sharedByMe: [],
    sharedWithMe: []
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<SharePermission>('READ');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  console.log('✅ ShareManager - Componente carregado');

  const permissionLabels: Record<SharePermission, string> = {
    READ: 'Apenas Visualização (pode ver todos os dados do orçamento)',
    WRITE: 'Visualização e Edição (pode modificar contas, transações e orçamentos)'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('📡 ShareManager: Carregando dados...');
    try {
      setLoading(true);
      setHasError(false);
      
      const [invitationsData, sentInvitationsData, activeSharesData] = await Promise.all([
        sharingService.getInvitations().catch((error) => {
          console.log('❌ Erro ao carregar invitations:', error);
          return [];
        }),
        sharingService.getSentInvitations().catch((error) => {
          console.log('❌ Erro ao carregar sent invitations:', error);
          return [];
        }),
        sharingService.getActiveShares().catch((error) => {
          console.log('❌ Erro ao carregar active shares:', error);
          return { sharedByMe: [], sharedWithMe: [] };
        })
      ]);
      
      setInvitations(invitationsData || []);
      setSentInvitations(sentInvitationsData || []);
      setActiveShares(activeSharesData || { sharedByMe: [], sharedWithMe: [] });
      
      console.log('✅ Dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setHasError(true);
      toast.error('Erro ao carregar dados de compartilhamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      toast.error('Preencha o email do usuário');
      return;
    }

    try {
      console.log('📤 Enviando convite:', { inviteEmail, selectedPermission });
      
      await sharingService.sendInvite({
        email: inviteEmail,
        permission: selectedPermission
      });
      
      toast.success('Convite enviado com sucesso!');
      setShowInviteForm(false);
      setInviteEmail('');
      setSelectedPermission('READ');
      
      // Recarregar dados
      await loadData();
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    }
  };

  const handleAcceptInvite = async (shareId: string) => {
    try {
      console.log('✅ Aceitando convite:', shareId);
      
      await sharingService.respondToInvite(shareId, { action: 'accept' });
      
      toast.success('Convite aceito com sucesso!');
      await loadData();
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      toast.error('Erro ao aceitar convite');
    }
  };

  const handleRejectInvite = async (shareId: string) => {
    try {
      console.log('❌ Rejeitando convite:', shareId);
      
      await sharingService.respondToInvite(shareId, { action: 'reject' });
      
      toast.success('Convite rejeitado');
      await loadData();
    } catch (error) {
      console.error('❌ Erro ao rejeitar convite:', error);
      toast.error('Erro ao rejeitar convite');
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      console.log('🗑️ Revogando compartilhamento:', shareId);
      
      await sharingService.revokeShare(shareId);
      
      toast.success('Compartilhamento revogado');
      await loadData();
    } catch (error) {
      console.error('❌ Erro ao revogar compartilhamento:', error);
      toast.error('Erro ao revogar compartilhamento');
    }
  };

  const testFunction = () => {
    console.log('🧪 Botão de teste clicado!');
    toast.success('Funcionalidade de teste funcionando!');
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              Erro ao carregar dados
            </h3>
            <p className="text-gray-500 mb-6">
              Não foi possível carregar os dados de compartilhamento.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Permissão
                </label>
                <div className="space-y-3">
                  {Object.entries(permissionLabels).map(([permission, label]) => (
                    <label key={permission} className="flex items-start">
                      <input
                        type="radio"
                        name="permission"
                        value={permission}
                        checked={selectedPermission === permission}
                        onChange={(e) => setSelectedPermission(e.target.value as SharePermission)}
                        className="mr-3 mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{permission.toUpperCase()}</div>
                        <div className="text-xs text-gray-600">{label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enviar Convite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Convites Recebidos */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Convites Recebidos</h2>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{invitation.owner?.name || 'Usuário desconhecido'}</p>
                  <p className="text-sm text-gray-600">{invitation.owner?.email || 'Email não disponível'}</p>
                  <p className="text-xs text-gray-500">
                    Permissão: {permissionLabels[invitation.permission]}
                  </p>
                  {invitation.budget && (
                    <p className="text-xs text-gray-500">
                      Orçamento: {invitation.budget.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcceptInvite(invitation.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => handleRejectInvite(invitation.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Compartilhamentos Ativos */}
      {(activeShares.sharedByMe.length > 0 || activeShares.sharedWithMe.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Compartilhamentos Ativos</h2>
          
          {activeShares.sharedByMe.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Compartilhados por mim</h3>
              <div className="space-y-2">
                {activeShares.sharedByMe.map((share) => (
                  <div key={share.id} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{share.sharedWith?.name || 'Usuário desconhecido'}</p>
                      <p className="text-sm text-gray-600">{share.sharedWith?.email || 'Email não disponível'}</p>
                    </div>
                    <button 
                      onClick={() => handleRevokeShare(share.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Revogar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeShares.sharedWithMe.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-2">Compartilhados comigo</h3>
              <div className="space-y-2">
                {activeShares.sharedWithMe.map((share) => (
                  <div key={share.id} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{share.owner?.name || 'Usuário desconhecido'}</p>
                      <p className="text-sm text-gray-600">{share.owner?.email || 'Email não disponível'}</p>
                    </div>
                    <button 
                      onClick={() => handleRevokeShare(share.id)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Sair
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !hasError && invitations.length === 0 && sentInvitations.length === 0 && 
       activeShares.sharedByMe.length === 0 && activeShares.sharedWithMe.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum compartilhamento encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Comece convidando outros usuários para compartilhar seu orçamento.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Convidar Usuário
            </button>
            <button
              onClick={testFunction}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🧪 Teste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareManager;
