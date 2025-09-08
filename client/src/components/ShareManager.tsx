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

  const permissionLabels: Record<SharePermission, string> = {
    READ: 'Apenas Visualização (pode ver todos os dados do orçamento)',
    WRITE: 'Visualização e Edição (pode modificar contas, transações e orçamentos)'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      
      // Carregar dados
      const invitationsData = await sharingService.getInvitations().catch((error) => {
        console.error('Erro ao carregar convites:', error);
        toast.error(`Erro ao carregar convites recebidos: ${error.response?.data?.message || error.message}`);
        return [];
      });

      const sentInvitationsData = await sharingService.getSentInvitations().catch((error) => {
        console.error('Erro ao carregar convites enviados:', error);
        toast.error(`Erro ao carregar convites enviados: ${error.response?.data?.message || error.message}`);
        return [];
      });
      
      const activeSharesData = await sharingService.getActiveShares().catch((error) => {
        console.error('Erro ao carregar compartilhamentos:', error);
        toast.error(`Erro ao carregar compartilhamentos ativos: ${error.response?.data?.message || error.message}`);
        return { sharedByMe: [], sharedWithMe: [] };
      });
      
      setInvitations(invitationsData || []);
      setSentInvitations(sentInvitationsData || []);
      setActiveShares(activeSharesData || { sharedByMe: [], sharedWithMe: [] });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao enviar convite: ${errorMessage}`);
    }
  };

  const handleAcceptInvite = async (shareId: string) => {
    try {
      await sharingService.respondToInvite(shareId, { action: 'accept' });
      
      toast.success('Convite aceito com sucesso!');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao aceitar convite: ${errorMessage}`);
    }
  };

  const handleRejectInvite = async (shareId: string) => {
    try {
      await sharingService.respondToInvite(shareId, { action: 'reject' });
      
      toast.success('Convite rejeitado');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao rejeitar convite:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao rejeitar convite: ${errorMessage}`);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await sharingService.revokeShare(shareId);
      
      toast.success('Compartilhamento revogado');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao revogar compartilhamento:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao revogar compartilhamento: ${errorMessage}`);
    }
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Convites Recebidos</h2>
        {invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <p className="font-medium text-base text-gray-900">
                        {invitation.budget?.owner?.name || 'Usuário desconhecido'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {invitation.budget?.owner?.email || 'Email não disponível'}
                      </p>
                    </div>
                    
                    {invitation.budget && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-700">Orçamento:</p>
                        <p className="text-sm text-gray-600">{invitation.budget.name}</p>
                        {invitation.budget.description && (
                          <p className="text-xs text-gray-500 mt-1">{invitation.budget.description}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Permissão: {invitation.permission === 'READ' ? 'Visualização' : 'Edição'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pendente
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                    <button 
                      onClick={() => handleAcceptInvite(invitation.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      ✅ Aceitar
                    </button>
                    <button 
                      onClick={() => handleRejectInvite(invitation.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">📬 Nenhum convite pendente</div>
            <p className="text-sm text-gray-400">Você será notificado quando receber novos convites</p>
          </div>
        )}
      </div>

      {/* Lista de Convites Enviados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Convites Enviados</h2>
        {sentInvitations.length > 0 ? (
          <div className="space-y-4">
            {sentInvitations.map((sentInvitation) => (
              <div key={sentInvitation.id} className="border rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <p className="font-medium text-base text-gray-900">
                        {sentInvitation.sharedWith?.name || 'Usuário desconhecido'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sentInvitation.sharedWith?.email || 'Email não disponível'}
                      </p>
                    </div>
                    
                    {sentInvitation.budget && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-700">Orçamento:</p>
                        <p className="text-sm text-gray-600">{sentInvitation.budget.name}</p>
                        {sentInvitation.budget.description && (
                          <p className="text-xs text-gray-500 mt-1">{sentInvitation.budget.description}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Permissão: {sentInvitation.permission === 'READ' ? 'Visualização' : 'Edição'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sentInvitation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        sentInvitation.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        sentInvitation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Status: {
                          sentInvitation.status === 'PENDING' ? 'Pendente' :
                          sentInvitation.status === 'ACCEPTED' ? 'Aceito' :
                          sentInvitation.status === 'REJECTED' ? 'Rejeitado' :
                          sentInvitation.status
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                    {sentInvitation.status === 'PENDING' && (
                      <button 
                        onClick={() => handleRevokeShare(sentInvitation.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        🗑️ Revogar Convite
                      </button>
                    )}
                    {sentInvitation.status === 'ACCEPTED' && (
                      <button 
                        onClick={() => handleRevokeShare(sentInvitation.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium"
                      >
                        🚫 Remover Acesso
                      </button>
                    )}
                    {sentInvitation.status === 'REJECTED' && (
                      <button 
                        onClick={() => handleRevokeShare(sentInvitation.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        🗑️ Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">📤 Nenhum convite enviado</div>
            <p className="text-sm text-gray-400">Convide outros usuários para compartilhar seus orçamentos</p>
          </div>
        )}
      </div>

      {/* Lista de Compartilhamentos Ativos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Compartilhamentos Ativos</h2>
          
          {activeShares.sharedByMe.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3 text-gray-800">🤝 Compartilhados por mim</h3>
              <div className="space-y-3">
                {activeShares.sharedByMe.map((share) => (
                  <div key={share.id} className="border rounded-lg p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-2">
                          <p className="font-medium text-gray-900">{share.sharedWith?.name || 'Usuário desconhecido'}</p>
                          <p className="text-sm text-gray-600">{share.sharedWith?.email || 'Email não disponível'}</p>
                        </div>
                        {share.budget && (
                          <p className="text-xs text-gray-500">
                            Orçamento: {share.budget.name}
                          </p>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                          {share.permission === 'READ' ? '👁️ Visualização' : '✏️ Edição'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRevokeShare(share.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        🗑️ Revogar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeShares.sharedWithMe.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3 text-gray-800">📥 Compartilhados comigo</h3>
              <div className="space-y-3">
                {activeShares.sharedWithMe.map((share) => (
                  <div key={share.id} className="border rounded-lg p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-2">
                          <p className="font-medium text-gray-900">
                            {share.budget?.owner?.name || 'Proprietário desconhecido'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {share.budget?.owner?.email || 'Email não disponível'}
                          </p>
                        </div>
                        {share.budget && (
                          <div className="mb-2 p-3 bg-blue-50 rounded-lg">
                            <p className="font-medium text-sm text-blue-700">Orçamento:</p>
                            <p className="text-sm text-blue-600">{share.budget.name}</p>
                          </div>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {share.permission === 'READ' ? '👁️ Visualização' : '✏️ Edição'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRevokeShare(share.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        🚪 Sair
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeShares.sharedByMe.length === 0 && activeShares.sharedWithMe.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">🤝 Nenhum compartilhamento ativo</div>
              <p className="text-sm text-gray-400">Envie ou aceite convites para ver compartilhamentos aqui</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default ShareManager;
