import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, AlertCircle, RotateCcw, Zap, Brain, Mic, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AgentSelector from '@/components/AgentSelector';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAgent } from '@/hooks/useAgent';
import type { Message, ApiResponse, Attachment } from '@/types/agents';
import { AGENT_SUGGESTIONS } from '@/constants/agents';
import { toast } from '@/hooks/use-toast';

const CONVERSATIONS_STORAGE_KEY = 'niawi-agent-conversations';

interface AgentConversations {
  [agentId: string]: Message[];
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartRef = useRef<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const { selectedAgent, getAgentEndpoint, currentUser } = useAgent();

  // Función para cargar conversaciones desde localStorage
  const loadConversations = useCallback((): AgentConversations => {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (!stored) return {};
      
      const conversations = JSON.parse(stored);
      
      // Validar y limpiar datos corrupto
      const cleanConversations: AgentConversations = {};
      Object.keys(conversations).forEach(agentId => {
        const messages = conversations[agentId];
        if (Array.isArray(messages)) {
          cleanConversations[agentId] = messages.filter(msg => 
            msg && typeof msg === 'object' && msg.timestamp
          );
        }
      });
      
      return cleanConversations;
    } catch (error) {
      console.error('Error loading conversations, clearing corrupted data:', error);
      localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
      return {};
    }
  }, []);

  // Función para guardar conversaciones en localStorage
  const saveConversations = useCallback((conversations: AgentConversations) => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, []);

  // Función para guardar la conversación actual del agente
  const saveCurrentConversation = useCallback((agentId: string, messages: Message[]) => {
    const conversations = loadConversations();
    // Sanitizar mensajes para no almacenar binarios en localStorage
    const sanitized = messages.map(msg => ({
      ...msg,
      attachments: msg.attachments?.map(att => {
        const { data, url, ...rest } = att;
        // Evitar persistir base64 o data URLs; solo metadatos
        return { ...rest } as Attachment;
      })
    }));
    conversations[agentId] = sanitized;
    saveConversations(conversations);
  }, [loadConversations, saveConversations]);

  // Función para cargar la conversación de un agente específico
  const loadAgentConversation = useCallback((agentId: string): Message[] => {
    const conversations = loadConversations();
    const messages = conversations[agentId] || [];
    
    // Convertir timestamps de string a Date cuando se cargan desde localStorage
    return messages.map(msg => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
    }));
  }, [loadConversations]);

  // Validación de selectedAgent
  if (!selectedAgent) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex items-center justify-center">
        <Card className="bg-niawi-surface border-niawi-border p-6">
          <p className="text-center text-muted-foreground">Cargando agente...</p>
        </Card>
      </div>
    );
  }

  // Sugerencias dinámicas según el agente seleccionado - optimizado con useCallback
  const getAgentSuggestions = useCallback((agentId: string): readonly string[] => {
    return AGENT_SUGGESTIONS[agentId] || AGENT_SUGGESTIONS.operations;
  }, []);

  // Inicializar conversación cuando cambia el agente
  useEffect(() => {
    if (!selectedAgent) return;
    
    // Cargar conversación existente para este agente
    const existingConversation = loadAgentConversation(selectedAgent.id);
    
    if (existingConversation.length > 0) {
      // Si hay conversación existente, cargarla
      setMessages(existingConversation);
    } else {
      // Si no hay conversación, crear mensaje de bienvenida
      const welcomeMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: `¡Hola${currentUser ? `, ${currentUser.name}` : ''}! Soy tu ${selectedAgent.name}. Estoy especializado en ${selectedAgent.description.toLowerCase()}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
        agentId: selectedAgent.id
      };
      
      setMessages([welcomeMessage]);
    }
  }, [selectedAgent?.id, currentUser?.name, selectedAgent?.name, selectedAgent?.description, loadAgentConversation]);

  // Guardar conversación automáticamente cuando cambien los mensajes
  useEffect(() => {
    if (selectedAgent && messages.length > 0) {
      saveCurrentConversation(selectedAgent.id, messages);
    }
  }, [messages, selectedAgent?.id, saveCurrentConversation]);

  // Determinar si estamos en una conversación activa
  const isActiveConversation = messages.length > 1;

  // Función para manejar el cambio del textarea con auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Función para manejar Enter/Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para renderizar el contenido del mensaje con Markdown completo
  const renderMessageContent = (content: string) => {
    return <MarkdownRenderer>{content}</MarkdownRenderer>;
  };

  // Renderizar adjuntos básicos dentro del mensaje
  const renderAttachments = (atts?: Attachment[]) => {
    if (!atts || atts.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        {atts.map((att) => {
          const key = att.id;
          const hasInlineData = !!att.data;
          const dataUrl = hasInlineData ? `data:${att.mimeType};base64,${att.data}` : undefined;
          if (att.kind === 'image') {
            return (
              <div key={key} className="rounded-lg overflow-hidden border border-niawi-border/40 bg-niawi-border/10">
                {hasInlineData ? (
                  <img src={dataUrl} alt={att.name} className="max-w-full h-auto block" />
                ) : (
                  <div className="p-2 text-xs text-muted-foreground">{att.name}</div>
                )}
              </div>
            );
          }
          if (att.kind === 'audio') {
            return (
              <div
                key={key}
                className="p-2 rounded-lg border border-niawi-border/40 bg-white text-foreground shadow w-[260px] sm:w-[360px]"
              >
                {hasInlineData ? (
                  <audio controls className="w-full">
                    <source src={dataUrl} type={att.mimeType} />
                    Tu navegador no soporta la reproducción de audio.
                  </audio>
                ) : (
                  <div className="text-xs text-muted-foreground">{att.name}</div>
                )}
                {att.durationMs ? (
                  <div className="text-[10px] opacity-70 mt-1">{Math.round(att.durationMs / 1000)}s</div>
                ) : null}
                {hasInlineData && (
                  <div className="mt-1">
                    <a
                      href={dataUrl}
                      download={att.name}
                      className="text-[10px] underline opacity-80 hover:opacity-100"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Descargar
                    </a>
                  </div>
                )}
              </div>
            );
          }
          // document/other
          return (
            <div key={key} className="p-2 rounded-lg border border-niawi-border/40 bg-niawi-border/10 text-xs">
              {att.name} • {Math.round(att.size / 1024)} KB
            </div>
          );
        })}
      </div>
    );
  };

  const sendMessageToAPI = async (userMessage: string, atts: Attachment[]): Promise<string> => {
    if (!selectedAgent) {
      throw new Error('No hay agente seleccionado');
    }

    try {
      // Usar el endpoint dinámico del agente seleccionado
      const apiUrl = getAgentEndpoint(selectedAgent.id);
      
      if (!apiUrl) {
        throw new Error('Endpoint del agente no configurado');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: userMessage,
          agente: selectedAgent.id,
          contexto: selectedAgent.department,
          usuario: currentUser?.id,
          attachments: atts.map(a => ({
            id: a.id,
            name: a.name,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
            encoding: a.encoding,
            data: a.encoding === 'base64' ? a.data : undefined,
            url: a.encoding === 'url' ? a.url : undefined,
            width: a.width,
            height: a.height,
            durationMs: a.durationMs
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Manejar tanto formato de array como objeto directo
      let data: ApiResponse;
      if (Array.isArray(responseData)) {
        // Si es un array, tomar el primer elemento
        data = responseData[0];
      } else {
        // Si es un objeto directo
        data = responseData;
      }
      
      if (data && data.output) {
        return data.output;
      } else {
        console.error('Formato de respuesta recibido:', responseData);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al comunicarse con el agente:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim().length === 0 && attachments.length === 0) || isLoading || !selectedAgent) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    const userMessageObj: Message = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    const loadingMessageObj: Message = {
      id: Date.now() + 1,
      type: 'assistant',
      content: `${selectedAgent.name} está analizando tu consulta...`,
      timestamp: new Date(),
      isLoading: true,
      agentId: selectedAgent.id
    };

    setMessages(prev => [...prev, userMessageObj, loadingMessageObj]);

    try {
      const aiResponse = await sendMessageToAPI(userMessage, attachments);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageObj.id 
          ? {
              ...msg,
              content: aiResponse,
              isLoading: false
            }
          : msg
      ));

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al procesar tu mensaje';

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageObj.id 
          ? {
              ...msg,
              content: `Lo siento, hubo un problema al procesar tu mensaje: ${errorMessage}. Por favor, inténtalo nuevamente.`,
              isLoading: false,
              hasError: true
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setAttachments([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      setMessage(suggestion);
    }
  };

  const handleNewConversation = () => {
    if (!selectedAgent) return;
    
    const welcomeMessage: Message = {
      id: Date.now(),
      type: 'assistant',
      content: `¡Hola${currentUser ? `, ${currentUser.name}` : ''}! Soy tu ${selectedAgent.name}. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      agentId: selectedAgent.id
    };
    
    setMessages([welcomeMessage]);
    
    // Guardar la nueva conversación (sobrescribir la anterior)
    saveCurrentConversation(selectedAgent.id, [welcomeMessage]);
  };

  const suggestions = selectedAgent ? getAgentSuggestions(selectedAgent.id) : [];

  // Configuración de adjuntos (MVP)
  const MAX_FILE_MB = 5; // tamaño por archivo
  const MAX_TOTAL_MB = 15; // total por mensaje
  const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4'
  ];

  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const determineKind = (mime: string): Attachment['kind'] => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'document';
    return 'other';
  };

  // Selección del mejor MIME para grabación de audio
  const pickBestAudioMime = (): { mimeType: string | null; extension: string } => {
    const candidates: Array<{ mime: string; ext: string }> = [
      { mime: 'audio/webm;codecs=opus', ext: '.webm' },
      { mime: 'audio/webm', ext: '.webm' },
      { mime: 'audio/ogg;codecs=opus', ext: '.ogg' },
      { mime: 'audio/mp4', ext: '.m4a' },
    ];
    for (const c of candidates) {
      // @ts-expect-error: isTypeSupported existe en runtime
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c.mime)) {
        return { mimeType: c.mime, extension: c.ext };
      }
    }
    return { mimeType: null, extension: '.webm' };
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validaciones
    for (const f of fileArray) {
      if (!ALLOWED_MIME.includes(f.type)) {
        toast({
          title: 'Archivo no permitido',
          description: `${f.name}: tipo ${f.type || 'desconocido'} no permitido`,
          variant: 'destructive'
        });
        return;
      }
      if (bytesToMB(f.size) > MAX_FILE_MB) {
        toast({
          title: 'Archivo demasiado grande',
          description: `${f.name} excede ${MAX_FILE_MB} MB`,
          variant: 'destructive'
        });
        return;
      }
    }

    const currentTotal = attachments.reduce((sum, a) => sum + a.size, 0);
    const newTotal = currentTotal + fileArray.reduce((s, f) => s + f.size, 0);
    if (bytesToMB(newTotal) > MAX_TOTAL_MB) {
      toast({
        title: 'Límite total excedido',
        description: `El total de adjuntos por mensaje no puede superar ${MAX_TOTAL_MB} MB`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const newAttachments: Attachment[] = [];
      for (const f of fileArray) {
        const base64 = await readFileAsBase64(f);
        const kind = determineKind(f.type);
        const att: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          mimeType: f.type,
          size: f.size,
          kind,
          encoding: 'base64',
          data: base64
        };
        newAttachments.push(att);
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      toast({ title: 'Adjuntos agregados', description: `${newAttachments.length} archivo(s) listo(s) para enviar` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al leer archivos', description: 'Intenta nuevamente', variant: 'destructive' });
    }
  };

  const handlePaperclipClick = () => fileInputRef.current?.click();

  // Convertir items pegados/arrastrados en adjuntos
  const handleFilesAsAttachments = async (files: File[]) => {
    if (files.length === 0) return false;

    // Validaciones por archivo
    for (const f of files) {
      if (!ALLOWED_MIME.includes(f.type)) {
        toast({ title: 'Archivo no permitido', description: `${f.name || f.type}`, variant: 'destructive' });
        return true;
      }
      if (bytesToMB(f.size) > MAX_FILE_MB) {
        toast({ title: 'Archivo demasiado grande', description: `${f.name} excede ${MAX_FILE_MB} MB`, variant: 'destructive' });
        return true;
      }
    }

    const currentTotal = attachments.reduce((sum, a) => sum + a.size, 0);
    const newTotal = currentTotal + files.reduce((s, f) => s + f.size, 0);
    if (bytesToMB(newTotal) > MAX_TOTAL_MB) {
      toast({ title: 'Límite total excedido', description: `Máximo ${MAX_TOTAL_MB} MB por mensaje`, variant: 'destructive' });
      return true;
    }

    const newAttachments: Attachment[] = [];
    for (const f of files) {
      const base64 = await readFileAsBase64(f);
      const kind = determineKind(f.type);
      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name || `archivo-${new Date().toISOString()}`,
        mimeType: f.type,
        size: f.size,
        kind,
        encoding: 'base64',
        data: base64,
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    toast({ title: 'Adjuntos agregados', description: `${newAttachments.length} archivo(s)` });
    return true;
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const cd = e.clipboardData;
    const filesFromList = Array.from(cd.files || []);
    if (filesFromList.length > 0) {
      e.preventDefault();
      await handleFilesAsAttachments(filesFromList);
      return;
    }
    // Algunos recortes llegan como items
    const items = Array.from(cd.items || []);
    const filesFromItems: File[] = [];
    for (const it of items) {
      if (it.kind === 'file') {
        const file = it.getAsFile();
        if (file) filesFromItems.push(file);
      }
    }
    if (filesFromItems.length > 0) {
      e.preventDefault();
      await handleFilesAsAttachments(filesFromItems);
      return;
    }
    // Intentar data URL en texto (menos común)
    const text = cd.getData('text');
    if (text && text.startsWith('data:') && text.includes('base64,')) {
      e.preventDefault();
      try {
        const mime = text.substring(5, text.indexOf(';'));
        if (!ALLOWED_MIME.includes(mime)) {
          toast({ title: 'Tipo no permitido', description: mime, variant: 'destructive' });
          return;
        }
        const base64 = text.slice(text.indexOf(',') + 1);
        // Estimar tamaño desde base64
        const sizeApprox = Math.floor((base64.length * 3) / 4);
        if (bytesToMB(sizeApprox) > MAX_FILE_MB) {
          toast({ title: 'Imagen demasiado grande', description: `Excede ${MAX_FILE_MB} MB`, variant: 'destructive' });
          return;
        }
        const att: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: `imagen-${new Date().toISOString()}.${mime.split('/')[1] || 'png'}`,
          mimeType: mime,
          size: sizeApprox,
          kind: determineKind(mime),
          encoding: 'base64',
          data: base64,
        };
        setAttachments(prev => [...prev, att]);
        toast({ title: 'Imagen pegada', description: 'Adjunta y lista para enviar' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    await handleFilesAsAttachments(files);
  };

  // Grabación de nota de voz (MVP)
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const best = pickBestAudioMime();
      const options = best.mimeType ? { mimeType: best.mimeType } : undefined as any;
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: best.mimeType || 'audio/webm' });
          // Validar tamaño
          if (bytesToMB(blob.size) > MAX_FILE_MB) {
            toast({ title: 'Nota de voz muy larga', description: `Excede ${MAX_FILE_MB} MB`, variant: 'destructive' });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.slice(result.indexOf(',') + 1);
            const durationMs = recordingStartRef.current ? Date.now() - recordingStartRef.current : undefined;
            const audioAttachment: Attachment = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: `nota-voz-${new Date().toISOString()}${best.extension}`,
              mimeType: best.mimeType || 'audio/webm',
              size: blob.size,
              kind: 'audio',
              encoding: 'base64',
              data: base64,
              durationMs
            };
            setAttachments(prev => [...prev, audioAttachment]);
            toast({ title: 'Nota de voz lista', description: 'Se agregó a los adjuntos' });
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error(e);
          toast({ title: 'Error al procesar audio', variant: 'destructive' });
        } finally {
          setIsRecording(false);
          recordingStartRef.current = null;
          // Detener tracks del micrófono
          stream.getTracks().forEach(t => t.stop());
        }
      };
      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'No se pudo iniciar la grabación', description: 'Verifica permisos del micrófono', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  return (
    <div className="page-container">
      {/* Header con selector de agente */}
      <div className="flex-shrink-0 p-4 pb-0 sm:p-6">
        <AgentSelector />
      </div>

      {/* Chat Container */}
      <div className="flex-1 p-4 pt-4 sm:p-6 sm:pt-6 overflow-hidden">
        <Card className="h-full bg-niawi-surface border-niawi-border flex flex-col overflow-hidden shadow-xl">
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-niawi-surface scrollbar-thumb-niawi-border chat-messages"
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleDrop}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 animate-fade-in ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.type === 'assistant' && selectedAgent && (
                    <Avatar className={`w-8 h-8 ${selectedAgent.bgColor} flex-shrink-0 mt-1`}>
                      <AvatarFallback className={`${selectedAgent.color} ${selectedAgent.bgColor} border-0`}>
                        {msg.isLoading ? (
                          <Brain className="w-4 h-4 animate-pulse" />
                        ) : (
                          <selectedAgent.icon className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-lg ${
                      msg.type === 'user'
                        ? 'bg-niawi-primary text-white ml-auto shadow-lg shadow-niawi-primary/20'
                        : `bg-niawi-border/30 text-foreground shadow-sm ${
                            msg.hasError ? 'border border-niawi-danger/50' : ''
                          }`
                    }`}
                  >
                    {msg.hasError && (
                      <div className="flex items-center gap-2 mb-2 text-niawi-danger">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Error</span>
                      </div>
                    )}
                    
                    <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
                      {renderMessageContent(msg.content)}
                    </div>
                    {renderAttachments(msg.attachments)}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <span>
                        {msg.timestamp instanceof Date 
                          ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                      </span>
                      {msg.agentId && selectedAgent && (
                        <>
                          <span>•</span>
                          <span>{selectedAgent.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Botón Nueva Conversación - Solo si hay conversación activa */}
            {isActiveConversation && (
              <div className="px-6 pb-2 flex-shrink-0">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    className="border-niawi-border hover:bg-niawi-border/50"
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nueva conversación
                  </Button>
                </div>
              </div>
            )}

            {/* Suggestions - Solo si no hay conversación activa y en pantallas grandes */}
            {!isActiveConversation && selectedAgent && (
              <div className="hidden md:block px-6 pb-4 flex-shrink-0">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-niawi-accent" />
                  <span>Sugerencias para {selectedAgent.department}</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left h-auto p-4 border-niawi-border bg-niawi-border/20 hover:bg-niawi-border/40 hover:scale-[1.02] text-sm justify-start transition-all duration-200 shadow-sm hover:shadow-lg"
                      disabled={isLoading}
                    >
                      <Zap className="w-4 h-4 mr-3 text-niawi-accent flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-niawi-border p-4 pb-6 flex-shrink-0">
              {selectedAgent && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${selectedAgent.bgColor} ${selectedAgent.color} border-0 text-xs`}>
                    {selectedAgent.department}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Conectado a {selectedAgent.name}
                  </span>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={selectedAgent ? `Pregunta a tu ${selectedAgent.name}...` : 'Selecciona un agente primero...'}
                    className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-niawi-bg border-niawi-border focus:border-niawi-primary transition-all duration-200"
                    disabled={isLoading || !selectedAgent}
                    rows={1}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2 w-8 h-8 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                    onClick={handlePaperclipClick}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={ALLOWED_MIME.join(',')}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  {/* Indicador de shortcuts */}
                  <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground opacity-75">
                    <kbd className="px-1 py-0.5 bg-niawi-border/30 rounded text-xs">Enter</kbd> enviar • <kbd className="px-1 py-0.5 bg-niawi-border/30 rounded text-xs">Shift+Enter</kbd> nueva línea
                  </div>
                </div>
                
                {/* Botón grabar nota de voz */}
                <Button
                  type="button"
                  size="sm"
                  variant={isRecording ? 'destructive' : 'outline'}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!selectedAgent || isLoading}
                  className="h-[44px] px-3"
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={(message.trim().length === 0 && attachments.length === 0) || isLoading || !selectedAgent}
                  className="bg-niawi-primary hover:bg-niawi-primary/90 text-white h-[44px] px-4"
                >
                  {isLoading ? (
                    <Brain className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>

              {/* Lista de adjuntos pendientes antes de enviar */}
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 px-2 py-1 rounded-full border border-niawi-border/60 bg-niawi-border/20 text-xs">
                      <span className="max-w-[160px] truncate">{att.name}</span>
                      <button
                        type="button"
                        className="opacity-70 hover:opacity-100"
                        onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                        aria-label="Quitar adjunto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
