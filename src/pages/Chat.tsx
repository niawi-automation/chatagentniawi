import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, AlertCircle, Brain, Mic, Square, X, Menu, RotateCcw, Edit2, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import DynamicGreeting from '@/components/DynamicGreeting';
import SuggestedQuestions from '@/components/SuggestedQuestions';
import LoadingInsights from '@/components/LoadingInsights';
import ConversationsSidebar from '@/components/ConversationsSidebar';
import { useAgent } from '@/hooks/useAgent';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useConversations } from '@/hooks/useConversations';
import type { Message, ApiResponse, Attachment } from '@/types/agents';
import { toast } from '@/hooks/use-toast';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Por defecto cerrado
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartRef = useRef<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const { selectedAgent, getAgentEndpoint, currentUser } = useAgent();
  const { integrations } = useIntegrations(currentUser?.id);

  // Sistema de conversaciones
  const {
    currentConversationId,
    createNewConversation,
    deleteConversation,
    switchConversation,
    updateConversationMessages,
    renameConversation,
    getCurrentConversation,
    getConversationsMetadata
  } = useConversations(currentUser?.id || 'anonymous');

  // Mensajes de la conversación actual
  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

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

  // Determinar si estamos en una conversación activa
  const isActiveConversation = messages.length > 0;

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
      // Usar variable de entorno VITE_CHAT_API_URL o fallback al endpoint del agente
      const apiUrl = import.meta.env.VITE_CHAT_API_URL || getAgentEndpoint(selectedAgent.id);

      if (!apiUrl) {
        throw new Error('Endpoint del chat no configurado. Configura VITE_CHAT_API_URL en variables de entorno.');
      }

      console.log('📡 Enviando mensaje a:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: userMessage,
          usuario: currentUser?.id || 'anonymous',
          conversationId: currentConversationId, // ID único de la conversación
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

      // Leer el texto completo de la respuesta
      const responseText = await response.text();
      console.log('📥 Respuesta recibida (COMPLETA):', responseText);
      console.log('📏 Longitud de respuesta:', responseText.length);

      // Procesar la respuesta que puede venir en diferentes formatos:
      // 1. JSON único: [{"output": "..."}] o {"output": "..."}
      // 2. Streaming NDJSON: múltiples líneas de JSON
      // 3. Streaming concatenado: múltiples objetos JSON sin separador

      const outputs: string[] = [];

      // Intentar procesar como NDJSON (newline-delimited JSON)
      const lines = responseText.trim().split('\n').filter(line => line.trim());
      console.log('📋 Número de líneas detectadas:', lines.length);

      if (lines.length > 1) {
        // Múltiples líneas - procesar cada una
        console.log(`📋 Detectado formato NDJSON con ${lines.length} líneas`);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          console.log(`📄 Línea ${i + 1}:`, line);
          try {
            const chunk = JSON.parse(line);
            console.log(`✅ Línea ${i + 1} parseada:`, chunk);
            const extractedOutput = extractOutputFromChunk(chunk);
            console.log(`📤 Output extraído de línea ${i + 1}:`, extractedOutput);
            if (extractedOutput) outputs.push(extractedOutput);
          } catch (lineError) {
            console.warn(`⚠️ No se pudo parsear línea ${i + 1}:`, line, lineError);
          }
        }
      } else {
        // Una sola línea - intentar parsear como JSON normal
        console.log('📄 Una sola línea detectada, intentando parsing único');
        try {
          const data = JSON.parse(responseText);
          console.log('✅ JSON parseado exitosamente:', data);
          const extractedOutput = extractOutputFromChunk(data);
          console.log('📤 Output extraído:', extractedOutput);
          if (extractedOutput) outputs.push(extractedOutput);
        } catch (singleParseError) {
          // Si falla, intentar buscar múltiples objetos JSON concatenados
          console.log('⚠️ Parsing único falló:', singleParseError);
          console.log('🔍 Intentando extraer múltiples JSONs concatenados...');
          const extracted = extractMultipleJSONs(responseText);
          console.log('📤 JSONs extraídos:', extracted);
          outputs.push(...extracted);
        }
      }

      console.log('📦 Total de outputs acumulados:', outputs);

      if (outputs.length > 0) {
        // Concatenar todos los outputs recibidos
        const finalOutput = outputs.join('\n\n');
        console.log('✅ Output procesado exitosamente:', finalOutput);
        return finalOutput;
      }

      console.error('❌ No se pudo extraer output de la respuesta');
      console.error('❌ responseText original:', responseText);
      throw new Error('No se pudo extraer output de la respuesta');
    } catch (error) {
      console.error('Error al comunicarse con el agente:', error);
      throw error;
    }
  };

  // Función auxiliar para extraer output de un chunk JSON
  const extractOutputFromChunk = (chunk: any): string | null => {
    console.log('🔍 extractOutputFromChunk recibió:', chunk);
    console.log('🔍 Tipo de chunk:', typeof chunk, Array.isArray(chunk) ? '(array)' : '');

    if (!chunk) {
      console.log('⚠️ Chunk es null o undefined');
      return null;
    }

    if (Array.isArray(chunk)) {
      console.log('📋 Chunk es un array con', chunk.length, 'elementos');
      // Si es un array, extraer outputs de todos los elementos
      const outputs = chunk
        .map((item, index) => {
          console.log(`  📄 Elemento ${index}:`, item);
          console.log(`  🔑 item?.output:`, item?.output);
          return item?.output;
        })
        .filter(output => {
          const isValid = output && typeof output === 'string';
          console.log(`  ✅ Output válido:`, isValid, output);
          return isValid;
        });
      console.log('📤 Outputs extraídos del array:', outputs);
      return outputs.length > 0 ? outputs.join('\n\n') : null;
    } else if (chunk.output && typeof chunk.output === 'string') {
      console.log('✅ Chunk tiene output directo:', chunk.output);
      return chunk.output;
    }

    console.log('⚠️ Chunk no tiene formato reconocido. Keys:', Object.keys(chunk));
    return null;
  };

  // Función auxiliar para extraer múltiples JSONs concatenados
  const extractMultipleJSONs = (text: string): string[] => {
    const outputs: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      try {
        // Intentar encontrar el siguiente objeto JSON válido
        let depth = 0;
        let inString = false;
        let escape = false;
        let jsonStart = -1;
        let jsonEnd = -1;

        for (let i = startIndex; i < text.length; i++) {
          const char = text[i];

          if (escape) {
            escape = false;
            continue;
          }

          if (char === '\\') {
            escape = true;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            continue;
          }

          if (inString) continue;

          if (char === '{' || char === '[') {
            if (depth === 0) jsonStart = i;
            depth++;
          } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0 && jsonStart !== -1) {
              jsonEnd = i + 1;
              break;
            }
          }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = text.substring(jsonStart, jsonEnd);
          try {
            const parsed = JSON.parse(jsonStr);
            const extractedOutput = extractOutputFromChunk(parsed);
            if (extractedOutput) outputs.push(extractedOutput);
          } catch (e) {
            console.warn('No se pudo parsear JSON extraído:', jsonStr.substring(0, 50));
          }
          startIndex = jsonEnd;
        } else {
          break;
        }
      } catch (e) {
        break;
      }
    }

    return outputs;
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

    // Actualizar conversación con mensaje del usuario y mensaje de carga
    const updatedMessages = [...messages, userMessageObj, loadingMessageObj];
    if (currentConversationId) {
      updateConversationMessages(currentConversationId, updatedMessages);
    }

    try {
      const aiResponse = await sendMessageToAPI(userMessage, attachments);

      // Actualizar el mensaje de carga con la respuesta real
      const finalMessages = updatedMessages.map(msg =>
        msg.id === loadingMessageObj.id
          ? {
              ...msg,
              content: aiResponse,
              isLoading: false
            }
          : msg
      );

      if (currentConversationId) {
        updateConversationMessages(currentConversationId, finalMessages);
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al procesar tu mensaje';

      // Actualizar el mensaje de carga con el error
      const errorMessages = updatedMessages.map(msg =>
        msg.id === loadingMessageObj.id
          ? {
              ...msg,
              content: `Lo siento, hubo un problema al procesar tu mensaje: ${errorMessage}. Por favor, inténtalo nuevamente.`,
              isLoading: false,
              hasError: true
            }
          : msg
      );

      if (currentConversationId) {
        updateConversationMessages(currentConversationId, errorMessages);
      }
    } finally {
      setIsLoading(false);
      setAttachments([]);
    }
  };

  const handleNewConversation = () => {
    // Crear nueva conversación
    createNewConversation();
  };

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

  // Funciones para editar el título de la conversación
  const handleStartEditTitle = () => {
    if (currentConversation) {
      setEditedTitle(currentConversation.title);
      setIsEditingTitle(true);
      // Enfocar el input después de renderizar
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const handleSaveTitle = () => {
    if (currentConversationId && editedTitle.trim()) {
      renameConversation(currentConversationId, editedTitle.trim());
      setIsEditingTitle(false);
      toast({ title: 'Título actualizado', description: 'El nombre de la conversación se actualizó correctamente' });
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  const handleDeleteConversation = () => {
    if (currentConversationId && currentConversation) {
      if (window.confirm(`¿Estás seguro de eliminar la conversación "${currentConversation.title}"?`)) {
        deleteConversation(currentConversationId);
        toast({ title: 'Conversación eliminada', description: 'La conversación se eliminó correctamente' });
      }
    }
  };

  return (
    <div className="page-container gradient-chat p-0">
      {/* Chat Container - Inmersivo pantalla completa */}
      <div className="h-full w-full overflow-hidden relative">
        <Card className="h-full glass-premium border-0 rounded-none flex flex-col overflow-hidden shadow-none">
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
            {/* Banner de título de conversación - Solo si hay conversación activa */}
            {isActiveConversation && currentConversation && (
              <div className="border-b border-niawi-border bg-niawi-surface/80 backdrop-blur-sm px-4 py-3 md:px-8 lg:px-16 xl:px-24 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                  {/* Título editable */}
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={titleInputRef}
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onKeyDown={handleKeyDownTitle}
                          onBlur={handleSaveTitle}
                          className="flex-1 px-3 py-1.5 text-base font-semibold bg-niawi-bg border border-niawi-border rounded-lg focus:outline-none focus:ring-2 focus:ring-niawi-primary focus:border-transparent"
                          placeholder="Nombre de la conversación"
                          maxLength={100}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveTitle}
                          className="h-8 w-8 p-0 hover:bg-niawi-border/50"
                          title="Guardar"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
                          {currentConversation.title}
                        </h1>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditTitle}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-niawi-border/50 transition-opacity"
                          title="Editar nombre"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {!isEditingTitle && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditTitle}
                          className="h-8 px-2 hover:bg-niawi-border/50"
                          title="Editar nombre"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDeleteConversation}
                          className="h-8 px-2 hover:bg-red-500/10 hover:text-red-600"
                          title="Eliminar conversación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {/* Botón de conversaciones integrado en el banner */}
                        <Button
                          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 border-niawi-border hover:bg-niawi-primary hover:text-white hover:border-niawi-primary"
                          title="Gestionar conversaciones"
                        >
                          <Menu className="w-4 h-4" />
                          {getConversationsMetadata().length > 1 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-niawi-primary text-white text-xs rounded-full font-semibold">
                              {getConversationsMetadata().length}
                            </span>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div
              className={`flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-16 xl:px-24 scrollbar-thin scrollbar-track-niawi-surface scrollbar-thumb-niawi-border chat-messages ${
                !isActiveConversation ? 'flex items-center justify-center' : 'space-y-6'
              }`}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleDrop}
            >
              {!isActiveConversation && selectedAgent && currentUser ? (
                // Pantalla de bienvenida dinámica con nuevos componentes
                <div className="max-w-4xl w-full text-center space-y-12 px-4">
                  {/* Saludo dinámico */}
                  <DynamicGreeting
                    userName={currentUser.name}
                    userId={currentUser.id}
                    agentIcon={selectedAgent.icon}
                    agentColor={selectedAgent.color}
                    agentBgColor={selectedAgent.bgColor}
                  />

                  {/* Preguntas sugeridas con gating */}
                  <SuggestedQuestions
                    key={currentConversationId || 'welcome'} // Forzar remontaje en nueva conversación
                    userId={currentUser.id}
                    integrations={integrations}
                    onQuestionClick={(question) => {
                      setMessage(question);
                      // Auto-submit la pregunta
                      setTimeout(() => {
                        textareaRef.current?.focus();
                      }, 100);
                    }}
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                // Vista de conversación normal
                <div className="max-w-5xl mx-auto w-full space-y-6">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 animate-slide-in-up ${
                        msg.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {msg.type === 'assistant' && selectedAgent && (
                        <Avatar className={`w-8 h-8 ${selectedAgent.bgColor} flex-shrink-0 mt-1`}>
                          <AvatarFallback className={`${selectedAgent.color} ${selectedAgent.bgColor} border-0`}>
                            {msg.isLoading ? (
                              <Brain className="w-4 h-4 animate-pulse-slow" />
                            ) : (
                              <selectedAgent.icon className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 ${
                          msg.type === 'user'
                            ? 'bg-niawi-primary text-white ml-auto shadow-lg shadow-niawi-primary/30 hover:shadow-xl hover:shadow-niawi-primary/40'
                            : `backdrop-blur-sm bg-niawi-border/20 text-foreground shadow-sm hover:shadow-md ${
                                msg.hasError ? 'border border-niawi-danger/50' : ''
                              }`
                        }`}
                        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
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

                  {/* Loading Insights - Mostrar cuando está cargando */}
                  {isLoading && currentUser && (
                    <div className="mt-6">
                      <LoadingInsights
                        isLoading={isLoading}
                        userId={currentUser.id}
                        integrations={integrations}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón Nueva Conversación - Solo si hay conversación activa */}
            {isActiveConversation && (
              <div className="px-4 md:px-8 lg:px-16 xl:px-24 pb-3 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    className="border-niawi-border hover:bg-niawi-border/50 hover:scale-105 transition-all"
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nueva conversación
                  </Button>
                </div>
              </div>
            )}

            {/* Botón flotante para abrir conversaciones - Solo cuando NO hay conversación activa */}
            {!isActiveConversation && (
              <Button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                size="sm"
                variant="outline"
                className={`fixed top-6 right-4 md:right-6 z-40 bg-niawi-surface/95 backdrop-blur-sm border-niawi-border hover:bg-niawi-primary hover:text-white hover:border-niawi-primary shadow-lg transition-all duration-300 ${
                  isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                title="Gestionar conversaciones"
              >
                <Menu className="w-4 h-4" />
                {getConversationsMetadata().length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-niawi-primary text-white text-xs rounded-full font-semibold">
                    {getConversationsMetadata().length}
                  </span>
                )}
              </Button>
            )}

            {/* Sidebar de conversaciones - Desliza desde la derecha */}
            <div
              className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-niawi-surface border-l border-niawi-border shadow-2xl transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Header del sidebar con botón cerrar */}
              <div className="p-4 border-b border-niawi-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Gestionar conversaciones</h2>
                <Button
                  onClick={() => setIsSidebarOpen(false)}
                  size="sm"
                  variant="ghost"
                  className="hover:bg-niawi-border/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Contenido del sidebar */}
              <div className="h-[calc(100%-73px)]">
                <ConversationsSidebar
                  conversations={getConversationsMetadata()}
                  currentConversationId={currentConversationId}
                  onSelectConversation={(id) => {
                    switchConversation(id);
                    setIsSidebarOpen(false); // Cerrar al seleccionar
                  }}
                  onNewConversation={() => {
                    createNewConversation();
                    setIsSidebarOpen(false); // Cerrar al crear nueva
                  }}
                  onDeleteConversation={deleteConversation}
                  onRenameConversation={renameConversation}
                />
              </div>
            </div>

            {/* Overlay oscuro cuando el sidebar está abierto */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Input Area */}
            <div className="border-t border-niawi-border px-4 py-6 md:px-8 lg:px-16 xl:px-24 flex-shrink-0">
              <div className="max-w-5xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Escribe tu mensaje aquí..."
                    className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-niawi-bg/50 backdrop-blur-sm border-niawi-border focus:border-niawi-primary input-enhanced"
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
                  className="bg-niawi-primary hover:bg-niawi-primary/90 text-white h-[44px] px-4 btn-magnetic hover:shadow-xl hover:shadow-niawi-primary/50"
                >
                  {isLoading ? (
                    <Brain className="w-4 h-4 animate-pulse-slow" />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
