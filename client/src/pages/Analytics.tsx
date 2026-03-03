import { useDashboard } from "@/hooks/use-dashboard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Loader2, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Link } from "wouter";

export default function Analytics() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-primary gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-medium animate-pulse">Carregando análise de dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold font-display">Análise de Desempenho</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Voltar ao Painel
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Média Geral</h3>
            </div>
            <p className="text-3xl font-black">{(data?.stats.classAverage || 0).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pontuação média da turma</p>
          </div>
          
          <div className="glass-card p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Maior Nota</h3>
            </div>
            <p className="text-3xl font-black">{(data?.stats.highestAverage || 0).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-1">Melhor desempenho individual</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Atividades</h3>
            </div>
            <p className="text-3xl font-black">{data?.activities.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total de atividades avaliadas</p>
          </div>
        </div>

        <div className="p-2 space-y-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 px-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            Evolução e Distribuição
          </h2>
          <PerformanceChart rankings={data?.rankings || []} />
        </div>
      </main>
    </div>
  );
}
