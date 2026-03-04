import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherClasses from "@/pages/TeacherClasses";
import PublicRanking from "@/pages/PublicRanking";
import StudentProfile from "@/pages/StudentProfile";
import Analytics from "@/pages/Analytics";
import Attendance from "@/pages/Attendance";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogOut, RefreshCw, GraduationCap, Lock, Mail } from "lucide-react";

function Login({ onLogin }: { onLogin: (teacherId: number) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      const data = await res.json();
      onLogin(data.teacherId);
    } catch (e) {
      toast({ title: "Erro", description: "Usuário ou senha inválida", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[120px]"></div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl">
        <div className="h-3 bg-gradient-to-r from-primary via-violet-500 to-indigo-500"></div>
        <CardHeader className="space-y-4 pb-8 pt-10 px-10">
          <div className="flex justify-center flex-col items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-3xl text-primary shadow-inner">
              <GraduationCap className="h-10 w-10" />
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">
                School-Rank
              </CardTitle>
              <p className="text-slate-500 font-medium mt-1">Gestão de notas e desempenho</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-10 pb-10">
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase text-slate-400 ml-1">Usuário / Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="admin@escola.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-base focus-visible:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase text-slate-400 ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-base focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center gap-2 bg-slate-900"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Acessando..." : "Entrar no Painel"}
          </Button>
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">SISTEMA EDUCACIONAL</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const [teacherId, setTeacherId] = useState<number | null>(() => {
    const saved = localStorage.getItem("teacherId");
    return saved ? Number(saved) : null;
  });
  const [classId, setClassId] = useState<number | null>(() => {
    const saved = localStorage.getItem("classId");
    return saved ? Number(saved) : null;
  });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      if (teacherId && !isPublicRoute) {
        try {
          const res = await fetch("/api/me", { credentials: "include" });
          if (res.status === 401) {
            setTeacherId(null);
            localStorage.removeItem("teacherId");
            localStorage.removeItem("classId");
            setLocation("/");
          }
        } catch (e) {
          console.error("Session check failed", e);
        }
      }
    };
    checkSession();
  }, [teacherId, location]);


  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      setTeacherId(null);
      setClassId(null);
      localStorage.removeItem("teacherId");
      localStorage.removeItem("classId");
      window.location.href = "/";
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleSelectClass = (id: number) => {
    setClassId(id);
    localStorage.setItem("classId", id.toString());
  };

  const handleBackToClasses = () => {
    setClassId(null);
    localStorage.removeItem("classId");
  };

  const isPublicRoute = location.startsWith("/ranking/") || location.startsWith("/student/");

  if (!teacherId && !isPublicRoute) {
    return <Login onLogin={(id) => {
      setTeacherId(id);
      localStorage.setItem("teacherId", id.toString());
    }} />;
  }

  // Admin routing
  if (teacherId === -1 && !isPublicRoute) {
    if (classId) {
      return (
        <div className="relative">
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <Button variant="outline" size="lg" className="shadow-2xl bg-white rounded-2xl border-none font-bold text-slate-700" onClick={handleBackToClasses}>
              <RefreshCw className="w-5 h-5 mr-2 text-primary" />
              Trocar Turma
            </Button>
            <Button variant="destructive" size="lg" className="shadow-2xl rounded-2xl font-bold border-none" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </Button>
          </div>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/frequencia" component={Attendance} />
            <Route component={NotFound} />
          </Switch>
        </div>
      );
    }
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Teacher routing
  if (teacherId && !classId && !isPublicRoute) {
    return <TeacherClasses onSelect={handleSelectClass} onLogout={handleLogout} />;
  }

  return (
    <div className="relative">
      {teacherId && !isPublicRoute && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {classId && (
            <Button
              variant="outline"
              size="lg"
              className="shadow-2xl bg-white rounded-2xl border-none font-bold text-slate-700"
              onClick={handleBackToClasses}
            >
              <RefreshCw className="w-5 h-5 mr-2 text-violet-600" />
              Trocar Turma
            </Button>
          )}
          <Button
            variant="destructive"
            size="lg"
            className="shadow-2xl rounded-2xl font-bold border-none"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </Button>
        </div>
      )}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/frequencia" component={Attendance} />
        <Route path="/ranking/:classId" component={PublicRanking} />
        <Route path="/student/:id" component={StudentProfile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

