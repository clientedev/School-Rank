import { TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsProps {
  stats: {
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
  };
}

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Média Geral da Turma</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {stats.classAverage.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-[hsl(var(--rank-1))]/5 blur-2xl group-hover:bg-[hsl(var(--rank-1))]/10 transition-colors duration-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--rank-1))]/10 flex items-center justify-center text-[hsl(var(--rank-1))]">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Maior Média</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {stats.highestAverage.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-destructive/5 blur-2xl group-hover:bg-destructive/10 transition-colors duration-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Menor Média</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {stats.lowestAverage.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
