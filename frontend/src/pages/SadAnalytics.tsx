import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AnimatedProgressBar } from '@/components/ui/AnimatedProgressBar';
import { Button } from '@/components/ui/Button';
import { EvaluationSAD } from '@/types';
import api from '@/lib/api';
import {
  TrendingUp,
  Award,
  Star,
  BarChart3,
  MessageSquareQuote,
  CheckCircle2,
  FileText,
  ExternalLink,
  Download,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
    if (url.startsWith('http')) return url;
    // Serve from backend origin
    return `http://localhost:3001${url}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner (Stagger 1) */}
      <div className="stagger-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#151e33]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#151e33]">
              Avaliação de Desempenho (SAD)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Histórico de médias por quadrimestre (escala 0 a 6 valores), evolução temporal e relatórios oficiais em PDF
          </p>
        </div>

        {/* Term Selector Tabs with Score Badges */}
        {evaluations.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#151e33]/5 p-1.5 rounded-2xl border border-[#151e33]/10 overflow-x-auto max-w-full self-start sm:self-auto">
            {evaluations.map((evalItem) => {
              const isSelected = selectedEvaluation?.id === evalItem.id;
              return (
                <button
                  key={evalItem.id}
                  onClick={() => setSelectedEvaluation(evalItem)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#151e33] text-white shadow-clean-sm scale-105'
                      : 'text-[#151e33]/70 hover:text-[#151e33] hover:bg-white/70'
                  }`}
                >
                  <span>{evalItem.term}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-[#ff63f6] text-[#151e33]'
                        : 'bg-[#151e33]/10 text-[#151e33]'
                    }`}
                  >
                    {Number(evalItem.score).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#151e33]/5 animate-pulse" />
          ))}
        </div>
      ) : !selectedEvaluation ? (
        <Card className="border-[#151e33]/10 shadow-clean-sm text-center py-12">
          <CardContent>
            <BarChart3 className="h-10 w-10 text-[#151e33]/20 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#151e33]">Sem avaliações SAD disponíveis</p>
            <p className="text-xs text-[#151e33]/50 mt-1">
              Os Recursos Humanos irão registar a tua avaliação em breve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Score Cards (Stagger 2) */}
          <div className="stagger-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Overall Historical Average */}
            <div className="clean-card p-5 flex flex-col justify-between group hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#151e33]/70">
                  Média Global Histórica
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#ff63f6]/15 text-[#151e33] flex items-center justify-center font-bold border border-[#ff63f6]/30">
                  <Star className="h-4 w-4 fill-[#ff63f6] text-[#ff63f6]" />
                </div>
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[#151e33]">
                    <AnimatedCounter value={globalAverage} decimals={2} duration={1000} />
                  </span>
                  <span className="text-sm font-bold text-[#151e33]/40">/ 6.00</span>
                </div>
                <div className="mt-2">
                  <AnimatedProgressBar
                    percentage={(globalAverage / 6) * 100}
                    durationMs={1000}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#151e33]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ff63f6]" />
                <span>Média consolidada ({evaluations.length} {evaluations.length === 1 ? 'quadrimestre' : 'quadrimestres'})</span>
              </div>
            </div>

            {/* 2. Selected Term Average */}
            <div className="clean-card p-5 flex flex-col justify-between group hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#151e33]/70">
                  Média do Quadrimestre
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#ff63f6]/15 text-[#ff63f6] flex items-center justify-center border border-[#ff63f6]/30">
                  <Award className="h-4 w-4" />
                </div>
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[#151e33]">
                    <AnimatedCounter value={Number(selectedEvaluation.score)} decimals={2} duration={1000} />
                  </span>
                  <span className="text-sm font-bold text-[#151e33]/40">/ 6.00</span>
                </div>
                <div className="mt-2">
                  <AnimatedProgressBar
                    percentage={(Number(selectedEvaluation.score) / 6) * 100}
                    durationMs={1000}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#151e33]">{selectedEvaluation.term}</span>
                <span className="font-semibold text-[#151e33]/60">Escala: 0 a 6</span>
              </div>
            </div>

            {/* 3. PDF Report Direct Access Card */}
            <div className="clean-card p-5 flex flex-col justify-between bg-gradient-to-br from-white to-[#151e33]/5 border border-[#151e33]/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#151e33]/70">
                  Relatório Oficial PDF
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#151e33]/5 text-[#151e33] flex items-center justify-center border border-[#151e33]/15">
                  <FileText className="h-4 w-4" />
                </div>
              </div>

              <div className="my-2">
                <p className="text-xs text-[#151e33]/70 font-medium line-clamp-2 leading-relaxed">
                  Documento detalhado emitido por Recursos Humanos com notas e parecer qualitativo.
                </p>
              </div>

              <a
                href={getPdfUrl(selectedEvaluation.reportPdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#151e33] hover:bg-[#1c2742] text-white shadow-clean-sm transition-all hover:scale-[1.02] active:scale-95"
              >
                <FileText className="h-3.5 w-3.5 text-[#ff63f6]" />
                <span>Abrir Relatório SAD (PDF)</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Temporal Evolution Chart Card (Stagger 3) */}
          <div className="stagger-3">
            <Card className="border-[#151e33]/10 shadow-clean-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-[#151e33]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-[#151e33] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#ff63f6]" />
                    <span>Evolução Temporal das Médias do SAD</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-[#151e33]/60">
                    Acompanhamento histórico da progressão da tua média ao longo de cada quadrimestre (escala 0 a 6)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#151e33]/5 text-[#151e33]">
                    {progressionData.length} {progressionData.length === 1 ? 'Quadrimestre Avaliado' : 'Quadrimestres Avaliados'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-6 h-[340px]">
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
                        border: '1px solid #151e33/20',
                        borderRadius: '0.75rem',
                        boxShadow: '0 8px 20px -4px rgba(21, 30, 51, 0.1)',
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
              </CardContent>
            </Card>
          </div>

          {/* Feedback & Qualitative Assessment Section (Stagger 4) */}
          <div className="stagger-4">
            <Card className="border-[#151e33]/10 shadow-clean-sm bg-gradient-to-br from-white via-[#151e33]/5 to-white">
              <CardHeader className="pb-3 border-b border-[#151e33]/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-[#ff63f6]" />
                  <CardTitle className="text-base font-bold text-[#151e33]">
                    Parecer Qualitativo de Recursos Humanos ({selectedEvaluation.term})
                  </CardTitle>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#151e33] text-white">
                  Nota: {Number(selectedEvaluation.score).toFixed(2)} / 6.00
                </span>
              </CardHeader>

              <CardContent className="pt-4">
                <blockquote className="text-xs sm:text-sm text-[#151e33] leading-relaxed font-medium italic border-l-2 border-[#ff63f6] pl-4">
                  "{selectedEvaluation.feedbackNotes || 'Excelente compromisso e alinhamento com os objetivos estratégicos da organização ao longo do período avaliado.'}"
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
