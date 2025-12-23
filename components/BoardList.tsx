import React, { useState } from 'react';
import { Board, User, UserWithPassword } from '../types';
import { Kanban, Plus, Globe, Lock, Users as UsersIcon, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { generateId } from '../utils';

interface BoardListProps {
 boards: Board[];
 currentUser: User;
 users?: UserWithPassword[]; // Need full user list for permissions
 onSelectBoard: (board: Board) => void;
 onCreateBoard: (board: Board) => void;
}

interface BoardCardProps {
 board: Board;
 currentUser: User;
 onClick: (b: Board) => void;
 onClone: (b: Board) => void;
 onDelete: (id: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ 
 board, 
 currentUser, 
 onClick, 
 onClone, 
 onDelete 
}) => {
 const isOwner = board.ownerId === currentUser.id;

 return (
  <div
   onClick={() => onClick(board)}
   className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group flex flex-col h-40 relative"
  >
   <div className="flex justify-between items-start mb-2">
    <h3 className="font-bold text-gray-800 group-hover:text-brand-700 truncate pr-2">{board.title}</h3>
    {board.isPublic ? <Globe size={14} className="text-gray-400 flex-shrink-0" /> : <Lock size={14} className="text-gray-400 flex-shrink-0" />}
   </div>
   <p className="text-sm text-gray-500 line-clamp-2 flex-1">{board.description || 'Sem descrição.'}</p>
   
   <div className="mt-auto pt-3 flex justify-between items-center text-xs text-gray-400 border-t border-gray-50">
     <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
     
     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
       onClick={(e) => { e.stopPropagation(); onClone(board); }}
       className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
       title="Clonar Painel"
      >
       <Copy size={14} />
      </button>
      {isOwner && (
       <button 
        onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
        title="Excluir Painel"
       >
        <Trash2 size={14} />
       </button>
      )}
      <ChevronRight size={14} className="ml-1 text-brand-500" />
     </div>
   </div>
  </div>
 );
};

const BoardList: React.FC<BoardListProps> = ({ boards, currentUser, users = [], onSelectBoard, onCreateBoard }) => {
 const [showModal, setShowModal] = useState(false);
 const [newTitle, setNewTitle] = useState('');
 const [newDesc, setNewDesc] = useState('');
 const [isPublic, setIsPublic] = useState(true);
 const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

 // Filter boards
 const myBoards = boards.filter(b => b.ownerId === currentUser.id);
 
 // Shared boards: Public OR explicitly allowed
 const sharedBoards = boards.filter(b => {
  if (b.ownerId === currentUser.id) return false;
  if (b.isPublic) return false; // Handled in Public section
  return b.allowedUsers?.includes(currentUser.id) || b.sharedWith?.includes(currentUser.id);
 });

 const publicBoards = boards.filter(b => b.isPublic && b.ownerId !== currentUser.id);

 const handleCreate = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newTitle) return;

  const board: Board = {
   id: generateId(),
   title: newTitle,
   description: newDesc,
   ownerId: currentUser.id,
   sharedWith: [],
   allowedUsers: isPublic ? [] : selectedUsers,
   isPublic: isPublic,
   createdAt: Date.now(),
   updatedAt: Date.now()
  };

  onCreateBoard(board);
  resetForm();
 };

 const resetForm = () => {
  setShowModal(false);
  setNewTitle('');
  setNewDesc('');
  setIsPublic(true);
  setSelectedUsers([]);
 };

 const handleClone = async (board: Board) => {
  if (!confirm(`Clonar o painel "${board.title}"?`)) return;

  const newBoardId = generateId();
  const newBoard: Board = {
   ...board,
   id: newBoardId,
   title: `Cópia de ${board.title}`,
   ownerId: currentUser.id,
   createdAt: Date.now(),
   updatedAt: Date.now(),
   // Reset permissions on clone
   isPublic: false,
   allowedUsers: []
  };

  await storageService.boards.add(newBoard);
  alert('Painel clonado com sucesso! (Nota: Colunas e cartões não são copiados nesta versão)');
 };

 const handleDelete = async (boardId: string) => {
  if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
  await storageService.boards.delete(boardId);
 };

 const toggleUserSelection = (userId: string) => {
  setSelectedUsers(prev => 
   prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
  );
 };

 return (
  <div className="space-y-8 animate-fade-in p-2 pb-20">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-3">
     <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
      <Kanban size={24} />
     </div>
     <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Painéis de Processos</h2>
      <p className="text-gray-500 text-sm">Gerencie fluxos, projetos e tarefas.</p>
     </div>
    </div>
    <button 
     onClick={() => setShowModal(true)}
     className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
    >
     <Plus size={18} /> Novo Painel
    </button>
   </div>

   <div className="space-y-6">
    {/* My Boards */}
    <section>
     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <UserIconComponent /> Meus Painéis ({myBoards.length})
     </h3>
     {myBoards.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {myBoards.map(b => (
        <BoardCard 
         key={b.id} 
         board={b} 
         currentUser={currentUser}
         onClick={onSelectBoard} 
         onClone={handleClone} 
         onDelete={handleDelete}
        />
       ))}
      </div>
     ) : (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
       Você ainda não criou nenhum painel.
      </div>
     )}
    </section>

    {/* Shared Boards */}
    {sharedBoards.length > 0 && (
     <section>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
       <UsersIcon size={16} /> Compartilhados Comigo
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {sharedBoards.map(b => (
        <BoardCard 
         key={b.id} 
         board={b} 
         currentUser={currentUser}
         onClick={onSelectBoard} 
         onClone={handleClone}
         onDelete={handleDelete}
        />
       ))}
      </div>
     </section>
    )}

    {/* Public Boards */}
    <section>
     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <Globe size={16} /> Painéis Públicos da Equipe
     </h3>
     {publicBoards.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {publicBoards.map(b => (
        <BoardCard 
         key={b.id} 
         board={b} 
         currentUser={currentUser}
         onClick={onSelectBoard} 
         onClone={handleClone}
         onDelete={handleDelete}
        />
       ))}
      </div>
     ) : (
      <div className="p-4 text-sm text-gray-400 italic">Nenhum painel público disponível.</div>
     )}
    </section>
   </div>

   {/* Create Modal */}
   {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Painel</h3>
      <form onSubmit={handleCreate} className="space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Painel</label>
        <input 
         type="text" 
         value={newTitle}
         onChange={e => setNewTitle(e.target.value)}
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
         placeholder="Ex: Make Ready - Verão 2025"
         autoFocus
         required
        />
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea 
         value={newDesc}
         onChange={e => setNewDesc(e.target.value)}
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
         placeholder="Objetivo deste fluxo..."
         rows={2}
        />
       </div>
       <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <input 
          type="checkbox" 
          id="isPublic"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <label htmlFor="isPublic" className="text-sm font-bold text-gray-700 cursor-pointer">
          Público para toda a equipe?
          </label>
        </div>
        {!isPublic && (
          <div className="mt-3 animate-fade-in">
            <label className="block text-xs font-medium text-gray-500 mb-2">Selecione quem pode acessar:</label>
            <div className="h-40 overflow-y-auto space-y-1 border border-gray-200 rounded bg-white p-2">
              {users.length > 0 ? (
                users.filter(u => u.id !== currentUser.id).map(u => (
                  <label key={u.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUserSelection(u.id)}
                      className="rounded text-brand-600"
                    />
                    {u.name}
                  </label>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic text-center p-2">Nenhum outro usuário encontrado.</p>
              )}
            </div>
          </div>
        )}
       </div>
       <div className="flex justify-end gap-2 pt-2">
        <button 
         type="button" 
         onClick={resetForm}
         className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
         Cancelar
        </button>
        <button 
         type="submit" 
         className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 shadow-sm"
        >
         Criar Painel
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
};

// Helper component
const UserIconComponent = () => (
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default BoardList;