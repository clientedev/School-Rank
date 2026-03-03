import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Trophy, Star, History, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const classId = localStorage.getItem("classId");

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [`/api/students/${id}/logs`],
  });

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: [api.dashboard.path, { classId }],
    queryFn: async () => {
      const res = await fetch(`${api.dashboard.path}?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    }
  });

  if (logsLoading || dashLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const student = dashboardData?.rankings.find((r: any) => r.studentId === Number(id));

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Aluno não encontrado</h2>
        <Button onClick={() => setLocation("/")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Button>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-violet-500/10 p-8 border border-primary/20">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-xl">
              {student.studentName.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black font-display tracking-tight">{student.studentName}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 font-bold text-sm">
                  <Star className="w-4 h-4 fill-yellow-600" /> Nível {Math.floor(student.totalPoints / 10) + 1}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-sm">
                  <Trophy className="w-4 h-4" /> Rank #{student.position}
                </div>
              </div>
            </div>
            <div className="md:ml-auto text-center">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total de Pontos</div>
              <div className="text-5xl font-black text-primary">{student.totalPoints.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-2 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Notas por Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.grades.map((grade: any) => (
                  <div key={grade.gradeId} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                    <span className="font-bold">{grade.activityName}</span>
                    <span className="text-xl font-black text-primary">{grade.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <CardTitle>Histórico de Ajustes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => (
                    <div key={log.id} className="flex flex-col p-4 rounded-2xl bg-muted/50 border border-border">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${log.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.points >= 0 ? '+' : ''}{log.points} pontos
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm mt-1">{log.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground italic">Nenhum ajuste registrado.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}