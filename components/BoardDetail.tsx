import React, { useState, useMemo, useRef } from 'react';
import { Board, BoardColumn, BoardCard, User, BoardChecklistItem, BoardCardAttachment } from '../types';
import {
 Kanban, List, ArrowLeft, Plus, MoreHorizontal, Calendar as CalendarIcon, User as UserIcon,
 CheckSquare, Trash2, ChevronRight, CheckCircle2, Clock, MoveRight, MoveLeft,
 X, Check, AlertTriangle, AlertCircle, Filter, CalendarDays, AtSign,
 Paperclip, Upload, FileText, Image, Video, Table, File, Loader2, Download, ExternalLink, GripVertical
} from 'lucide-react';

interface BoardDetailProps {
 board: Board;
 columns: BoardColumn[];
 cards: BoardCard[];
 users: { id: string; name: string }[];
 currentUser?: User;
 onBack: () => void;
 onAddColumn: (title: string) => void;
 onUpdateColumn: (column: BoardColumn) => void;
 onDeleteColumn: (id: string) => void;
 // Task 3: Callback para reordenar colunas
 onReorderColumns: (columns: BoardColumn[]) => void;
 onAddCard: (card: BoardCard) => void;
 onUpdateCard: (card: BoardCard) => void;
 onDeleteCard: (id: string) => void;
 onUpdateBoard: (board: Board) => void;
 onDeleteBoard: (id: string) => void;
}

const BoardDetail: React.FC<BoardDetailProps> = ({
 board, columns, cards, users, currentUser, onBack,
 onAddColumn, onUpdateColumn, onDeleteColumn, onReorderColumns,
 onAddCard, onUpdateCard, onDeleteCard,
 onUpdateBoard, onDeleteBoard
}) => {
 const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
 const [filterOverdue, setFilterOverdue] = useState(false);
 
 // Modal States
 const [showColumnModal, setShowColumnModal] = useState(false);
 const [newColumnTitle, setNewColumnTitle] = useState('');
 
 const [showCardModal, setShowCardModal] = useState(false);
 const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
 
 // Card Form State
 const [editingCard, setEditingCard] = useState<BoardCard | null>(null);
 const [cardTitle, setCardTitle] = useState('');
 const [cardDesc, setCardDesc] = useState('');
 const [cardAssignee, setCardAssignee] = useState('');
 const [cardDate, setCardDate] = useState('');
 const [checklist, setChecklist] = useState<BoardChecklistItem[]>([]);
 const [newCheckItem, setNewCheckItem] = useState('');

 // Attachments State
 const [attachments, setAttachments] = useState<BoardCardAttachment[]>([]);
 const [isUploading, setIsUploading] = useState(false);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // DnD State
 const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
 // Task 3: State para drag-and-drop de colunas
 const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

 // Derived State
 const boardColumns = useMemo(() => 
  columns.filter(c => c.boardId === board.id).sort((a, b) => a.order - b.order), 
 [columns, board.id]);

 const isCardOverdue = (card: BoardCard) => {
   const now = new Date();
   now.setHours(0,0,0,0);
   
   // Main due date
   if (card.dueDate && new Date(card.dueDate) < now) return true;
   
   // Checklist items due dates
   if (card.checklist.some(i => !i.isDone && i.dueDate && new Date(i.dueDate) < now)) return true;
   
   return false;
 };

 const boardCards = useMemo(() => {
  let filtered = cards.filter(c => c.boardId === board.id);
  
  // Assuming last column is "Done"
  const lastColId = boardColumns.length > 0 ? boardColumns[boardColumns.length - 1].id : null;

  if (filterOverdue) {
    filtered = filtered.filter(c => {
      return c.columnId !== lastColId && isCardOverdue(c);
    });
  }
  
  return filtered;
 }, [cards, board.id, filterOverdue, boardColumns]);

 // Check personal overdue items for alerts
 const myOverdueCount = useMemo(() => {
   if (!currentUser) return 0;
   const lastColId = boardColumns.length > 0 ? boardColumns[boardColumns.length - 1].id : null;

   return cards.filter(c => 
     c.boardId === board.id &&
     c.columnId !== lastColId &&
     (c.assigneeId === currentUser.id || c.checklist.some(i => i.assigneeId === currentUser.id && !i.isDone)) &&
     isCardOverdue(c)
   ).length;
 }, [cards, currentUser, board.id, boardColumns]);

 // Actions
 const handleCreateColumn = (e: React.FormEvent) => {
  e.preventDefault();
  if (newColumnTitle) {
   onAddColumn(newColumnTitle);
   setNewColumnTitle('');
   setShowColumnModal(false);
  }
 };

 const openCardModal = (columnId?: string, card?: BoardCard) => {
  if (card) {
   setEditingCard(card);
   setActiveColumnId(card.columnId);
   setCardTitle(card.title);
   setCardDesc(card.description || '');
   setCardAssignee(card.assigneeId || '');
   setCardDate(card.dueDate || '');
   setChecklist(card.checklist || []);
   // ✅ SEMPRE garantir array, nunca undefined
   const cardAttachments = Array.isArray(card.attachments) ? card.attachments : [];
   setAttachments(cardAttachments);
   console.log(`📎 [Modal] Abrindo cartão "${card.title}" com ${cardAttachments.length} anexos`, cardAttachments);
  } else {
   setEditingCard(null);
   setActiveColumnId(columnId || boardColumns[0]?.id || '');
   setCardTitle('');
   setCardDesc('');
   setCardAssignee('');
   setCardDate('');
   setChecklist([]);
   setAttachments([]);
   console.log('📎 [Modal] Novo cartão - anexos vazios');
  }
  setUploadError(null);   setUploadSuccess(null);  setShowCardModal(true);
 };

 const handleSaveCard = (e: React.FormEvent) => {
  e.preventDefault();
  if (!cardTitle || !activeColumnId) return;

  // Check for mentions in description
  if (cardDesc.includes('@')) {
    users.forEach(u => {
      // Regex to match @FirstName or @FullName case insensitive
      if (new RegExp(`@${u.name.split(' ')[0]}`, 'i').test(cardDesc)) {
        if (u.id !== currentUser?.id) {
          alert(`[Notificação] ${u.name} foi mencionado neste cartão.`);
        }
      }
    });
  }

  // ✅ GARANTIR que attachments seja sempre array, nunca undefined
  const finalAttachments = Array.isArray(attachments) ? attachments : [];
  
  console.group('💾 [Save] Salvando cartão');
  console.log('Título:', cardTitle);
  console.log('Anexos:', finalAttachments.length, finalAttachments);
  console.log('Checklist:', checklist.length);
  console.groupEnd();

  const cardData = {
   boardId: board.id,
   columnId: activeColumnId,
   title: cardTitle,
   description: cardDesc,
   assigneeId: cardAssignee,
   dueDate: cardDate,
   checklist: checklist,
   attachments: finalAttachments, // ✅ SEMPRE array
   order: editingCard ? editingCard.order : Date.now(),
   createdAt: editingCard ? editingCard.createdAt : Date.now()
  };

  if (editingCard) {
   const isReassigned = editingCard.assigneeId !== cardAssignee;
   onUpdateCard({ ...editingCard, ...cardData });
   
   // Simulate Notification
   if (isReassigned && cardAssignee && currentUser && cardAssignee !== currentUser.id) {
     const assignedUser = users.find(u => u.id === cardAssignee);
     if(assignedUser) alert(`[Simulação] Notificação enviada para ${assignedUser.name}: "Você foi atribuído ao cartão ${cardTitle}"`);
   }
  } else {
   onAddCard({ 
    id: Math.random().toString(36).substr(2, 9), 
    ...cardData 
   } as BoardCard);
   // Simulate Notification
   if (cardAssignee && currentUser && cardAssignee !== currentUser.id) {
     const assignedUser = users.find(u => u.id === cardAssignee);
     if(assignedUser) alert(`[Simulação] Notificação enviada para ${assignedUser.name}: "Novo cartão atribuído: ${cardTitle}"`);
   }
  }
  setShowCardModal(false);
 };

 const onDragStart = (e: React.DragEvent, cardId: string) => {
   setDraggedCardId(cardId);
   e.dataTransfer.effectAllowed = 'move';
   e.dataTransfer.setData('text/plain', cardId);
 };

 const onDragOver = (e: React.DragEvent) => {
   e.preventDefault(); 
   e.dataTransfer.dropEffect = 'move';
 };

 const onDrop = (e: React.DragEvent, targetColumnId: string) => {
   e.preventDefault();
   const cardId = e.dataTransfer.getData('text/plain');
   const card = cards.find(c => c.id === cardId);
   
   if (card && card.columnId !== targetColumnId) {
     onUpdateCard({ ...card, columnId: targetColumnId });
   }
   setDraggedCardId(null);
 };

 // Task 3: Drag-and-drop de colunas
 const onColumnDragStart = (e: React.DragEvent, columnId: string) => {
   setDraggedColumnId(columnId);
   e.dataTransfer.effectAllowed = 'move';
   e.dataTransfer.setData('text/column', columnId);
 };

 const onColumnDragOver = (e: React.DragEvent) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'move';
 };

 const onColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
   e.preventDefault();
   e.stopPropagation(); // Evita conflito com drop de cards
   
   const sourceColumnId = e.dataTransfer.getData('text/column');
   
   if (!sourceColumnId || sourceColumnId === targetColumnId) {
     setDraggedColumnId(null);
     return;
   }
   
   // Encontrar índices
   const sourceIndex = boardColumns.findIndex(col => col.id === sourceColumnId);
   const targetIndex = boardColumns.findIndex(col => col.id === targetColumnId);
   
   if (sourceIndex === -1 || targetIndex === -1) {
     setDraggedColumnId(null);
     return;
   }
   
   // Reordenar array
   const reorderedColumns = [...boardColumns];
   const [movedColumn] = reorderedColumns.splice(sourceIndex, 1);
   reorderedColumns.splice(targetIndex, 0, movedColumn);
   
   // Atualizar campo order de cada coluna
   const updatedColumns = reorderedColumns.map((col, index) => ({
     ...col,
     order: index
   }));
   
   // Persistir nova ordem
   onReorderColumns(updatedColumns);
   setDraggedColumnId(null);
 };

 const addCheckItem = () => {
  if (newCheckItem) {
   setChecklist([...checklist, { id: Date.now().toString(), text: newCheckItem, isDone: false }]);
   setNewCheckItem('');
  }
 };

 const toggleCheckItem = (itemId: string) => {
  setChecklist(checklist.map(i => i.id === itemId ? { ...i, isDone: !i.isDone } : i));
 };

 const removeCheckItem = (itemId: string) => {
  setChecklist(checklist.filter(i => i.id !== itemId));
 };

 const updateCheckItem = (itemId: string, updates: Partial<BoardChecklistItem>) => {
   setChecklist(checklist.map(i => i.id === itemId ? { ...i, ...updates } : i));
 };

 // Attachment Functions
 const getAttachmentIcon = (type: BoardCardAttachment['type']) => {
   switch (type) {
     case 'image': return <Image size={16} className="text-green-600" />;
     case 'video': return <Video size={16} className="text-purple-600" />;
     case 'document': return <FileText size={16} className="text-red-600" />;
     case 'spreadsheet': return <Table size={16} className="text-emerald-600" />;
     default: return <File size={16} className="text-gray-600" />;
   }
 };

 const formatFileSize = (bytes: number): string => {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
 };

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
   console.log('🎯 [Input] handleFileSelect disparado!', e);
   
   const files = e.target.files;
   console.log('📁 Files do input:', files);
   
   if (!files || files.length === 0) {
     console.warn('⚠️ Nenhum arquivo selecionado');
     return;
   }

   setUploadError(null);
   setUploadSuccess(null);
   setIsUploading(true);

   console.group('📤 [Upload] Iniciando upload de arquivos');
   console.log('Arquivos selecionados:', files.length);

   try {
     let successCount = 0;
     
     for (const file of Array.from(files)) {
       console.log(`Processando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type})`);
       
       // Validate file size (max 5MB)
       if (file.size > 5 * 1024 * 1024) {
         const errorMsg = `Arquivo muito grande: ${file.name}. Máximo: 5MB`;
         console.error(`❌ ${errorMsg}`);
         setUploadError(errorMsg);
         continue;
       }

       // Validate file type
       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
       if (!allowedTypes.includes(file.type)) {
         const errorMsg = `Tipo não permitido: ${file.type}. Use JPG, PNG, GIF ou WEBP`;
         console.error(`❌ ${errorMsg}`);
         setUploadError(errorMsg);
         continue;
       }

       // Convert to base64
       const reader = new FileReader();
       const base64Promise = new Promise<string>((resolve, reject) => {
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(file);
       });

       console.log(`🔄 Convertendo para base64...`);
       const base64 = await base64Promise;

       // Create attachment object
       const attachment: BoardCardAttachment = {
         id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         name: file.name,
         type: 'image',
         mimeType: file.type,
         size: file.size,
         url: base64, // ✅ BASE64 em vez de Firebase Storage URL
         uploadedAt: Date.now(),
         uploadedBy: currentUser?.id || 'unknown'
       };

       console.log(`✅ Conversão concluída:`, { id: attachment.id, name: attachment.name, size: file.size });
       
       setAttachments(prev => {
         const updated = [...prev, attachment];
         console.log(`📎 Total de anexos agora: ${updated.length}`);
         return updated;
       });
       
       successCount++;
     }
     
     if (successCount > 0) {
       console.log(`🎉 ${successCount} arquivo(s) anexado(s) com sucesso!`);
       setUploadSuccess(`✅ ${successCount} arquivo(s) anexado(s) com sucesso!`);
       setTimeout(() => setUploadSuccess(null), 3000);
     }
   } catch (error) {
     console.error('❌ Erro no upload:', error);
     setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
   } finally {
     console.groupEnd();
     setIsUploading(false);
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
   }
 };

 const handleDeleteAttachment = async (attachment: BoardCardAttachment) => {
   if (!window.confirm(`Excluir arquivo "${attachment.name}"?`)) return;

   console.log(`🗑️ [Delete] Excluindo anexo: ${attachment.name}`);
   
   // Remover do estado local (não precisa deletar do Firebase Storage pois é base64)
   setAttachments(prev => {
     const updated = prev.filter(a => a.id !== attachment.id);
     console.log(`📎 Anexos restantes: ${updated.length}`);
     return updated;
   });
 };

 const handleDeleteBoard = () => {
   if(window.confirm("Tem certeza que deseja excluir este painel e todos os seus cartões?")) {
     onDeleteBoard(board.id);
     onBack();
   }
 };

 // Calendar View Helpers
 const calendarDays = useMemo(() => {
   if (viewMode !== 'calendar') return [];
   const today = new Date();
   const year = today.getFullYear();
   const month = today.getMonth();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   
   const days = [];
   for (let i = 1; i <= daysInMonth; i++) {
     const d = new Date(year, month, i);
     const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
     
     const dayCards = boardCards.filter(c => c.dueDate === dateStr);
     days.push({ date: d, cards: dayCards });
   }
   return days;
 }, [viewMode, boardCards]);

 return (
  <div className="flex flex-col h-[calc(100vh-80px)] bg-[#fdf8f6] -m-4 md:-m-6">
   
   {/* Alert Banner for Overdue Tasks */}
   {myOverdueCount > 0 && (
     <div className="bg-red-50 text-red-700 px-6 py-2 border-b border-red-100 flex items-center justify-between text-sm animate-in slide-in-from-top">
       <div className="flex items-center gap-2 font-medium">
         <AlertCircle size={16} />
         Você tem {myOverdueCount} tarefas atrasadas neste painel!
       </div>
       <button onClick={() => setFilterOverdue(true)} className="text-xs bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-100">
         Ver Tarefas
       </button>
     </div>
   )}

   {/* Header */}
   <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-4 w-full md:w-auto">
     <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
      <ArrowLeft size={20} />
     </button>
     <div>
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
       {board.title}
       {!board.isPublic && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-normal">Privado</span>}
      </h1>
      <p className="text-xs text-gray-500 truncate max-w-xs">{board.description}</p>
     </div>
    </div>

    <div className="flex items-center gap-3">
     <button 
      onClick={() => setFilterOverdue(!filterOverdue)}
      className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${filterOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
     >
       <Filter size={14} /> Atrasadas
     </button>

     <div className="flex bg-gray-100 p-1 rounded-lg">
      <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-none ${viewMode === 'kanban' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`} title="Kanban"><Kanban size={18} /></button>
      <button onClick={() => setViewMode('list')} className={`p-2 rounded-none ${viewMode === 'list' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`} title="Lista"><List size={18} /></button>
      <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-none ${viewMode === 'calendar' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`} title="Calendário"><CalendarDays size={18} /></button>
     </div>
     
     <div className="h-6 w-px bg-gray-200 mx-2"></div>
     
     <button onClick={() => setShowColumnModal(true)} className="flex items-center gap-2 bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
      <Plus size={16} /> Coluna
     </button>
     <button onClick={handleDeleteBoard} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
       <Trash2 size={18} />
     </button>
    </div>
   </div>

   {/* Main Content */}
   <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
    
    {viewMode === 'kanban' ? (
     <div className="flex h-full gap-6">
      {boardColumns.map(column => {
       const colCards = boardCards.filter(c => c.columnId === column.id).sort((a,b) => a.order - b.order);
       const isDraggingColumn = draggedColumnId === column.id;
       
       return (
        <div 
          key={column.id} 
          className={`w-80 flex-shrink-0 flex flex-col bg-gray-100/50 rounded-none border max-h-full transition-all ${
            isDraggingColumn ? 'opacity-50 border-brand-500' : 'border-gray-200'
          }`}
          onDragOver={(e) => {
            onDragOver(e); // Para cards
            onColumnDragOver(e); // Para colunas
          }}
          onDrop={(e) => {
            // Verificar se é coluna ou card
            const isColumn = e.dataTransfer.types.includes('text/column');
            if (isColumn) {
              onColumnDrop(e, column.id);
            } else {
              onDrop(e, column.id);
            }
          }}
        >
         {/* Column Header - Dragável */}
         <div 
           draggable
           onDragStart={(e) => onColumnDragStart(e, column.id)}
           className="p-3 font-bold text-gray-700 flex justify-between items-center border-b border-gray-200 bg-gray-50 rounded-t-xl cursor-move hover:bg-gray-100 transition-colors"
         >
          <span className="flex items-center gap-2">
            <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
            {column.title}
            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{colCards.length}</span>
          </span>
          <button 
            onClick={() => { if(window.confirm('Excluir coluna e cartões?')) onDeleteColumn(column.id); }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
         </div>

         {/* Cards Area */}
         <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {colCards.map(card => {
            const completedChecks = card.checklist.filter(i => i.isDone).length;
            const totalChecks = card.checklist.length;
            const assignee = users.find(u => u.id === card.assigneeId);
            
            // Check if card itself OR any checklist item is overdue
            const overdue = isCardOverdue(card);
            const isDoneColumn = boardColumns[boardColumns.length-1].id === column.id;

            return (
              <div 
                key={card.id} 
                draggable
                onDragStart={(e) => onDragStart(e, card.id)}
                className={`bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${overdue && !isDoneColumn ? 'border-red-300 bg-red-50/20' : 'border-gray-200'} ${draggedCardId === card.id ? 'opacity-50' : ''}`}
              >
                <div onClick={() => openCardModal(undefined, card)} className="cursor-pointer">
                  <h4 className="font-medium text-gray-800 mb-1">{card.title}</h4>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {card.dueDate && (
                      <div className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border ${overdue && !isDoneColumn ? 'bg-red-100 text-red-700 border-red-200 font-bold' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        <Clock size={10} /> {new Date(card.dueDate).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit'})}
                      </div>
                    )}
                    {totalChecks > 0 && (
                      <div className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border ${completedChecks === totalChecks ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        <CheckSquare size={10} /> {completedChecks}/{totalChecks}
                      </div>
                    )}
                    {card.attachments && card.attachments.length > 0 && (
                      <div className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-100">
                        <Paperclip size={10} /> {card.attachments.length}
                      </div>
                    )}
                  </div>

                  {assignee && (
                    <div className="mt-2 flex justify-end">
                      <div className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1" title={assignee.name}>
                        <UserIcon size={10} /> {assignee.name.split(' ')[0]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
         </div>

         {/* Add Card Button */}
         <div className="p-2 border-t border-gray-200">
          <button 
            onClick={() => openCardModal(column.id)}
            className="w-full py-2 text-sm text-gray-500 hover:bg-white hover:text-brand-600 rounded-lg transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-gray-200 hover:shadow-sm"
          >
            <Plus size={16} /> Adicionar Cartão
          </button>
         </div>
        </div>
       );
      })}
      
      {/* Add Column Button (End of List) */}
      <button 
        onClick={() => setShowColumnModal(true)}
        className="w-80 flex-shrink-0 h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-none text-gray-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
      >
        <Plus size={20} /> Nova Coluna
      </button>
     </div>
    ) : viewMode === 'list' ? (
     /* List View */
     <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden max-w-5xl mx-auto h-full flex flex-col">
       <div className="overflow-y-auto flex-1">
         <table className="w-full text-sm text-left">
           <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10">
             <tr>
               <th className="p-4 border-b border-gray-200">Tarefa</th>
               <th className="p-4 border-b border-gray-200">Status (Coluna)</th>
               <th className="p-4 border-b border-gray-200">Responsável</th>
               <th className="p-4 border-b border-gray-200">Prazo</th>
               <th className="p-4 border-b border-gray-200 text-right">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {boardCards.map(card => {
               const column = boardColumns.find(c => c.id === card.columnId);
               const assignee = users.find(u => u.id === card.assigneeId);
               const totalChecks = card.checklist.length;
               const completedChecks = card.checklist.filter(c => c.isDone).length;
               const overdue = isCardOverdue(card);

               return (
                 <tr key={card.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCardModal(undefined, card)}>
                   <td className="p-4">
                     <div className="font-medium text-gray-900">{card.title}</div>
                     <div className="flex gap-2 mt-1">
                       {totalChecks > 0 && (
                         <span className="text-xs text-gray-400">
                           {completedChecks}/{totalChecks} etapas
                         </span>
                       )}
                       {card.attachments && card.attachments.length > 0 && (
                         <span className="text-xs text-purple-600 flex items-center gap-1">
                           <Paperclip size={10} /> {card.attachments.length} anexo{card.attachments.length > 1 ? 's' : ''}
                         </span>
                       )}
                     </div>
                   </td>
                   <td className="p-4">
                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                       {column?.title || 'Unknown'}
                     </span>
                   </td>
                   <td className="p-4 text-gray-600">
                     {assignee ? assignee.name.split(' ')[0] : '-'}
                   </td>
                   <td className={`p-4 ${overdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                     {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : '-'}
                   </td>
                   <td className="p-4 text-right">
                     <button 
                      onClick={(e) => { e.stopPropagation(); if(window.confirm('Excluir?')) onDeleteCard(card.id); }}
                      className="text-gray-400 hover:text-red-500 p-1"
                     >
                       <Trash2 size={16} />
                     </button>
                   </td>
                 </tr>
               );
             })}
           </tbody>
         </table>
       </div>
     </div>
    ) : (
      /* Calendar View */
      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col max-w-5xl mx-auto">
        <div className="p-4 bg-gray-50 border-b border-gray-200 text-center font-bold text-gray-700">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-gray-200 overflow-y-auto">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
          ))}
          {calendarDays.map((day, idx) => (
            <div key={idx} className="bg-white min-h-[100px] p-2 flex flex-col hover:bg-gray-50">
              <div className={`text-xs font-bold mb-1 ${day.date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-400'}`}>
                {day.date.getDate()}
              </div>
              <div className="flex-1 space-y-1">
                {day.cards.map(c => {
                  const col = boardColumns.find(col => col.id === c.columnId);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => openCardModal(undefined, c)}
                      className="text-[10px] bg-blue-50 border border-blue-100 text-blue-800 p-1 rounded truncate cursor-pointer hover:brightness-95"
                      title={`${c.title} (${col?.title})`}
                    >
                      {c.title}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
   </div>

   {/* New Column Modal */}
   {showColumnModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Coluna</h3>
      <form onSubmit={handleCreateColumn}>
       <input 
        value={newColumnTitle}
        onChange={e => setNewColumnTitle(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-brand-500 focus:outline-none"
        placeholder="Ex: Em Progresso"
        autoFocus
       />
       <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setShowColumnModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">Criar</button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Card Modal */}
   {showCardModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</h3>
        <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
          <input 
           value={cardTitle} onChange={e => setCardTitle(e.target.value)}
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none text-lg font-medium"
           placeholder="Nome da tarefa..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
            <select 
             value={activeColumnId || ''} 
             onChange={e => setActiveColumnId(e.target.value)}
             className="w-full p-2 border border-gray-300 rounded bg-white"
            >
              {boardColumns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prazo</label>
            <input 
             type="date"
             value={cardDate} onChange={e => setCardDate(e.target.value)}
             className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsável</label>
          <select 
           value={cardAssignee} onChange={e => setCardAssignee(e.target.value)}
           className="w-full p-2 border border-gray-300 rounded bg-white"
          >
            <option value="">Sem responsável</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
          <div className="relative">
            <textarea 
             value={cardDesc} onChange={e => setCardDesc(e.target.value)}
             rows={3}
             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
             placeholder="Detalhes... Use @ para mencionar alguém"
            />
            <div className="absolute right-2 bottom-2 text-gray-400">
              <AtSign size={14} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <CheckSquare size={14} /> Checklist / Etapas
          </label>
          
          <div className="space-y-3 mb-3">
            {checklist.map(item => {
              const isItemOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.isDone;
              return (
                <div key={item.id} className="flex flex-col gap-1 p-2 bg-gray-50 rounded border border-gray-100 group">
                  <div className="flex items-center gap-2">
                    <input 
                     type="checkbox" 
                     checked={item.isDone}
                     onChange={() => toggleCheckItem(item.id)}
                     className="w-4 h-4 text-brand-600 rounded cursor-pointer flex-shrink-0"
                    />
                    <span className={`flex-1 text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    <button onClick={() => removeCheckItem(item.id)} className="text-gray-300 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                  
                  {/* Sub-inputs for checklist item */}
                  <div className="flex gap-2 pl-6 items-center">
                    <div className="relative flex-1">
                      <select 
                        value={item.assigneeId || ''} 
                        onChange={(e) => updateCheckItem(item.id, { assigneeId: e.target.value })}
                        className="w-full bg-white border border-gray-200 text-[10px] rounded p-1 pr-4 appearance-none focus:outline-none focus:border-brand-300"
                      >
                        <option value="">Atribuir a...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                      </select>
                      <UserIcon size={10} className="absolute right-1 top-1.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative w-28">
                      <input 
                        type="date"
                        value={item.dueDate || ''}
                        onChange={(e) => updateCheckItem(item.id, { dueDate: e.target.value })}
                        className={`w-full bg-white border text-[10px] rounded p-1 focus:outline-none focus:border-brand-300 ${isItemOverdue ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
             value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
             className="flex-1 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-brand-500"
             placeholder="Adicionar etapa..."
            />
            <button onClick={addCheckItem} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <Paperclip size={14} /> Anexos
            <span className="text-gray-400 font-normal normal-case">(máx. 5MB por arquivo)</span>
          </label>

          {/* Existing Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-3 mb-3">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden group hover:border-gray-300 transition-all"
                >
                  {/* Image Preview - Large and Clickable */}
                  {attachment.type === 'image' && (
                    <div 
                      className="relative w-full aspect-video bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        // Abrir imagem em nova aba
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${attachment.name}</title>
                                <style>
                                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
                                  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                                </style>
                              </head>
                              <body>
                                <img src="${attachment.url}" alt="${attachment.name}" />
                              </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }
                      }}
                      title="Clique para abrir em tela cheia"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-contain"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5">
                          <ExternalLink size={12} />
                          Abrir em nova aba
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Info and Actions */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          // Download base64 as file
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Baixar"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(attachment)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} />
              {uploadError}
            </div>
          )}

          {/* Upload Success */}
          {uploadSuccess && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} />
              {uploadSuccess}
            </div>
          )}

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              console.log('🎯 [Input] onChange disparado!', e.target.files);
              handleFileSelect(e);
            }}
            className="hidden"
            accept="image/*"
            id="file-upload-input"
          />
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ Botão "Adicionar Arquivo" clicado');
              console.log('📎 fileInputRef.current:', fileInputRef.current);
              const input = fileInputRef.current;
              if (input) {
                console.log('✅ Input existe, disparando click...');
                input.click();
              } else {
                console.error('❌ Input não existe!');
              }
            }}
            disabled={isUploading}
            className="w-full py-2.5 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Adicionar Arquivo
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-xl">
        {editingCard ? (
          <button 
           onClick={() => { if(window.confirm('Excluir?')) { onDeleteCard(editingCard.id); setShowCardModal(false); } }}
           className="text-red-500 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={16} /> Excluir
          </button>
        ) : <div></div>}
        <div className="flex gap-2">
          <button onClick={() => setShowCardModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium">Cancelar</button>
          <button onClick={handleSaveCard} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded text-sm font-medium shadow-sm">Salvar</button>
        </div>
      </div>
     </div>
    </div>
   )}

  </div>
 );
};

export default BoardDetail;