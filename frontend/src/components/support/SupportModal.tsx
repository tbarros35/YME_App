import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Select';
import { SupportCategory, SupportStatus, SupportTicket, SupportMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  HelpCircle,
  MessageSquarePlus,
  MessagesSquare,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Sparkles,
  User,
  ShieldAlert,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SupportCategory;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'SAD_EVALUATION',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'NEW' | 'LIST'>('NEW');
  const [category, setCategory] = useState<SupportCategory>(initialCategory);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  // Tickets state
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Chat message state
  const [chatMessage, setChatMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMyTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const res = await api.get('/support/tickets/my');
      setMyTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Erro ao obter tickets de suporte:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyTickets();
      if (initialCategory) setCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (selectedTicket) {
      // Auto-refresh ticket details to catch responses
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/support/tickets/${selectedTicket.id}`);
          if (res.data.ticket) {
            setSelectedTicket(res.data.ticket);
          }
        } catch (e) {
          // ignore background polling errors
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const showNotification = (msg: string, isError = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showNotification('Por favor introduz a tua dúvida ou descrição.', true);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/support/tickets', {
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });

      const newTicket: SupportTicket = res.data.ticket;
      showNotification('Pedido de suporte submetido com sucesso!');
      setMessage('');
      setSubject('');
      await fetchMyTickets();
      setSelectedTicket(newTicket);
      setActiveTab('LIST');
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Falha ao submeter pedido de suporte.';
      showNotification(errMsg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !chatMessage.trim() || isSendingMessage) return;

    try {
      setIsSendingMessage(true);
      const text = chatMessage.trim();
      setChatMessage('');

      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: text,
      });

      const newMsg: SupportMessage = res.data.data;
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status,
            }
          : null
      );
      fetchMyTickets();
    } catch (err: any) {
      showNotification('Não foi possível enviar a mensagem.', true);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getCategoryInfo = (cat: SupportCategory) => {
    switch (cat) {
      case 'SAD_EVALUATION':
        return {
          label: 'Avaliação SAD',
          target: 'Recursos Humanos',
          targetBadgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: TrendingUp,
          desc: 'Esclarecimentos sobre notas de desempenho, métricas e relatórios PDF',
        };
      case 'WALLET':
        return {
          label: 'Carteira YME',
          target: 'Legal & Finance',
          targetBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Wallet,
          desc: 'Dúvidas sobre prémios SAD, bónus de presença, saldos ou despesas',
        };
      case 'OTHER':
        return {
          label: 'Outros Assuntos',
          target: 'Executive Board',
          targetBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ShieldAlert,
          desc: 'Assuntos gerais, governança, parcerias ou temas confidenciais da direção',
        };
    }
  };

  const getStatusBadge = (status: SupportStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Aberto
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <RefreshCw className="h-3 w-3" /> Em análise
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Resolvido
          </span>
        );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setSelectedTicket(null);
        onClose();
      }}
      title="Centro de Apoio & Dúvidas YME"
      description="Canal direto de comunicação com Recursos Humanos, Legal & Finance e Executive Board."
      maxWidth="xl"
    >
      <div className="space-y-4 pt-1">
        {/* Notification Alert */}
        {notification && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-scale-in ${
              notification.isError
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Top Switcher Tabs */}
        {!selectedTicket && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NEW'
                  ? 'bg-white text-[#151e33] shadow-clean-sm'
                  : 'text-slate-600 hover:text-[#151e33]'
              }`}
            >
              <MessageSquarePlus className="h-4 w-4 text-[#ff6ef6]" />
              <span>Submeter Nova Dúvida</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('LIST');
                fetchMyTickets();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'LIST'
                  ? 'bg-white text-[#151e33] shadow-clean-sm'
                  : 'text-slate-600 hover:text-[#151e33]'
              }`}
            >
              <MessagesSquare className="h-4 w-4 text-[#151e33]" />
              <span>Minhas Dúvidas & Chats</span>
              {myTickets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#151e33] text-white">
                  {myTickets.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* VIEW 1: SUBMETER NOVA DÚVIDA */}
        {activeTab === 'NEW' && !selectedTicket && (
          <form onSubmit={handleCreateTicket} className="space-y-4 animate-scale-in">
            {/* 3 Categories Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                1. Seleciona a Categoria do Teu Pedido *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['SAD_EVALUATION', 'WALLET', 'OTHER'] as SupportCategory[]).map((cat) => {
                  const info = getCategoryInfo(cat);
                  const isSelected = category === cat;
                  const Icon = info.icon;
                  return (
                    <div
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'border-[#151e33] bg-gradient-to-b from-white to-slate-50/90 shadow-clean-sm scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#151e33] text-[#ff6ef6]'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${info.targetBadgeColor}`}
                        >
                          {info.target}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-[#151e33]">{info.label}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                          {info.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                2. Descrição Detalhada da Dúvida ou Problema *
              </label>
              <Textarea
                placeholder="Explica detalhadamente o teu pedido, contexto ou dúvida para que a equipa te possa esclarecer com rapidez..."
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                rows={4}
                required
              />
              <p className="text-[11px] text-slate-400 font-medium">
                {category === 'SAD_EVALUATION' && (
                  <span>🎯 O pedido será enviado para o chat da equipa de <strong>Recursos Humanos</strong>.</span>
                )}
                {category === 'WALLET' && (
                  <span>🎯 O pedido será enviado para o chat da equipa de <strong>Legal & Finance</strong>.</span>
                )}
                {category === 'OTHER' && (
                  <span>🎯 O pedido será tratado com confidencialidade pela <strong>Executive Board</strong>.</span>
                )}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <Send className="h-4 w-4 mr-2 text-[#ff6ef6]" />
                <span>Submeter Dúvida & Abrir Chat</span>
              </Button>
            </div>
          </form>
        )}

        {/* VIEW 2: LISTA DE TICKETS DO MEMBRO */}
        {activeTab === 'LIST' && !selectedTicket && (
          <div className="space-y-3 animate-scale-in">
            {isLoadingTickets ? (
              <div className="space-y-2 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Ainda não submeteste nenhuma dúvida</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clica na aba "Submeter Nova Dúvida" para falar com RH, Legal ou Executive Board.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {myTickets.map((tk) => {
                  const catInfo = getCategoryInfo(tk.category);
                  const lastMsg = tk.messages[tk.messages.length - 1];
                  return (
                    <div
                      key={tk.id}
                      onClick={() => setSelectedTicket(tk)}
                      className="p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-[#151e33] hover:shadow-clean-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${catInfo.targetBadgeColor}`}
                          >
                            {catInfo.label} • {catInfo.target}
                          </span>
                          {getStatusBadge(tk.status)}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(tk.updatedAt || tk.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-700 line-clamp-2">
                        {lastMsg?.content || tk.subject}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                        <span>{tk.messages.length} {tk.messages.length === 1 ? 'mensagem' : 'mensagens'}</span>
                        <span className="text-[#151e33] group-hover:underline font-bold flex items-center gap-1">
                          Abrir conversa →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE CHAT VIEW */}
        {selectedTicket && (
          <div className="space-y-3 animate-scale-in">
            {/* Chat Header Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#151e33] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar à lista</span>
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    getCategoryInfo(selectedTicket.category).targetBadgeColor
                  }`}
                >
                  {getCategoryInfo(selectedTicket.category).label} • {getCategoryInfo(selectedTicket.category).target}
                </span>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>

            {/* Message Stream */}
            <div className="h-[280px] sm:h-[320px] overflow-y-auto p-3 rounded-2xl bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 border border-slate-200 space-y-3">
              {selectedTicket.messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-400">
                      <span>{isMe ? 'Tu' : msg.sender?.fullName}</span>
                      {!isMe && msg.sender?.department?.name && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
                          {msg.sender.department.name}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-medium shadow-clean-sm ${
                        isMe
                          ? 'bg-[#151e33] text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Escreve uma resposta para a equipa..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#151e33]"
              />
              <Button
                type="submit"
                variant="primary"
                className="h-10 px-4"
                disabled={!chatMessage.trim() || isSendingMessage}
                isLoading={isSendingMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
};
