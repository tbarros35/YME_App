import React, { useEffect, useState } from 'react';
import { CalendarCategoryBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { CalendarEvent } from '@/types';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  MapPin,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react';

export const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeModalEvent, setActiveModalEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/calendar');
        setEvents(res.data.events || res.data.data || []);
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesCat = selectedCategory === 'ALL' || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories: { label: string; value: string }[] = [
    { label: 'Todos os Eventos', value: 'ALL' },
    { label: 'Assembleias Gerais', value: 'GENERAL_ASSEMBLY' },
    { label: 'Reuniões Gerais', value: 'GENERAL_MEETING' },
    { label: 'Formações & Workshops', value: 'FORMATION' },
    { label: '👥 Atividades de RH', value: 'HR_ACTIVITY' },
    { label: '🌱 Atividades de RSC (CSR)', value: 'CSR_ACTIVITY' },
    { label: '🤝 Open Days', value: 'OPEN_DAY' },
    { label: 'Outros', value: 'OTHER' },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#151e33] tracking-tight">
              Calendário de Atividades
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#151e33]/70 font-normal mt-1.5 pl-[15.5px]">
            Agenda oficial de assembleias, formações, marcos de projetos, iniciativas de RSC, parcerias e team buildings
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative self-start sm:self-auto w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#151e33]/40" />
          <input
            type="text"
            placeholder="Pesquisar evento ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 pr-4 text-xs rounded-full border border-[#151e33]/15 bg-white focus:outline-none focus:border-[#ff63f6] focus:ring-1 focus:ring-[#ff63f6] text-[#151e33] w-full shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                'px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer select-none text-xs',
                isSelected
                  ? 'bg-[#151e33] text-white shadow-sm scale-105'
                  : 'bg-white text-[#151e33] border border-[#151e33]/10 hover:border-[#ff63f6]'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[240px] animate-pulse"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-[44px] p-12 text-center shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5">
          <p className="text-base font-bold text-[#151e33]">Nenhum evento encontrado</p>
          <p className="text-xs sm:text-sm text-[#151e33]/60 mt-1 max-w-sm mx-auto">
            Não foram encontrados eventos que correspondam aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setActiveModalEvent(evt)}
              className="bg-white rounded-[44px] p-7 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[250px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all cursor-pointer group"
            >
              <div>
                {/* Card Top: Date Tile + Category Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#151e33] text-white flex flex-col items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-[10px] uppercase font-bold text-[#ff63f6] leading-none">
                      {new Date(evt.startTime).toLocaleDateString('pt-PT', { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold leading-none mt-0.5">
                      {new Date(evt.startTime).getDate()}
                    </span>
                  </div>

                  <CalendarCategoryBadge category={evt.category} />
                </div>

                {/* Event Title with Vertical Pink Bar */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-[3px] h-[16px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-[#151e33] tracking-tight group-hover:text-[#ff63f6] transition-colors truncate">
                    {evt.title}
                  </h3>
                </div>

                {/* Event Description */}
                {evt.description && (
                  <p className="text-xs sm:text-sm text-[#151e33]/70 line-clamp-2 leading-relaxed font-normal pl-[11px]">
                    {evt.description}
                  </p>
                )}
              </div>

              {/* Event Location & Time */}
              <div className="pt-4 mt-4 border-t border-[#151e33]/10 flex flex-col gap-2 text-xs text-[#151e33] font-medium">
                <div className="flex items-center gap-2 truncate">
                  <Clock className="h-3.5 w-3.5 text-[#ff63f6] shrink-0" />
                  <span>
                    {new Date(evt.startTime).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(evt.endTime).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 text-[#ff63f6] shrink-0" />
                  <span className="truncate">{evt.location || 'Sede da YME'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Dialog Modal */}
      {activeModalEvent && (
        <Dialog
          isOpen={!!activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
          title={activeModalEvent.title}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <CalendarCategoryBadge category={activeModalEvent.category} />
            </div>

            <div className="p-4 rounded-2xl bg-[#151e33]/5 border border-[#151e33]/10 space-y-2">
              <div className="flex items-center gap-2 text-[#151e33] font-bold">
                <Clock className="h-4 w-4 text-[#ff63f6]" />
                <span>
                  {new Date(activeModalEvent.startTime).toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#151e33]/80 pl-6 font-medium">
                <span>
                  Das{' '}
                  {new Date(activeModalEvent.startTime).toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  às{' '}
                  {new Date(activeModalEvent.endTime).toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#151e33]/5 border border-[#151e33]/10 space-y-1">
              <div className="flex items-center gap-2 text-[#151e33] font-bold">
                <MapPin className="h-4 w-4 text-[#ff63f6]" />
                <span>Localização:</span>
              </div>
              <p className="text-[#151e33]/80 pl-6 font-medium">
                {activeModalEvent.location || 'Sede da YME'}
              </p>
              <div className="pl-6 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeModalEvent.location || 'YME'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#ff63f6] font-bold hover:underline"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {activeModalEvent.description && (
              <div className="p-4 rounded-2xl bg-[#151e33]/5 border border-[#151e33]/10">
                <h4 className="font-bold text-[#151e33] mb-1">Sobre a Atividade:</h4>
                <p className="text-[#151e33]/80 leading-relaxed font-normal">
                  {activeModalEvent.description}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="w-full py-2.5 rounded-full bg-[#151e33] hover:bg-[#1c2742] text-white text-xs font-bold shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
