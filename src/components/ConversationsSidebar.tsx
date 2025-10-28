/**
 * ConversationsSidebar - Sidebar para gestionar conversaciones del chat
 *
 * Características:
 * - Lista de todas las conversaciones
 * - Crear nueva conversación
 * - Cambiar entre conversaciones
 * - Eliminar conversaciones
 * - Renombrar conversaciones
 * - Preview del último mensaje
 */

import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationMetadata } from '@/types/conversation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConversationsSidebarProps {
  conversations: ConversationMetadata[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  className?: string;
}

const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  className = ''
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteConversation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Botón Nueva Conversación */}
      <div className="p-4 border-b border-niawi-border">
        <Button
          onClick={onNewConversation}
          size="sm"
          className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conversación
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
        </p>
      </div>

      {/* Lista de conversaciones */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay conversaciones.
              <br />
              Crea una nueva para comenzar.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg border transition-all duration-200 ${
                  conv.id === currentConversationId
                    ? 'bg-niawi-primary/10 border-niawi-primary'
                    : 'bg-niawi-surface border-niawi-border hover:bg-niawi-border/50 hover:border-niawi-primary/30'
                }`}
              >
                {editingId === conv.id ? (
                  // Modo edición
                  <div className="p-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-niawi-bg border border-niawi-border rounded focus:outline-none focus:border-niawi-primary"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 hover:bg-niawi-primary/20 rounded text-niawi-primary"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-niawi-danger/20 rounded text-niawi-danger"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // Modo normal
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">
                        {conv.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(conv.updatedAt)}
                      </span>
                    </div>

                    {conv.preview && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                        {conv.preview}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {conv.messageCount} {conv.messageCount === 1 ? 'mensaje' : 'mensajes'}
                      </span>

                      {/* Botones de acción (visible en hover) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(conv.id, conv.title);
                          }}
                          className="p-1 hover:bg-niawi-primary/20 rounded text-niawi-primary"
                          title="Renombrar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conv.id);
                          }}
                          className="p-1 hover:bg-niawi-danger/20 rounded text-niawi-danger"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta conversación y
              todos sus mensajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-niawi-danger hover:bg-niawi-danger/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default React.memo(ConversationsSidebar);
