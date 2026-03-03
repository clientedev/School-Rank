import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartProps {
  rankings: {
    studentName: string;
    average: number;
    position: number;
  }[];
}

export function PerformanceChart({ rankings }: ChartProps) {
  // Take top 10 for the chart to keep it legible
  const data = rankings.slice(0, 10).map(r => ({
    name: r.studentName.split(' ')[0], // First name only for brevity
    fullName: r.studentName,
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

  // Get primary color from CSS variables (rough approximation for Recharts)
  const primaryColor = "hsl(235, 86%, 65%)";
  const gold = "hsl(43, 74%, 49%)";
  const silver = "hsl(210, 16%, 56%)";
  const bronze = "hsl(28, 39%, 51%)";

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold font-display text-foreground">Top 10 - Desempenho</h3>
        <p className="text-sm text-muted-foreground">Médias gerais dos melhores alunos</p>
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
              domain={[0, 10]}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [`${value}`, 'Média']}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
            />
            <Bar dataKey="Média" radius={[6, 6, 0, 0]}>
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
  );
}
