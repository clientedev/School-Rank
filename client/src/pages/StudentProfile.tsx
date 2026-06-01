import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Trophy, Star, History, TrendingUp, Zap, Shield, Target, Award, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import { useStudentAttendance } from "@/hooks/use-attendance";

export default function StudentProfile() {
  const { id } = useParams();

  // Get classId from query param or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const classIdQuery = urlParams.get("classId");
  const classId = classIdQuery ? Number(classIdQuery) : Number(localStorage.getItem("classId"));

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [`/api/students/${id}/logs`],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  const { data: dashboardData, isLoading: dashLoading } = useDashboard(classId || 0);

  const { data: attendanceData, isLoading: attLoading } = useStudentAttendance(Number(id));

  if (logsLoading || dashLoading || attLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
          <span className="text-purple-300 font-bold tracking-widest text-sm uppercase">Carregando...</span>
        </div>
      </div>
    );
  }

  const student = dashboardData?.rankings.find((r: any) => r.studentId === Number(id));

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
        <div className="text-center text-white">
          <Swords className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-black">Jogador não encontrado</h2>
        </div>
      </div>
    );
  }

  const level = Math.floor(student.totalPoints / 10) + 1;
  const xpProgress = (student.totalPoints % 10) * 10;
  const getRankLabel = (pos: number) => {
    if (pos === 1) return { label: "Lendário", color: "#FFD700", icon: "👑" };
    if (pos === 2) return { label: "Diamante", color: "#b9f2ff", icon: "💎" };
    if (pos === 3) return { label: "Ouro", color: "#FFA500", icon: "🥇" };
    if (pos <= 5) return { label: "Platina", color: "#a78bfa", icon: "⚡" };
    if (pos <= 10) return { label: "Prata", color: "#94a3b8", icon: "🛡️" };
    return { label: "Bronze", color: "#cd7f32", icon: "🎯" };
  };

  const rankInfo = getRankLabel(student.position);
  const totalActivities = student.grades.length;
  const bestGrade = student.grades.length > 0 ? Math.max(...student.grades.map((g: any) => g.value)) : 0;
  const worstGrade = student.grades.length > 0 ? Math.min(...student.grades.map((g: any) => g.value)) : 0;

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        .gamer-font { font-family: 'Orbitron', monospace; }
        .neon-glow { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2); }
        .neon-glow-gold { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.2); }
        .card-gamer { 
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(139, 92, 246, 0.3); 
          backdrop-filter: blur(10px); 
        }
        .xp-bar { 
          height: 8px; 
          background: rgba(255,255,255,0.1); 
          border-radius: 99px; 
          overflow: hidden; 
        }
        .xp-fill { 
          height: 100%; 
          background: linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd); 
          border-radius: 99px; 
          transition: width 1s ease; 
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.8); 
        }
        .stat-card { 
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 16px; 
          padding: 16px; 
          text-align: center; 
          transition: all 0.3s; 
        }
        .stat-card:hover { 
          border-color: rgba(139, 92, 246, 0.5); 
          background: rgba(139, 92, 246, 0.1); 
          transform: translateY(-2px); 
        }
        .grade-row { 
          background: rgba(255,255,255,0.04); 
          border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 12px; 
          padding: 12px 16px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          transition: all 0.3s; 
        }
        .grade-row:hover { 
          background: rgba(139, 92, 246, 0.15); 
          border-color: rgba(139, 92, 246, 0.4); 
        }
        .log-row { 
          background: rgba(255,255,255,0.04); 
          border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 12px; 
          padding: 14px 16px; 
          transition: all 0.3s; 
        }
        .log-row:hover { 
          background: rgba(139, 92, 246, 0.1); 
        }
        .pulse-ring {
          animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        .scanlines::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px);
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero Card */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 neon-glow scanlines"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(17,24,39,0.8) 50%, rgba(49,46,129,0.3) 100%)", border: "1px solid rgba(139,92,246,0.4)" }}
        >
          {/* BG decorations */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <Trophy className="w-64 h-64 text-yellow-400" style={{ transform: "rotate(15deg) translate(30px, -30px)" }} />
          </div>
          <div className="absolute bottom-0 left-0 opacity-5 pointer-events-none">
            <Zap className="w-48 h-48 text-purple-400" style={{ transform: "rotate(-15deg) translate(-20px, 20px)" }} />
          </div>

          <div className="relative z-10">
            {/* Avatar + Info */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-5xl font-black pulse-ring"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontFamily: "Orbitron, monospace" }}
                >
                  {student.studentName.charAt(0).toUpperCase()}
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "linear-gradient(135deg, #1a1a2e, #302b63)", border: "2px solid rgba(139,92,246,0.6)" }}
                >
                  {rankInfo.icon}
                </div>
              </div>

              <div className="text-center md:text-left flex-1">
                <div className="text-purple-400 text-xs font-bold tracking-[0.3em] uppercase mb-1 gamer-font">Perfil do Jogador</div>
                <h1 className="text-4xl md:text-5xl font-black text-white gamer-font tracking-tight leading-none mb-3">
                  {student.studentName}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest gamer-font"
                    style={{ background: `${rankInfo.color}22`, color: rankInfo.color, border: `1px solid ${rankInfo.color}44` }}
                  >
                    {rankInfo.label}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest gamer-font" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)" }}>
                    ⭐ Nível {level}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest gamer-font" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                    🏆 #{student.position} Rank
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-1 gamer-font">XP Total</div>
                <div className="text-6xl font-black gamer-font" style={{ color: "#a78bfa", textShadow: "0 0 20px rgba(167,139,250,0.8)" }}>
                  {student.totalPoints.toFixed(1)}
                </div>
                <div className="text-purple-400/60 text-xs">pontos</div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-purple-400 text-xs font-bold tracking-widest uppercase gamer-font">XP p/ próximo nível</span>
                <span className="text-purple-300 text-xs font-bold gamer-font">{xpProgress}% completo</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <Target className="w-6 h-6 mx-auto mb-2" style={{ color: "#a78bfa" }} />
            <div className="text-2xl font-black text-white gamer-font">{totalActivities}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Atividades</div>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: "#34d399" }} />
            <div className="text-2xl font-black text-white gamer-font">{student.average?.toFixed(2) ?? "-"}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Média</div>
          </div>
          <div className="stat-card">
            <Award className="w-6 h-6 mx-auto mb-2" style={{ color: "#FFD700" }} />
            <div className="text-2xl font-black text-white gamer-font">{bestGrade.toFixed(1)}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Melhor Nota</div>
          </div>
          <div className="stat-card">
            <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: "#f87171" }} />
            <div className="text-2xl font-black text-white gamer-font">{worstGrade.toFixed(1)}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Menor Nota</div>
          </div>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frequência (Novo) */}
          <div className="card-gamer rounded-2xl overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)" }}>
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-white gamer-font text-sm uppercase tracking-wider">Faltas & Atrasos</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {attendanceData && attendanceData.length > 0 ? (
                attendanceData.map((att: any) => (
                  <div key={att.id} className="log-row flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold mb-1">
                        {att.status === 'F' ? 'Falta Registrada' : 'Atraso Registrado'}
                      </div>
                      <div className="text-xs px-2 py-1 inline-block rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                        {att.date.split('-').reverse().join('/')}
                      </div>
                    </div>
                    <div className="text-xl font-black gamer-font" style={{ color: att.status === 'F' ? '#f87171' : '#f59e0b' }}>
                      {att.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 italic">Frequência perfeita!</div>
              )}
            </div>
          </div>

          {/* Grades */}
          <div className="card-gamer rounded-2xl overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                  <Swords className="w-5 h-5" style={{ color: "#a78bfa" }} />
                </div>
                <h3 className="font-bold text-white gamer-font text-sm uppercase tracking-wider">Missões & Notas</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {student.grades.length > 0 ? (
                student.grades.map((grade: any) => {
                  const pct = Math.min((grade.value / 10) * 100, 100);
                  return (
                    <div key={grade.gradeId} className="grade-row">
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">{grade.activityName}</div>
                        <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: grade.value >= 7 ? "linear-gradient(90deg,#34d399,#6ee7b7)" : grade.value >= 5 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#f87171,#fca5a5)"
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className="ml-4 text-xl font-black gamer-font"
                        style={{ color: grade.value >= 7 ? "#34d399" : grade.value >= 5 ? "#f59e0b" : "#f87171" }}
                      >
                        {grade.value}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">Nenhuma nota registrada.</div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="card-gamer rounded-2xl overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                  <History className="w-5 h-5" style={{ color: "#a78bfa" }} />
                </div>
                <h3 className="font-bold text-white gamer-font text-sm uppercase tracking-wider">Log de Eventos</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <div key={log.id} className="log-row">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="font-black text-base gamer-font"
                        style={{ color: log.points >= 0 ? "#34d399" : "#f87171" }}
                      >
                        {log.points >= 0 ? "+" : ""}{log.points} XP
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                        {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{log.reason}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 italic">Nenhum evento registrado.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}