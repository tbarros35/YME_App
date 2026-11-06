import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { TimelineEvent, CalendarEvent, EvaluationSAD } from '@/types';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { SupportModal } from '@/components/support/SupportModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sadAverage, setSadAverage] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [nextThreeEvents, setNextThreeEvents] = useState<CalendarEvent[]>([]);
  const [milestones, setMilestones] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardRes, timelineRes, walletRes, eventsRes, sadRes] = await Promise.all([
          api.get('/dashboard/summary').catch(() => ({ data: null })),
          api.get('/timeline').catch(() => ({ data: null })),
          api.get('/wallet/summary').catch(() => ({ data: null })),
          api.get('/calendar').catch(() => ({ data: null })),
          api.get('/sad/my').catch(() => ({ data: null })),
        ]);

        // 1. Average of all SAD evaluations available in the member's account
        const sadList: EvaluationSAD[] = sadRes.data?.evaluations || sadRes.data?.data || [];
        if (sadList.length > 0) {
          const sum = sadList.reduce((acc, curr) => acc + Number(curr.score), 0);
          setSadAverage(Number((sum / sadList.length).toFixed(2)));
        } else if (
          dashboardRes.data?.sadAverage !== undefined &&
          dashboardRes.data?.sadAverage !== null
        ) {
          setSadAverage(Number(dashboardRes.data.sadAverage));
        } else {
          setSadAverage(0);
        }

        // 2. Exact Available Wallet Balance
        const balance =
          walletRes.data?.balance !== undefined
            ? Number(walletRes.data.balance)
            : dashboardRes.data?.balance !== undefined
            ? Number(dashboardRes.data.balance)
            : 0;
        setWalletBalance(balance);

        // 3. Next 3 Scheduled Activities in Calendar (nome da atividade - data - local)
        const allEvents: CalendarEvent[] = eventsRes.data?.events || eventsRes.data?.data || [];
        const now = new Date();
        // Prefer upcoming events (ending today or in the future)
        const upcoming = [...allEvents]
          .filter(
            (e) =>
              new Date(e.endTime || e.startTime).getTime() >=
              now.getTime() - 24 * 60 * 60 * 1000
          )
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

        const selectedEvents = (upcoming.length > 0 ? upcoming : allEvents).slice(0, 3);
        setNextThreeEvents(selectedEvents);

        // 4. Timeline Milestones
        const memberMilestones: TimelineEvent[] =
          timelineRes.data?.timeline || timelineRes.data?.data || [];
        setMilestones(memberMilestones);
      } catch (err) {
        console.error('Erro ao carregar dados dinâmicos do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date as "14 de Novembro"
  const formatCalendarEvent = (evt: CalendarEvent): string => {
    const d = new Date(evt.startTime);
    const day = d.getDate();
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const dateStr = `${day} de ${months[d.getMonth()]}`;
    const location = evt.location?.trim() ? evt.location.trim() : 'Sede da YME';
    return `${evt.title} - ${dateStr} - ${location}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* 2-Column Responsive Grid matching the Figma Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 2 metric cards + 1 wide calendar card (7 Cols on large screens) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Top Row: 2 metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: SAD´s */}
            <div
              onClick={() => navigate('/sad')}
              className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all cursor-pointer group"
            >
              {/* Title with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-2xl font-bold text-[#151e33] tracking-tight">SAD´s</h2>
              </div>

              {/* Center Big Metric: Média de todos os SADs do membro */}
              <div className="my-auto py-3">
                <div className="text-5xl font-black text-[#ff63f6] tracking-tight leading-none">
                  {isLoading ? (
                    <span className="inline-block w-24 h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <AnimatedCounter value={sadAverage} decimals={2} duration={1000} />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#151e33] mt-2.5">
                  Média Global de Avaliações
                </p>
              </div>
            </div>

            {/* Card 2: Carteira YME */}
            <div
              onClick={() => navigate('/wallet')}
              className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all cursor-pointer group"
            >
              {/* Title with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-2xl font-bold text-[#151e33] tracking-tight">Carteira YME</h2>
              </div>

              {/* Center Big Metric: Saldo disponível da carteira */}
              <div className="my-auto py-3">
                <div className="text-5xl font-black text-[#ff63f6] tracking-tight leading-none">
                  {isLoading ? (
                    <span className="inline-block w-24 h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <AnimatedCounter
                      value={walletBalance}
                      decimals={walletBalance % 1 === 0 ? 0 : 2}
                      suffix="€"
                      duration={1000}
                    />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#151e33] mt-2.5">
                  Saldo disponível
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Wide Calendário Card (Próximas 3 Atividades) */}
          <div
            onClick={() => navigate('/calendar')}
            className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] hover:scale-[1.005] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all cursor-pointer group"
          >
            {/* Title with vertical pink bar */}
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
              <h2 className="text-2xl font-bold text-[#151e33] tracking-tight">Calendário</h2>
            </div>

            {/* Event Items List with Bullet Points: "nome da atividade - data - local" */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-5 bg-slate-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : nextThreeEvents.length > 0 ? (
                nextThreeEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-3 text-sm text-[#151e33] font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#151e33] shrink-0" />
                    <span className="truncate">{formatCalendarEvent(evt)}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 text-sm text-[#151e33]/60 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#151e33]/40 shrink-0" />
                  <span>Sem atividades agendadas no calendário de momento.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Tall Member Journey & Support Card (5 Cols on large screens) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[44px] p-8 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 flex flex-col justify-between min-h-[540px]">
            <div>
              {/* Member Name Header with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-2xl font-bold text-[#151e33] tracking-tight">
                  {user?.fullName || 'Tiago Barros'}
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#151e33] mt-2">
                O meu percurso na <span className="text-[#ff63f6] font-bold">YME</span>
              </p>

              {/* Vertical Member Timeline matching Figma Node 20:27 */}
              <div className="relative pl-6 space-y-6 my-7">
                {/* Vertical connecting line */}
                <div className="absolute left-[6.5px] top-2 bottom-3 w-[2px] bg-[#ff63f6]" />

                {milestones.length > 0 ? (
                  milestones.map((m) => (
                    <div key={m.id} className="relative">
                      {/* Node Bullet Dot */}
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#ff63f6] ring-4 ring-white" />
                      <p className="text-xs sm:text-sm font-bold text-[#ff63f6] leading-snug">
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="text-[11px] text-[#151e33] mt-0.5 leading-relaxed font-normal">
                          {m.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="relative">
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#ff63f6] ring-4 ring-white" />
                      <p className="text-xs sm:text-sm font-bold text-[#ff63f6]">
                        Trainee of Brand Strategy
                      </p>
                      <p className="text-[11px] text-[#151e33] mt-0.5 font-normal">
                        Membro do Departamento de Comunicação - Spring Conference 2025
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#ff63f6] ring-4 ring-white" />
                      <p className="text-xs sm:text-sm font-bold text-[#ff63f6]">
                        Junior Consultant of Brand Strategy
                      </p>
                      <p className="text-[11px] text-[#151e33] mt-0.5 font-normal">
                        Membro do Departamento de Comunicação - Spring Conference 2025
                      </p>
                      <p className="text-[11px] text-[#151e33] font-normal">
                        Serviço Tecnibuild
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#ff63f6] ring-4 ring-white" />
                      <p className="text-xs sm:text-sm font-bold text-[#ff63f6]">
                        Head of Brand Strategy
                      </p>
                      <p className="text-[11px] text-[#151e33] mt-0.5 font-normal">
                        Team Leader de Comunicação - WHY ME ´25
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#ff63f6] ring-4 ring-white" />
                      <p className="text-xs sm:text-sm font-bold text-[#ff63f6]">COO</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Support Section (Figma Node 21:47, 21:49, 21:53) */}
            <div className="pt-6 border-t border-[#151e33]/5 mt-auto">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#151e33] uppercase tracking-wider">
                DÚVIDAS OU SUPORTE <span className="text-[#ff63f6]">?</span>
              </h4>
              <p className="text-[11px] text-[#151e33]/80 mt-1 leading-relaxed">
                Contacta um membro de Legal ou de RH! A ExBo faz o acompanhamento de todos os pedidos
              </p>
              <button
                onClick={() => setIsSupportOpen(true)}
                className="mt-4 px-8 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Abrir Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Support Modal for "Abrir Chat" */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};
