import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie } from 'recharts';

interface ChartProps {
  rankings: {
    studentName: string;
    average: number;
    totalPoints: number;
    position: number;
  }[];
}

export function PerformanceChart({ rankings }: ChartProps) {
  // Take top 10 for the chart to keep it legible
  const data = rankings.slice(0, 10).map(r => ({
    name: r.studentName.split(' ')[0], // First name only for brevity
    fullName: r.studentName,
    Pontos: r.totalPoints,
    Média: Number(r.average.toFixed(2)),
    position: r.position
  }));

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-6 h-80 flex items-center justify-center">
        <p className="text-muted-foreground">Sem dados para exibir o gráfico.</p>
      </div>
    );
  }

  const primaryColor = "hsl(235, 86%, 65%)";
  const gold = "hsl(43, 74%, 49%)";
  const silver = "hsl(210, 16%, 56%)";
  const bronze = "hsl(28, 39%, 51%)";

  // Distribution for Pie Chart
  const distribution = [
    { name: 'Excelente (90+)', value: rankings.filter(r => r.average >= 90).length, fill: gold },
    { name: 'Bom (70-89)', value: rankings.filter(r => r.average >= 70 && r.average < 90).length, fill: primaryColor },
    { name: 'Regular (50-69)', value: rankings.filter(r => r.average >= 50 && r.average < 70).length, fill: silver },
    { name: 'Abaixo (0-49)', value: rankings.filter(r => r.average < 50).length, fill: bronze },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold font-display text-foreground">Top 10 - Pontuação Total</h3>
          <p className="text-sm text-muted-foreground">Classificação baseada em pontos acumulados</p>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [`${value}`, 'Pontos']}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
              />
              <Bar dataKey="Pontos" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => {
                  let color = primaryColor;
                  if (entry.position === 1) color = gold;
                  else if (entry.position === 2) color = silver;
                  else if (entry.position === 3) color = bronze;
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-display text-foreground">Distribuição de Notas</h3>
            <p className="text-sm text-muted-foreground">Frequência de desempenho por faixa</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {distribution.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-display text-foreground">Resumo de Engajamento</h3>
            <p className="text-sm text-muted-foreground">Top alunos por atividade</p>
          </div>
          <div className="space-y-4">
             {rankings.slice(0, 5).map((r, i) => (
               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-primary w-4">{i+1}º</span>
                    <span className="text-sm font-bold">{r.studentName}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-primary">{r.totalPoints} pts</span>
                    <span className="text-[10px] text-muted-foreground">Média: {r.average.toFixed(1)}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
