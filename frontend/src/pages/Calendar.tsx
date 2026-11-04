import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarCategoryBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { CalendarEvent, CalendarCategory } from '@/types';
import api from '@/lib/api';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
  Search,
  CalendarCheck2,
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
    { label: 'Formações & Workshops', value: 'FORMATION' },
    { label: 'Team Building & Social', value: 'TEAMBUILDING' },
    { label: 'Prazos & Deadlines', value: 'DEADLINE' },
    { label: '👥 Atividades de RH', value: 'HR_ACTIVITY' },
    { label: '🌱 Atividades de RSC (CSR)', value: 'CSR_ACTIVITY' },
    { label: '🤝 Open Days', value: 'OPEN_DAY' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-[#151e33]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#151e33]">
              Calendário de Atividades
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Agenda oficial de assembleias, formações, marcos de projetos, iniciativas de CSR, parcerias e team buildings
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative self-start sm:self-auto">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar evento ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-8 pr-4 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#151e33] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? 'bg-[#151e33] text-white shadow-clean-sm font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-[#151e33]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="border-slate-200 shadow-clean-sm text-center py-16">
          <CardContent>
            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Nenhum evento encontrado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Não foram encontrados eventos que correspondam aos filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setActiveModalEvent(evt)}
              className="clean-card-interactive p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Date Tile + Category Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
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

                {/* Event Title & Description */}
                <h3 className="text-sm font-bold text-[#151e33] group-hover:text-black line-clamp-1 mb-1">
                  {evt.title}
                </h3>
                {evt.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {evt.description}
                  </p>
                )}
              </div>

              {/* Event Location & Time */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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

                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
          description="Detalhes da sessão e localização"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <CalendarCategoryBadge category={activeModalEvent.category} />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Clock className="h-4 w-4 text-[#151e33]" />
                <span>
                  {new Date(activeModalEvent.startTime).toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 pl-6">
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

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <MapPin className="h-4 w-4 text-[#151e33]" />
                <span>Localização:</span>
              </div>
              <p className="text-slate-600 pl-6 font-medium">
                {activeModalEvent.location || 'Sede da YME'}
              </p>
              <div className="pl-6 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeModalEvent.location || 'YME'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#151e33] font-bold hover:underline"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {activeModalEvent.description && (
              <div>
                <h4 className="font-bold text-[#151e33] mb-1">Sobre a Atividade:</h4>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {activeModalEvent.description}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold"
                onClick={() => setActiveModalEvent(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
