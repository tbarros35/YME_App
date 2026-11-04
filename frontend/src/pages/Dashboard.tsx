import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TimelineCategoryBadge } from '@/components/ui/Badge';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AnimatedProgressBar } from '@/components/ui/AnimatedProgressBar';
import { TimelineEvent, DashboardSummary, WalletSummary, CalendarEvent } from '@/types';
import api from '@/lib/api';
import {
  Compass,
  TrendingUp,
  Wallet,
  Calendar as CalendarIcon,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  Briefcase,
  Users,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupportModal } from '@/components/support/SupportModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardRes, timelineRes, walletRes, eventsRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/timeline'),
          api.get('/wallet/summary'),
          api.get('/calendar'),
        ]);

        setSummary(dashboardRes.data.data || null);
        setMilestones(timelineRes.data.data || []);
        setWallet(walletRes.data.data || null);
        setUpcomingEvents(eventsRes.data.data?.slice(0, 3) || []);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getMilestoneIcon = (category: string) => {
    switch (category) {
      case 'RECRUITMENT':
        return <Users className="h-4 w-4 text-[#151e33]" />;
      case 'PROJECT':
        return <Briefcase className="h-4 w-4 text-[#ff6ef6]" />;
      case 'TASKGROUP':
        return <Compass className="h-4 w-4 text-purple-600" />;
      case 'FORMATION':
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case 'AWARD':
      default:
        return <Award className="h-4 w-4 text-amber-600" />;
    }
  };

  const filteredMilestones = milestones.filter((m) => {
    if (filterType === 'all') return true;
    return m.category === filterType;
  });

  const sadAverage =
    summary?.sadAverage !== null && summary?.sadAverage !== undefined
      ? summary.sadAverage
      : summary?.latestSad
      ? summary.latestSad.score
      : 0;
  const sadPercentage = (sadAverage / 6) * 100;
  const walletBalance = wallet ? wallet.balance : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner (Stagger 1) */}
      <div className="stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#151e33] via-[#1c2742] to-[#151e33] text-white p-6 sm:p-8 shadow-clean-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#ff6ef6]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#ff6ef6] animate-pulse" />
              <span>{user?.department?.name || 'Membro da YME'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {user?.fullName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Bem-vindo à tua área pessoal na <span className="text-white font-bold">YME APP</span>. Acompanha a tua evolução no SAD, saldo em carteira e marcos na organização.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              className="h-10 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform"
              onClick={() => navigate('/sad')}
            >
              <TrendingUp className="h-4 w-4 mr-1.5" />
              <span>Ver Minha Avaliação</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 active:scale-95 transition-transform"
              onClick={() => navigate('/wallet')}
            >
              <Wallet className="h-4 w-4 mr-1.5" />
              <span>Carteira Virtual</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid (Stagger 2) */}
      <div className="stagger-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SAD Metric */}
        <div
          onClick={() => navigate('/sad')}
          className="clean-card-interactive p-5 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Média Avaliação SAD
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#151e33] group-hover:bg-[#151e33] group-hover:text-white transition-all">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#151e33]">
                <AnimatedCounter value={sadAverage} decimals={2} duration={1200} />
              </span>
              <span className="text-xs font-bold text-slate-400">/ 6.00</span>
            </div>
            <div className="mt-2">
              <AnimatedProgressBar percentage={sadPercentage} durationMs={1200} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {summary?.totalSadCount
                ? `Média de ${summary.totalSadCount} ${
                    summary.totalSadCount === 1 ? 'quadrimestre' : 'quadrimestres'
                  }`
                : 'Sem histórico'}
            </span>
            <span className="text-[#151e33] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              Detalhes <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Wallet Metric */}
        <div
          onClick={() => navigate('/wallet')}
          className="clean-card-interactive p-5 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saldo YME Wallet
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#ff6ef6] group-hover:bg-[#ff6ef6] group-hover:text-[#151e33] transition-all">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-extrabold text-[#151e33]">
              <AnimatedCounter value={walletBalance} decimals={2} suffix=" €" duration={1200} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Disponível para reembolsos e atividades
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <span>{wallet?.transactions?.length || 0} Movimentos</span>
            <span className="text-[#151e33] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              Extrato <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Milestones Metric */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Marcos Concluídos
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#151e33]">
              <Award className="h-4 w-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-extrabold text-[#151e33]">
              <AnimatedCounter value={milestones.length} duration={1000} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Etapas e conquistas na organização
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-2 border-t border-slate-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Jornada Ativa</span>
          </div>
        </div>

        {/* Next Event Metric */}
        <div
          onClick={() => navigate('/calendar')}
          className="clean-card-interactive p-5 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Próximo Evento
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#151e33] group-hover:bg-[#151e33] group-hover:text-white transition-all">
              <CalendarIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="my-3">
            {upcomingEvents.length > 0 ? (
              <div>
                <p className="text-sm font-bold text-[#151e33] line-clamp-1">
                  {upcomingEvents[0].title}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(upcomingEvents[0].startTime).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-500">Sem eventos agendados</p>
                <p className="text-xs text-slate-400 mt-1">Consulta o calendário</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <span>Agenda Geral</span>
            <span className="text-[#151e33] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              Ver Tudo <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Timeline Journey (Left) + Quick Upcoming (Right) (Stagger 3) */}
      <div className="stagger-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chronological Journey Timeline (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-clean-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#151e33]" />
                  <CardTitle className="text-lg font-bold text-[#151e33]">
                    Minha Jornada YME
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Linha cronológica de conquistas, projetos e marcos associativos
                </CardDescription>
              </div>

              {/* Filter Pills */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['all', 'PROJECT', 'FORMATION', 'AWARD'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all uppercase ${
                      filterType === type
                        ? 'bg-white text-[#151e33] shadow-sm font-bold scale-105'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {type === 'all' ? 'Todos' : type}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4 py-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredMilestones.length === 0 ? (
                <div className="text-center py-12">
                  <Compass className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Sem marcos registados</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Os teus marcos serão adicionados conforme a tua evolução na YME.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredMilestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="relative group transition-all duration-300 animate-scale-in"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      {/* Node Indicator */}
                      <div className="absolute -left-6 sm:-left-8 top-1 h-6 w-6 rounded-full bg-white border-2 border-[#151e33] flex items-center justify-center shadow-sm group-hover:border-[#ff6ef6] group-hover:scale-125 transition-all">
                        <div className="h-2 w-2 rounded-full bg-[#151e33] group-hover:bg-[#ff6ef6] transition-colors" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-slate-50/80 hover:bg-white p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-clean-sm group-hover:translate-x-1 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-white border border-slate-200">
                              {getMilestoneIcon(milestone.category)}
                            </span>
                            <h4 className="text-sm font-bold text-[#151e33]">
                              {milestone.title}
                            </h4>
                            <TimelineCategoryBadge category={milestone.category} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                            {new Date(milestone.eventDate).toLocaleDateString('pt-PT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pl-7">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Quick Upcoming Events & Fast Links */}
        <div className="space-y-6">
          {/* Upcoming Events Card */}
          <Card className="border-slate-200 shadow-clean-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#151e33]" />
                <CardTitle className="text-sm font-bold text-[#151e33]">
                  Eventos Próximos
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                className="h-7 text-xs text-[#151e33] p-0 font-semibold hover:underline"
                onClick={() => navigate('/calendar')}
              >
                Ver Calendário
              </Button>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Não existem eventos programados.
                </p>
              ) : (
                upcomingEvents.map((evt, idx) => (
                  <div
                    key={evt.id}
                    onClick={() => navigate('/calendar')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-clean-sm hover:-translate-y-0.5 transition-all cursor-pointer group animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Date Badge */}
                      <div className="h-12 w-12 rounded-xl bg-[#151e33] text-white flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-[9px] uppercase font-bold text-[#ff6ef6] leading-none">
                          {new Date(evt.startTime).toLocaleDateString('pt-PT', { month: 'short' })}
                        </span>
                        <span className="text-base font-extrabold leading-none mt-0.5">
                          {new Date(evt.startTime).getDate()}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-[#151e33] group-hover:text-black line-clamp-1">
                          {evt.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {evt.location || 'Sede da YME'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Interactive Quick Help Card */}
          <div
            onClick={() => setIsSupportOpen(true)}
            className="rounded-2xl bg-gradient-to-br from-[#fff0fd] via-white to-slate-50 p-5 border border-[#ff6ef6]/40 shadow-clean-sm hover:shadow-md hover:border-[#ff6ef6] hover:scale-[1.01] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#d81bb0]">
                <Sparkles className="h-4 w-4 animate-spin-slow" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  Dúvidas ou Suporte?
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#ff6ef6]/20 text-[#d81bb0] border border-[#ff6ef6]/30 group-hover:bg-[#151e33] group-hover:text-white transition-all">
                Abrir Chat
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Precisas de ajustar uma avaliação de SAD, esclarecer movimentos na tua carteira ou falar com a Executive Board?
            </p>
            <div className="mt-3 pt-2.5 border-t border-[#ff6ef6]/20 flex items-center justify-between text-xs font-bold text-[#151e33]">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <MessageSquare className="h-3.5 w-3.5 text-[#ff6ef6]" />
                RH • Legal & Finance • Direção
              </span>
              <span className="group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-xs text-[#151e33]">
                Submeter Dúvida <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Support & Chat Center Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};

