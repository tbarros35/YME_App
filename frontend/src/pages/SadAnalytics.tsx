import React, { useEffect, useState } from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { EvaluationSAD } from '@/types';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export const SadAnalytics: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationSAD[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationSAD | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSadData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/sad/my');
        const data: EvaluationSAD[] = res.data.evaluations || res.data.data || [];
        setEvaluations(data);
        if (data.length > 0) {
          setSelectedEvaluation(data[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do SAD:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSadData();
  }, []);

  // Compute Overall Global Average across all SAD evaluations
  const globalAverage =
    evaluations.length > 0
      ? Number(
          (
            evaluations.reduce((acc, curr) => acc + Number(curr.score), 0) /
            evaluations.length
          ).toFixed(2)
        )
      : 0;

  // Format chronological progression data (oldest first for left-to-right timeline)
  const progressionData = [...evaluations]
    .reverse()
    .map((e) => ({
      term: e.term,
      score: Number(e.score),
    }));

  const getPdfUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Term Selector Pills (if multiple terms available) */}
      {evaluations.length > 1 && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pl-2">
          {evaluations.map((evalItem) => {
            const isSelected = selectedEvaluation?.id === evalItem.id;
            return (
              <button
                key={evalItem.id}
                onClick={() => setSelectedEvaluation(evalItem)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-[#151e33] text-white shadow-sm scale-105'
                    : 'bg-white text-[#151e33] border border-[#151e33]/10 hover:border-[#ff63f6]'
                )}
              >
                <span>{evalItem.term}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-extrabold',
                    isSelected
                      ? 'bg-[#ff63f6] text-white'
                      : 'bg-[#151e33]/10 text-[#151e33]'
                  )}
                >
                  {Number(evalItem.score).toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] animate-pulse"
            />
          ))}
        </div>
      ) : !selectedEvaluation ? (
        <div className="bg-white rounded-[44px] p-12 text-center shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5">
          <p className="text-base font-bold text-[#151e33]">Sem avaliações SAD disponíveis</p>
          <p className="text-xs sm:text-sm text-[#151e33]/60 mt-1">
            Os Recursos Humanos irão registar a tua avaliação em breve.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Metric Cards matching Menu Principal & Carteira YME */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Card 1: Média Global Histórica */}
            <div className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all">
              {/* Title with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
                  Média Global Histórica
                </h2>
              </div>

              {/* Big Score / Max Value */}
              <div className="my-auto py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#ff63f6] tracking-tight leading-none">
                    <AnimatedCounter value={globalAverage} decimals={2} duration={1000} />
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#151e33]/40 tracking-tight">
                    / 6.00
                  </span>
                </div>
              </div>

              {/* Bottom text */}
              <div>
                <p className="text-xs sm:text-sm text-[#151e33] font-medium">
                  Média consolidada ({evaluations.length}{' '}
                  {evaluations.length === 1 ? 'quadrimestre' : 'quadrimestres'})
                </p>
              </div>
            </div>

            {/* Card 2: Média do Quadrimestre */}
            <div className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all">
              {/* Title with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
                  Média do Quadrimestre
                </h2>
              </div>

              {/* Big Score / Max Value */}
              <div className="my-auto py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#ff63f6] tracking-tight leading-none">
                    <AnimatedCounter
                      value={Number(selectedEvaluation.score)}
                      decimals={2}
                      duration={1000}
                    />
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#151e33]/40 tracking-tight">
                    / 6.00
                  </span>
                </div>
              </div>

              {/* Bottom text */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-[#151e33] font-medium">
                <span>{selectedEvaluation.term}</span>
                <span className="text-[#151e33]/60">Escala: 0 a 6</span>
              </div>
            </div>

            {/* Card 3: Relatório Oficial PDF */}
            <div className="bg-white rounded-[44px] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 min-h-[220px] flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0px_6px_28px_rgba(0,0,0,0.09)] transition-all">
              {/* Title with vertical pink bar */}
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
                  Relatório Oficial PDF
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#151e33] font-normal leading-relaxed my-auto py-3">
                Documento detalhado emitido por Recursos Humanos com notas e parecer qualitativo.
              </p>

              {/* Button */}
              <div className="pt-2">
                <a
                  href={getPdfUrl(selectedEvaluation.reportPdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Abrir Relatório SAD (PDF)
                </a>
              </div>
            </div>
          </div>

          {/* Temporal Evolution Chart Card */}
          <div className="bg-white rounded-[44px] p-8 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                  <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
                    Evolução Temporal das Médias do SAD
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#151e33]/70 font-normal mt-1.5">
                  Acompanhamento histórico da progressão da tua média ao longo de cada quadrimestre (escala 0 a 6)
                </p>
              </div>

              <div className="shrink-0">
                <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#151e33]/5 text-[#151e33] border border-[#151e33]/10">
                  {progressionData.length}{' '}
                  {progressionData.length === 1
                    ? 'Quadrimestre Avaliado'
                    : 'Quadrimestres Avaliados'}
                </span>
              </div>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={progressionData}
                  margin={{ top: 20, right: 30, left: -10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff63f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ff63f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="term"
                    stroke="#94a3b8"
                    tick={{ fill: '#151e33', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 6]}
                    ticks={[0, 1, 2, 3, 4, 5, 6]}
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(21, 30, 51, 0.1)',
                      borderRadius: '1rem',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} / 6.00`, 'Média do SAD']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#151e33"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                    dot={{ r: 5, fill: '#ff63f6', strokeWidth: 2, stroke: '#151e33' }}
                    activeDot={{ r: 7, fill: '#ff63f6', stroke: '#151e33', strokeWidth: 3 }}
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Qualitative Feedback Card */}
          <div className="bg-white rounded-[44px] p-8 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
                  Parecer Qualitativo de Recursos Humanos ({selectedEvaluation.term})
                </h2>
              </div>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-[#151e33] text-white self-start sm:self-auto shrink-0 shadow-sm">
                Nota: {Number(selectedEvaluation.score).toFixed(2)} / 6.00
              </span>
            </div>

            <div className="pt-2">
              <blockquote className="text-xs sm:text-sm text-[#151e33] leading-relaxed font-normal italic border-l-2 border-[#ff63f6] pl-4">
                "{selectedEvaluation.feedbackNotes ||
                  'Excelente compromisso e alinhamento com os objetivos estratégicos da organização ao longo do período avaliado.'}"
              </blockquote>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
