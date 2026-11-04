import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { WalletTypeBadge, Badge } from '@/components/ui/Badge';
import { YmeLogo } from '@/components/ui/YmeLogo';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { WalletSummary, WalletTransaction, WalletRequest, ReimbursementRequest } from '@/types';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  Sparkles,
  Receipt,
  Upload,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import api from '@/lib/api';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [myRequests, setMyRequests] = useState<WalletRequest[]>([]);
  const [myReimbursements, setMyReimbursements] = useState<ReimbursementRequest[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'MOVEMENTS' | 'REQUESTS' | 'REIMBURSEMENTS'>('MOVEMENTS');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const pendingRequestsCount = myRequests.filter((r) => r.status === 'PENDING').length;
  const pendingReimbursementsCount = myReimbursements.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Action Bar (Stagger 1) */}
      <div className="stagger-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-[#151e33]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#151e33]">
              YME Wallet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Cartão virtual de membro, saldo corrente, requisições de saldo e reembolsos de despesas
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Reimbursement Button (Always available for all members) */}
          <Button
            variant="outline"
            onClick={handleOpenReimbursementModal}
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 text-[#151e33] font-bold shadow-xs hover:scale-[1.02] transition-transform"
          >
            <Receipt className="h-4 w-4 text-[#ff6ef6]" />
            <span>Pedir Reembolso YME</span>
          </Button>

          {/* Balance Usage Request Button (Requires positive balance) */}
          <Button
            onClick={handleOpenBalanceModal}
            disabled={!summary || summary.balance <= 0}
            className="flex items-center gap-2 shadow-clean-sm hover:scale-[1.02] transition-transform font-bold"
          >
            <Send className="h-4 w-4" />
            <span>Requisitar Saldo</span>
          </Button>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Conta Regularizada</span>
          </span>
        </div>
      </div>

      {/* Top Grid: Digital Card (Left) + Breakdown (Right) (Stagger 2) */}
      <div className="stagger-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Holographic Card */}
        <div className="lg:col-span-1">
          <div className="holographic-card text-white p-6 sm:p-7 flex flex-col justify-between min-h-[230px] sm:min-h-[250px]">
            {/* Card Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="bg-white rounded-xl px-3 py-1.5 inline-flex items-center shadow-sm">
                  <YmeLogo className="h-7 sm:h-8 w-auto" />
                </div>
                <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1.5 font-bold">
                  {user?.department?.name || 'Junior Enterprise'}
                </p>
              </div>
              <div className="h-8 w-11 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 opacity-90 shadow-sm flex items-center justify-center">
                <div className="h-3.5 w-6 border border-amber-900/30 rounded-sm" />
              </div>
            </div>

            {/* Card Center: Balance with AnimatedCounter */}
            <div className="relative z-10 my-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                Saldo Disponível
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-0.5">
                <AnimatedCounter
                  value={summary ? summary.balance : 0}
                  decimals={2}
                  suffix=" €"
                  duration={1200}
                />
              </div>
            </div>

            {/* Card Footer: Member Info */}
            <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-slate-300 font-medium">
                  {user?.position} • {user?.email}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono text-slate-300 tracking-wider">
                  YME-MEMBERSHIP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Metric Cards (2 Columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Inflow */}
          <div className="clean-card p-6 flex flex-col justify-between group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total de Créditos & Bolsas
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                +<AnimatedCounter value={totalCredits} decimals={2} suffix=" €" duration={1000} />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Reembolsos, prémios de projetos e subsídios
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Atribuído pela Gestão Financeira
            </span>
          </div>

          {/* Total Outflow */}
          <div className="clean-card p-6 flex flex-col justify-between group hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total de Débitos & Despesas
              </span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                -<AnimatedCounter value={totalDebits} decimals={2} suffix=" €" duration={1000} />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Quotas, eventos, merchandising e utilizações
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Liquidações e despesas associativas
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: Movements / Balance Requests / Reimbursements Switcher (Stagger 3) */}
      <div className="stagger-3 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveViewTab('MOVEMENTS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
              activeViewTab === 'MOVEMENTS'
                ? 'text-[#151e33] border-b-2 border-[#151e33]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Extrato de Movimentos</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveViewTab('REQUESTS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
              activeViewTab === 'REQUESTS'
                ? 'text-[#151e33] border-b-2 border-[#151e33]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Pedidos de Saldo</span>
            {pendingRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                {pendingRequestsCount} pendente{pendingRequestsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                {myRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveViewTab('REIMBURSEMENTS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 shrink-0 ${
              activeViewTab === 'REIMBURSEMENTS'
                ? 'text-[#151e33] border-b-2 border-[#151e33]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4 text-[#ff6ef6]" />
            <span>Reembolsos YME (Faturas)</span>
            {pendingReimbursementsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold animate-pulse">
                {pendingReimbursementsCount} pendente{pendingReimbursementsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                {myReimbursements.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Movements Table */}
        {activeViewTab === 'MOVEMENTS' && (
          <Card className="border-slate-200 shadow-clean-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-[#151e33]">
                  Extrato de Movimentos
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Histórico detalhado de todas as transações da tua conta YME
                </CardDescription>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar movimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#151e33]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['ALL', 'SAD_REWARD', 'PRESENCE_BONUS', 'EVENT_SPEND', 'ADJUSTMENT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterType === type
                          ? 'bg-white text-[#151e33] shadow-sm font-bold scale-105'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {type === 'ALL'
                        ? 'Todos'
                        : type === 'SAD_REWARD'
                        ? 'SAD'
                        : type === 'PRESENCE_BONUS'
                        ? 'Bónus'
                        : type === 'EVENT_SPEND'
                        ? 'Eventos/Uso'
                        : 'Ajustes'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {isLoading ? (
                <div className="space-y-3 py-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Sem movimentos encontrados</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Não existem registos financeiros que correspondam aos filtros selecionados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Descrição</th>
                        <th className="py-3 px-3">Tipo</th>
                        <th className="py-3 px-3 text-right">Montante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((tx, idx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 transition-colors animate-scale-in"
                          style={{ animationDelay: `${idx * 0.04}s` }}
                        >
                          <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#151e33]">
                            {tx.description}
                          </td>
                          <td className="py-3 px-3">
                            <WalletTypeBadge type={tx.type} amount={tx.amount} />
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                              tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.amount > 0 ? `+${tx.amount.toFixed(2)} €` : `${tx.amount.toFixed(2)} €`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Balance Usage Requests History */}
        {activeViewTab === 'REQUESTS' && (
          <Card className="border-slate-200 shadow-clean-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-[#151e33]">
                  Histórico de Pedidos de Utilização de Saldo
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Acompanha o estado das tuas requisições de saldo para aprovação da Direção / Legal & Finance
                </CardDescription>
              </div>

              <Button
                onClick={handleOpenBalanceModal}
                disabled={!summary || summary.balance <= 0}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Nova Requisição de Saldo</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-2">
              {isLoading ? (
                <div className="space-y-3 py-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Ainda não realizaste nenhum pedido de saldo</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Podes requisitar a utilização do teu saldo a qualquer momento com a devida justificação.
                  </p>
                  {summary && summary.balance > 0 && (
                    <Button
                      onClick={handleOpenBalanceModal}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Criar Primeiro Pedido
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="py-4 px-2 hover:bg-slate-50/60 rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-extrabold text-[#151e33]">
                            {req.amount.toFixed(2)} €
                          </span>

                          {req.status === 'PENDING' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Pendente de Aprovação</span>
                            </span>
                          )}

                          {req.status === 'APPROVED' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Aprovado — Debitado da Conta</span>
                            </span>
                          )}

                          {req.status === 'REJECTED' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>Recusado — Saldo Mantido</span>
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            Submetido em{' '}
                            {new Date(req.createdAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          <span className="font-bold text-slate-500">Justificação: </span>
                          {req.justification}
                        </p>

                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="text-xs text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-200/60 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold">Motivo da Recusa: </span>
                              {req.rejectionReason}
                            </div>
                          </div>
                        )}

                        {req.reviewedBy && (
                          <p className="text-[10px] text-slate-400">
                            Revisto por: <span className="font-semibold text-slate-600">{req.reviewedBy.fullName}</span>
                            {req.reviewedAt && (
                              <span>
                                {' '}em{' '}
                                {new Date(req.reviewedAt).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Reimbursement Requests History (Compras para a YME) */}
        {activeViewTab === 'REIMBURSEMENTS' && (
          <Card className="border-slate-200 shadow-clean-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-[#151e33] flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#ff6ef6]" />
                  <span>Histórico de Pedidos de Reembolso</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Despesas e compras que efetuaste para a YME com fundos pessoais. A aprovação e devolução são geridas exclusivamente pela Administração.
                </CardDescription>
              </div>

              <Button
                onClick={handleOpenReimbursementModal}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Novo Pedido de Reembolso</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-2">
              {isLoading ? (
                <div className="space-y-3 py-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : myReimbursements.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Sem pedidos de reembolso registados</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Fizeste alguma compra para a YME? Submete a fatura com justificação para receberes a devolução do dinheiro.
                  </p>
                  <Button
                    onClick={handleOpenReimbursementModal}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Submeter Pedido de Reembolso
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myReimbursements.map((req) => (
                    <div
                      key={req.id}
                      className="py-4 px-2 hover:bg-slate-50/60 rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-extrabold text-[#151e33]">
                            {req.amount.toFixed(2)} €
                          </span>

                          {req.status === 'PENDING' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Aguardando Validação da Administração</span>
                            </span>
                          )}

                          {req.status === 'APPROVED' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Reembolso Aprovado & Devolvido</span>
                            </span>
                          )}

                          {req.status === 'REJECTED' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>Reembolso Recusado</span>
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            Submetido em{' '}
                            {new Date(req.createdAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          <span className="font-bold text-slate-500">Justificação da Despesa: </span>
                          {req.justification}
                        </p>

                        {/* Attachments Section */}
                        <div className="flex items-center gap-3 flex-wrap pt-1">
                          {req.receiptUrl && (
                            <a
                              href={req.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#151e33] text-xs font-semibold text-[#151e33] shadow-2xs hover:shadow-xs transition-all"
                            >
                              <Paperclip className="h-3.5 w-3.5 text-[#ff6ef6]" />
                              <span>Ver Fatura / Recibo</span>
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                          )}

                          {req.status === 'APPROVED' && req.refundProofUrl && (
                            <a
                              href={req.refundProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-all"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Ver Comprovativo da Devolução</span>
                              <ExternalLink className="h-3 w-3 text-emerald-600" />
                            </a>
                          )}
                        </div>

                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="text-xs text-rose-700 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200/60 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold">Motivo da Recusa: </span>
                              {req.rejectionReason}
                            </div>
                          </div>
                        )}

                        {req.reviewedBy && (
                          <p className="text-[10px] text-slate-400">
                            Revisto pela Administração ({req.reviewedBy.fullName})
                            {req.reviewedAt && (
                              <span>
                                {' '}em{' '}
                                {new Date(req.reviewedAt).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Saldo Disponível:</span>
            <span className="text-sm font-extrabold text-emerald-600">
              {summary ? summary.balance.toFixed(2) : '0.00'} €
            </span>
          </div>

          {requestError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{requestError}</span>
            </div>
          )}

          {requestSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{requestSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#151e33]">
                Montante a Utilizar (€) *
              </label>
              {summary && summary.balance > 0 && (
                <button
                  type="button"
                  onClick={() => setRequestAmount(summary.balance.toString())}
                  className="text-[11px] font-bold text-[#d81bb0] hover:underline"
                >
                  Usar Saldo Total ({summary.balance.toFixed(2)} €)
                </button>
              )}
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={summary ? summary.balance : undefined}
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
            <p className="text-[10px] text-slate-400">
              Indica claramente o fim ou projeto para o qual os fundos serão alocados.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Como funciona o processo de aprovação?</p>
            <p>
              • Os Administradores e a equipa de Legal & Finance recebem notificação no backoffice.
            </p>
            <p>
              • Se for <strong>aprovado</strong>, o valor sai imediatamente da tua carteira.
            </p>
            <p>
              • Se for <strong>recusado</strong>, o saldo permanece intacto na tua conta.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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

      {/* Modal Dialog 2: Reimbursement Request (Compras para a YME - Independente do Saldo) */}
      <Dialog
        isOpen={isReimbursementModalOpen}
        onClose={() => !isSubmittingReimbursement && setIsReimbursementModalOpen(false)}
        title="Pedido de Reembolso de Despesa para a YME"
      >
        <form onSubmit={handleSubmitReimbursement} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#fff0fd] border border-[#ff6ef6]/30 text-xs text-[#151e33] space-y-1">
            <p className="font-bold flex items-center gap-1 text-[#d81bb0]">
              <Receipt className="h-4 w-4" />
              <span>Reembolso Independente do Saldo da Carteira</span>
            </p>
            <p className="text-slate-600 text-[11px]">
              Se compraste algum material ou pagaste uma despesa com o teu próprio dinheiro para a YME, preenche este formulário e anexa a fatura. A Administração irá rever o pedido e devolver-te o valor com respetivo comprovativo.
            </p>
          </div>

          {reimbursementError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{reimbursementError}</span>
            </div>
          )}

          {reimbursementSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
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
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#151e33] bg-slate-50/70 transition-colors text-center">
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
                <div className="h-10 w-10 rounded-full bg-white shadow-clean-sm border border-slate-200 flex items-center justify-center text-[#151e33]">
                  <Upload className="h-5 w-5" />
                </div>
                {reimbursementFile ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileText className="h-3.5 w-3.5" />
                      {reimbursementFile.name} ({(reimbursementFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Clica para substituir o ficheiro
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-[#151e33] hover:underline">
                      Clica para carregar a foto ou PDF da fatura
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Ficheiros PDF ou Imagens PNG/JPG (máx. 25 MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Validação Administrativa:</p>
            <p>
              • Apenas os <strong>Administradores</strong> recebem e aprovam pedidos de reembolso.
            </p>
            <p>
              • Para confirmar a aprovação, a Administração anexa obrigatoriamente o <strong>comprovativo de devolução de dinheiro</strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
    </div>
  );
};
