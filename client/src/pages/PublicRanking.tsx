import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api } from "@shared/routes";
import { Trophy, Loader2, Star } from "lucide-react";
import { Link } from "wouter";

export default function PublicRanking() {
  const { classId } = useParams();
  
  const { data, isLoading } = useQuery({
    queryKey: [api.dashboard.path, { classId }],
    queryFn: async () => {
      const res = await fetch(`${api.dashboard.path}?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-primary gap-4 bg-[#0a0a0c]">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Carregando Universo...</p>
      </div>
    );
  }

  const hasData = data && data.rankings.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 pb-20 font-sans selection:bg-primary/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
      
      <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/10">
              <Trophy className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                {data?.className || "Ranking da Turma"}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Arena
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12 relative">
        {!hasData ? (
          <div className="text-center py-40">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
               <Trophy className="w-10 h-10 text-white/20" />
             </div>
             <p className="text-xl font-bold text-white/40">A arena ainda está sendo preparada...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm group hover:border-primary/50 transition-all duration-500">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Média da Arena</div>
                  <div className="text-4xl font-black text-white tracking-tighter">{(data.stats.classAverage || 0).toFixed(1)}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(data.stats.classAverage || 0) * 10}%` }} />
                  </div>
               </div>
               <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm group hover:border-yellow-500/50 transition-all duration-500">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Top Score</div>
                  <div className="text-4xl font-black text-yellow-500 tracking-tighter">{(data.stats.highestAverage || 0).toFixed(1)}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(data.stats.highestAverage || 0) * 10}%` }} />
                  </div>
               </div>
               <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm group hover:border-red-500/50 transition-all duration-500">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Low Score</div>
                  <div className="text-4xl font-black text-red-500 tracking-tighter">{(data.stats.lowestAverage || 0).toFixed(1)}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${(data.stats.lowestAverage || 0) * 10}%` }} />
                  </div>
               </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl opacity-50" />
              <div className="relative bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                   <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                     <Star className="w-5 h-5 text-yellow-500" />
                     Guerreiros da Arena
                   </h2>
                   <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 tracking-widest uppercase">
                     {data.rankings.length} Jogadores
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest w-24">Rank</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Avatar / Nome</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">XP Total</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.rankings.map((r, i) => (
                        <tr key={r.studentId} className="group hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               {i === 0 ? (
                                 <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                   <Trophy className="w-5 h-5 text-yellow-500" />
                                 </div>
                               ) : (
                                 <span className="text-xl font-black text-white/20 group-hover:text-white/60 transition-colors pl-2">#{r.position}</span>
                               )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <Link href={`/student/${r.studentId}`} className="flex items-center gap-4 cursor-pointer group/link">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-lg font-black text-white border border-white/10 group-hover/link:border-primary/50 group-hover/link:scale-110 transition-all duration-300">
                                  {r.studentName.charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-black" />
                              </div>
                              <div>
                                <div className="font-black text-lg tracking-tight group-hover/link:text-primary transition-colors">{r.studentName}</div>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Ativo na Turma</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="text-xl font-black text-white tracking-tighter">{r.totalPoints.toFixed(1)}</div>
                             <div className="text-[10px] font-bold text-primary tracking-widest uppercase">XP Ganhos</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="inline-flex px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-white group-hover:bg-primary group-hover:border-primary transition-all">
                               LVL {Math.floor(r.totalPoints / 10) + 1}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
