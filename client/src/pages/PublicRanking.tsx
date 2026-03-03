import { useDashboard } from "@/hooks/use-dashboard";
import { RankingsTable } from "@/components/RankingsTable";
import { StatsCards } from "@/components/StatsCards";
import { LayoutDashboard, Trophy, Loader2 } from "lucide-react";

export default function PublicRanking() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-primary gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-medium">Carregando Ranking...</p>
      </div>
    );
  }

  const hasData = data && data.rankings.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-extrabold text-gradient">
              {data?.className || "Ranking da Turma"}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {!hasData ? (
          <p className="text-center py-20 text-muted-foreground">Ranking ainda não disponível.</p>
        ) : (
          <>
            <StatsCards stats={data.stats} />
            <div className="glass-card rounded-3xl p-1 overflow-hidden">
               <RankingsTable 
                  rankings={data.rankings} 
                  activities={data.activities}
                  readonly={true}
                />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
