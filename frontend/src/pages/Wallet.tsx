import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { SupportModal } from '@/components/support/SupportModal';
import { WalletSummary, WalletTransaction, WalletRequest, ReimbursementRequest } from '@/types';
import { cn } from '@/lib/utils';
import {
  Receipt,
  Upload,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [myRequests, setMyRequests] = useState<WalletRequest[]>([]);
  const [myReimbursements, setMyReimbursements] = useState<ReimbursementRequest[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<'MOVEMENTS' | 'REIMBURSEMENTS' | 'REQUESTS'>('MOVEMENTS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  // Balance Usage Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [requestJustification, setRequestJustification] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Reimbursement Request Modal State
  const [isReimbursementModalOpen, setIsReimbursementModalOpen] = useState<boolean>(false);
  const [reimbursementAmount, setReimbursementAmount] = useState<string>('');
  const [reimbursementJustification, setReimbursementJustification] = useState<string>('');
  const [reimbursementFile, setReimbursementFile] = useState<File | null>(null);
  const [isSubmittingReimbursement, setIsSubmittingReimbursement] = useState<boolean>(false);
  const [reimbursementError, setReimbursementError] = useState<string | null>(null);
  const [reimbursementSuccess, setReimbursementSuccess] = useState<string | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const [walletRes, requestsRes, reimbursementsRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get('/wallet/my-requests'),
        api.get('/wallet/my-reimbursements'),
      ]);

      const data: WalletSummary = walletRes.data.data || walletRes.data;
      setSummary(data || null);
      setTransactions(data?.transactions || []);
      setMyRequests(requestsRes.data.requests || requestsRes.data.data || []);
      setMyReimbursements(reimbursementsRes.data.reimbursements || reimbursementsRes.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados da carteira:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleOpenBalanceModal = () => {
    setRequestAmount('');
    setRequestJustification('');
    setRequestError(null);
    setRequestSuccess(null);
    setIsRequestModalOpen(true);
  };

  const handleOpenReimbursementModal = () => {
    setReimbursementAmount('');
    setReimbursementJustification('');
    setReimbursementFile(null);
    setReimbursementError(null);
    setReimbursementSuccess(null);
    setIsReimbursementModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);

    const parsedAmount = parseFloat(requestAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRequestError('Por favor insere um montante válido superior a 0,00 €.');
      return;
    }

    const availableBalance = summary ? summary.balance : 0;
    if (parsedAmount > availableBalance) {
      setRequestError(
        `O montante pretendido (${parsedAmount.toFixed(2)} €) não pode exceder o saldo disponível (${availableBalance.toFixed(2)} €).`
      );
      return;
    }

    if (!requestJustification.trim() || requestJustification.trim().length < 5) {
      setRequestError(
        'Por favor indica uma justificação detalhada com pelo menos 5 caracteres sobre o efeito para o qual pretendes utilizar o dinheiro.'
      );
      return;
    }

    try {
      setIsSubmittingRequest(true);
      await api.post('/wallet/request', {
        amount: parsedAmount,
        justification: requestJustification.trim(),
      });

      setRequestSuccess('Pedido de utilização de saldo submetido com sucesso!');
      await fetchWalletData();
      setActiveViewTab('REQUESTS');

      setTimeout(() => {
        setIsRequestModalOpen(false);
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Ocorreu um erro ao submeter o pedido.';
      setRequestError(msg);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    setReimbursementError(null);
    setReimbursementSuccess(null);

    const parsedAmount = parseFloat(reimbursementAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setReimbursementError('Por favor insere um montante válido superior a 0,00 €.');
      return;
    }

    if (!reimbursementJustification.trim() || reimbursementJustification.trim().length < 5) {
      setReimbursementError(
        'Por favor indica uma justificação detalhada com pelo menos 5 caracteres sobre a despesa realizada para a YME.'
      );
      return;
    }

    if (!reimbursementFile) {
      setReimbursementError('É obrigatório anexar o comprovativo / fatura da compra (PDF ou imagem).');
      return;
    }

    try {
      setIsSubmittingReimbursement(true);
      const formData = new FormData();
      formData.append('amount', parsedAmount.toString());
      formData.append('justification', reimbursementJustification.trim());
      formData.append('receipt', reimbursementFile);

      await api.post('/wallet/reimbursement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setReimbursementSuccess('Pedido de reembolso submetido com sucesso à Administração!');
      await fetchWalletData();
      setActiveViewTab('REIMBURSEMENTS');

      setTimeout(() => {
        setIsReimbursementModalOpen(false);
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Ocorreu um erro ao submeter o pedido de reembolso.';
      setReimbursementError(msg);
    } finally {
      setIsSubmittingReimbursement(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatStatus = (status: string): { label: string; className: string } => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Aprovado', className: 'text-[#ff63f6] font-bold' };
      case 'REJECTED':
        return { label: 'Recusado', className: 'text-[#151e33] font-medium' };
      case 'PENDING':
      default:
        return { label: 'Pendente', className: 'text-[#151e33] font-medium' };
    }
  };

  const availableBalance = summary ? summary.balance : 0;

  return (
    <div className="space-y-10 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Top Section: 3 Cards matching Figma Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* Card 1: Saldo Disponível (Dark Navy Surface) */}
        <div className="bg-[#151e33] rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.14)] min-h-[250px] flex flex-col justify-between hover:scale-[1.01] transition-transform">
          {/* Title with vertical pink bar */}
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Saldo Disponível
            </h2>
          </div>

          {/* Big Pink Metric */}
          <div className="my-auto py-2">
            <div className="text-5xl font-black text-[#ff63f6] tracking-tight leading-none">
              {isLoading ? (
                <span className="inline-block w-24 h-12 bg-white/10 rounded-xl animate-pulse" />
              ) : (
                <AnimatedCounter
                  value={availableBalance}
                  decimals={availableBalance % 1 === 0 ? 0 : 2}
                  suffix="€"
                  duration={1000}
                />
              )}
            </div>
          </div>

          {/* Pink divider and User info */}
          <div className="pt-2">
            <div className="w-full h-[1px] bg-[#ff63f6]/40 mb-3" />
            <p className="text-xs sm:text-sm font-medium text-white/90 truncate">
              {user?.fullName || 'Tiago Barros'} - {user?.position || 'COO'}
            </p>
          </div>
        </div>

        {/* Card 2: Pedir Reembolso (White Surface) */}
        <div className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[250px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all">
          {/* Title with vertical pink bar */}
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
              Pedir Reembolso
            </h2>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#151e33] font-normal leading-relaxed my-auto py-3">
            Tiveste algum gasto relacionado com a YME? Pede aqui o reembolso!
          </p>

          {/* Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenReimbursementModal}
              className="px-8 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Reembolso
            </button>
          </div>
        </div>

        {/* Card 3: Utilizar Saldo YME (White Surface) */}
        <div className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[250px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all">
          {/* Title with vertical pink bar */}
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
              Utilizar Saldo YME
            </h2>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#151e33] font-normal leading-relaxed my-auto py-3">
            Participaste em algum evento da YME e queres utilizar o teu saldo para o reembolsar? Clica aqui!
          </p>

          {/* Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenBalanceModal}
              className="px-8 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Utilizar Saldo
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Sub-menus and Main Table (Left) + Support (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Left Column: Sub-menu Tabs & Table */}
        <div className="lg:col-span-9 space-y-4">
          {/* Sub-menu Horizontal Tabs */}
          <div className="flex items-center gap-4 sm:gap-8 flex-wrap text-xs sm:text-sm pl-2">
            <button
              type="button"
              onClick={() => setActiveViewTab('MOVEMENTS')}
              className={cn(
                'flex items-center gap-1.5 pb-2 transition-all cursor-pointer select-none',
                activeViewTab === 'MOVEMENTS'
                  ? 'text-[#ff63f6] font-bold border-b-2 border-[#ff63f6]'
                  : 'text-[#151e33] font-medium hover:text-[#ff63f6]'
              )}
            >
              {activeViewTab === 'MOVEMENTS' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff63f6] shrink-0" />
              )}
              <span>Extratos de Movimentos</span>
            </button>

            <span className="text-[#151e33]/25 font-light select-none">|</span>

            <button
              type="button"
              onClick={() => setActiveViewTab('REIMBURSEMENTS')}
              className={cn(
                'flex items-center gap-1.5 pb-2 transition-all cursor-pointer select-none',
                activeViewTab === 'REIMBURSEMENTS'
                  ? 'text-[#ff63f6] font-bold border-b-2 border-[#ff63f6]'
                  : 'text-[#151e33] font-medium hover:text-[#ff63f6]'
              )}
            >
              {activeViewTab === 'REIMBURSEMENTS' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff63f6] shrink-0" />
              )}
              <span>Pedidos de Reembolso</span>
            </button>

            <span className="text-[#151e33]/25 font-light select-none">|</span>

            <button
              type="button"
              onClick={() => setActiveViewTab('REQUESTS')}
              className={cn(
                'flex items-center gap-1.5 pb-2 transition-all cursor-pointer select-none',
                activeViewTab === 'REQUESTS'
                  ? 'text-[#ff63f6] font-bold border-b-2 border-[#ff63f6]'
                  : 'text-[#151e33] font-medium hover:text-[#ff63f6]'
              )}
            >
              {activeViewTab === 'REQUESTS' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff63f6] shrink-0" />
              )}
              <span>Pedidos de Utilização de Saldo</span>
            </button>
          </div>

          {/* Large White Card with Table Content */}
          <div className="bg-white rounded-[44px] p-8 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[320px]">
            {/* Table Column Headers */}
            <div className="grid grid-cols-12 text-xs sm:text-sm font-bold text-[#ff63f6] pb-3 border-b border-[#151e33]/15">
              <div className="col-span-3 sm:col-span-2">Data</div>
              <div className="col-span-6 sm:col-span-8">Descrição</div>
              <div className="col-span-3 sm:col-span-2 text-right">
                {activeViewTab === 'MOVEMENTS' ? 'Montante' : 'Estado'}
              </div>
            </div>

            {/* Table Rows */}
            {isLoading ? (
              <div className="space-y-4 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-slate-100 rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#151e33]/10">
                {/* TAB 1: Extratos de Movimentos */}
                {activeViewTab === 'MOVEMENTS' && (
                  transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="grid grid-cols-12 text-xs sm:text-sm py-4 items-center gap-2"
                      >
                        <div className="col-span-3 sm:col-span-2 text-[#151e33] font-normal">
                          {formatDate(tx.createdAt)}
                        </div>
                        <div className="col-span-6 sm:col-span-8 text-[#151e33] font-normal pr-4 truncate sm:overflow-visible sm:whitespace-normal">
                          {tx.description}
                        </div>
                        <div
                          className={cn(
                            'col-span-3 sm:col-span-2 text-right font-semibold whitespace-nowrap',
                            tx.amount > 0 ? 'text-[#ff63f6]' : 'text-[#151e33]'
                          )}
                        >
                          {tx.amount > 0
                            ? `+ ${Number(tx.amount).toFixed(2)}€`
                            : `- ${Math.abs(Number(tx.amount)).toFixed(2)}€`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs sm:text-sm text-[#151e33]/60 font-medium">
                      Sem movimentos registados na tua carteira YME.
                    </div>
                  )
                )}

                {/* TAB 2: Pedidos de Reembolso */}
                {activeViewTab === 'REIMBURSEMENTS' && (
                  myReimbursements.length > 0 ? (
                    myReimbursements.map((r) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-12 text-xs sm:text-sm py-4 items-center gap-2"
                      >
                        <div className="col-span-3 sm:col-span-2 text-[#151e33] font-normal">
                          {formatDate(r.createdAt)}
                        </div>
                        <div className="col-span-6 sm:col-span-8 text-[#151e33] font-normal pr-4">
                          <div className="flex items-center gap-2">
                            <span className="truncate sm:overflow-visible sm:whitespace-normal">
                              {r.justification}
                            </span>
                            {r.receiptUrl && (
                              <a
                                href={r.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver Fatura / Recibo"
                                className="text-[#ff63f6] hover:text-[#151e33] shrink-0"
                              >
                                <Paperclip className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          {r.status === 'REJECTED' && r.rejectionReason && (
                            <p className="text-[11px] text-[#ff63f6] mt-0.5 font-medium">
                              Motivo da recusa: {r.rejectionReason}
                            </p>
                          )}
                          {r.status === 'APPROVED' && r.refundProofUrl && (
                            <a
                              href={r.refundProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#ff63f6] hover:underline font-bold mt-1"
                            >
                              <span>Ver Comprovativo da Devolução</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div
                          className={cn(
                            'col-span-3 sm:col-span-2 text-right whitespace-nowrap',
                            formatStatus(r.status).className
                          )}
                        >
                          {formatStatus(r.status).label}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs sm:text-sm text-[#151e33]/60 font-medium">
                      Ainda não efetuaste pedidos de reembolso.
                    </div>
                  )
                )}

                {/* TAB 3: Pedidos de Utilização de Saldo */}
                {activeViewTab === 'REQUESTS' && (
                  myRequests.length > 0 ? (
                    myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="grid grid-cols-12 text-xs sm:text-sm py-4 items-center gap-2"
                      >
                        <div className="col-span-3 sm:col-span-2 text-[#151e33] font-normal">
                          {formatDate(req.createdAt)}
                        </div>
                        <div className="col-span-6 sm:col-span-8 text-[#151e33] font-normal pr-4">
                          <span className="truncate sm:overflow-visible sm:whitespace-normal">
                            {req.justification}
                          </span>
                          {req.status === 'REJECTED' && req.rejectionReason && (
                            <p className="text-[11px] text-[#ff63f6] mt-0.5 font-medium">
                              Motivo da recusa: {req.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(
                            'col-span-3 sm:col-span-2 text-right whitespace-nowrap',
                            formatStatus(req.status).className
                          )}
                        >
                          {formatStatus(req.status).label}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs sm:text-sm text-[#151e33]/60 font-medium">
                      Ainda não efetuaste pedidos de utilização de saldo.
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Support Section (DÚVIDAS ?) */}
        <div className="lg:col-span-3 pt-6 lg:pt-14">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#151e33] tracking-tight">
            DÚVIDAS <span className="text-[#ff63f6]">?</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#151e33]/80 mt-2 leading-relaxed max-w-xs">
            Tens dúvidas relacionadas com a tua conta YME? Contacta um membro de Legal / ExBo!
          </p>
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="mt-6 px-8 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Abrir Chat
          </button>
        </div>
      </div>

      {/* Modal Dialog 1: Requesting Wallet Balance Funds */}
      <Dialog
        isOpen={isRequestModalOpen}
        onClose={() => !isSubmittingRequest && setIsRequestModalOpen(false)}
        title="Requisitar Utilização de Saldo YME"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <p className="text-xs text-slate-600">
            Como membro com saldo ativo, podes requisitar a utilização do dinheiro da tua conta indicando o valor e justificando a finalidade pretendida.
          </p>

          <div className="bg-[#151e33]/5 p-3 rounded-xl border border-[#151e33]/10 flex items-center justify-between">
            <span className="text-xs font-bold text-[#151e33]/70">Saldo Disponível:</span>
            <span className="text-sm font-extrabold text-[#151e33]">
              {availableBalance.toFixed(2)} €
            </span>
          </div>

          {requestError && (
            <div className="p-3 bg-[#ff63f6]/10 text-[#151e33] text-xs rounded-xl border border-[#ff63f6]/40 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#ff63f6]" />
              <span>{requestError}</span>
            </div>
          )}

          {requestSuccess && (
            <div className="p-3 bg-[#151e33] text-white text-xs rounded-xl border border-[#151e33] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#ff63f6]" />
              <span>{requestSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#151e33]">
                Montante a Utilizar (€) *
              </label>
              {availableBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setRequestAmount(availableBalance.toString())}
                  className="text-[11px] font-bold text-[#151e33] hover:text-[#ff63f6] underline cursor-pointer"
                >
                  Usar Saldo Total ({availableBalance.toFixed(2)} €)
                </button>
              )}
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={availableBalance > 0 ? availableBalance : undefined}
              placeholder="Ex: 25.00"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              required
              disabled={isSubmittingRequest}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#151e33]">
              Efeito / Justificação do Uso do Dinheiro *
            </label>
            <Textarea
              rows={3}
              placeholder="Ex: Pagamento de inscrição no workshop nacional de consultoria, comparticipação de deslocação para reunião com cliente, etc."
              value={requestJustification}
              onChange={(e) => setRequestJustification(e.target.value)}
              required
              disabled={isSubmittingRequest}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#151e33]/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={isSubmittingRequest}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmittingRequest}>
              {isSubmittingRequest ? 'A submeter...' : 'Submeter Pedido'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Dialog 2: Reimbursement Request */}
      <Dialog
        isOpen={isReimbursementModalOpen}
        onClose={() => !isSubmittingReimbursement && setIsReimbursementModalOpen(false)}
        title="Pedido de Reembolso de Despesa para a YME"
      >
        <form onSubmit={handleSubmitReimbursement} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#ff63f6]/10 border border-[#ff63f6]/30 text-xs text-[#151e33] space-y-1">
            <p className="font-bold flex items-center gap-1 text-[#151e33]">
              <Receipt className="h-4 w-4 text-[#ff63f6]" />
              <span>Reembolso Independente do Saldo da Carteira</span>
            </p>
            <p className="text-[#151e33]/80 text-[11px]">
              Se compraste algum material ou pagaste uma despesa com o teu próprio dinheiro para a YME, preenche este formulário e anexa a fatura. A Administração irá rever o pedido e devolver-te o valor com respetivo comprovativo.
            </p>
          </div>

          {reimbursementError && (
            <div className="p-3 bg-[#ff63f6]/10 text-[#151e33] text-xs rounded-xl border border-[#ff63f6]/40 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#ff63f6]" />
              <span>{reimbursementError}</span>
            </div>
          )}

          {reimbursementSuccess && (
            <div className="p-3 bg-[#151e33] text-white text-xs rounded-xl border border-[#151e33] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#ff63f6]" />
              <span>{reimbursementSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#151e33]">
              Valor Gasto a Reembolsar (€) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ex: 42.50"
              value={reimbursementAmount}
              onChange={(e) => setReimbursementAmount(e.target.value)}
              required
              disabled={isSubmittingReimbursement}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#151e33]">
              Justificação do Valor Gasto *
            </label>
            <Textarea
              rows={3}
              placeholder="Ex: Compra de materiais de escritório para a Assembleia Geral, refeição de trabalho com patrocinador, etc."
              value={reimbursementJustification}
              onChange={(e) => setReimbursementJustification(e.target.value)}
              required
              disabled={isSubmittingReimbursement}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#151e33]">
              Comprovativo da Fatura / Recibo (Foto ou PDF) *
            </label>
            <div className="p-4 rounded-xl border-2 border-dashed border-[#151e33]/20 hover:border-[#ff63f6] bg-[#151e33]/5 transition-colors text-center">
              <input
                ref={receiptFileInputRef}
                type="file"
                id="reimbursementReceiptInput"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReimbursementFile(file);
                }}
                disabled={isSubmittingReimbursement}
                required
              />
              <label
                htmlFor="reimbursementReceiptInput"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="h-10 w-10 rounded-full bg-white shadow-clean-sm border border-[#151e33]/15 flex items-center justify-center text-[#151e33]">
                  <Upload className="h-5 w-5" />
                </div>
                {reimbursementFile ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#151e33] text-white border border-[#151e33]">
                      <FileText className="h-3.5 w-3.5 text-[#ff63f6]" />
                      {reimbursementFile.name} ({(reimbursementFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <p className="text-[11px] text-[#151e33]/60 font-medium">
                      Clica para substituir o ficheiro
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-[#151e33] hover:underline">
                      Clica para carregar a foto ou PDF da fatura
                    </span>
                    <p className="text-[11px] text-[#151e33]/50 font-medium mt-0.5">
                      Ficheiros PDF ou Imagens PNG/JPG (máx. 25 MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#151e33]/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReimbursementModalOpen(false)}
              disabled={isSubmittingReimbursement}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmittingReimbursement}>
              {isSubmittingReimbursement ? 'A enviar...' : 'Submeter Pedido de Reembolso'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Global Support Modal for "Abrir Chat" */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};
