import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PublicRanking from "@/pages/PublicRanking";
import StudentProfile from "@/pages/StudentProfile";
import Analytics from "@/pages/Analytics";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Login({ onLogin }: { onLogin: (teacherId: number) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      const data = await res.json();
      onLogin(data.teacherId);
    } catch (e) {
      toast({ title: "Erro", description: "Usuário ou senha inválida", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <span className="text-3xl">👨‍🏫</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center tracking-tight">
            Minha Turma
          </CardTitle>
          <p className="text-center text-muted-foreground">Gestão de notas e desempenho</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input 
              placeholder="Usuário ou Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <Button className="w-full h-12 text-lg font-semibold mt-2 shadow-lg hover:shadow-primary/20 transition-all" onClick={handleLogin}>
            Acessar Sistema
          </Button>
        </CardContent>
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Acesso restrito a professores</p>
        </div>
      </Card>
    </div>
  );
}

function AdminPanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleCreateTeacher = async () => {
    try {
      await apiRequest("POST", "/api/register", { name, email, password });
      toast({ title: "Sucesso", description: "Professor cadastrado com sucesso" });
      setName("");
      setEmail("");
      setPassword("");
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao cadastrar professor", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-dashed bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground p-1 rounded text-sm">ADMIN</span>
          Cadastrar Novo Professor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</label>
            <Input placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Email/Usuário</label>
            <Input placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Senha Provisória</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleCreateTeacher}>
            Cadastrar Professor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassSelector({ teacherId, onSelect }: { teacherId: number, onSelect: (id: number) => void }) {
  const [newClassName, setNewClassName] = useState("");
  const { toast } = useToast();
  const { data: classes, refetch } = useQuery<any[]>({ queryKey: ["/api/classes"] });
  const isAdmin = teacherId === -1;

  const handleCreateClass = async () => {
    try {
      await apiRequest("POST", "/api/classes", { name: newClassName, password: "default-password" });
      setNewClassName("");
      refetch();
      toast({ title: "Sucesso", description: "Turma criada com sucesso" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar turma", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-8">
      {isAdmin && <AdminPanel />}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Suas Turmas</h1>
          <div className="flex gap-2">
            <Input 
              placeholder="Nova Turma" 
              value={newClassName} 
              onChange={e => setNewClassName(e.target.value)}
              className="w-48"
            />
            <Button onClick={handleCreateClass}>Criar Turma</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes?.map(c => (
            <Card 
              key={c.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelect(c.id)}
            >
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Clique para gerenciar esta turma</p>
              </CardContent>
            </Card>
          ))}
          {classes?.length === 0 && (
            <p className="col-span-full text-center py-12 text-muted-foreground">
              Nenhuma turma encontrada. Crie sua primeira turma acima.
            </p>
          )}
        </div>
      </div>
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
  const [location] = useLocation();

  useEffect(() => {
    if (teacherId) localStorage.setItem("teacherId", String(teacherId));
    else localStorage.removeItem("teacherId");
  }, [teacherId]);

  useEffect(() => {
    if (classId) localStorage.setItem("classId", String(classId));
    else localStorage.removeItem("classId");
  }, [classId]);

  const isPublicRoute = location.startsWith("/ranking/") || location.startsWith("/student/");

  if (!teacherId && !isPublicRoute) {
    return <Login onLogin={setTeacherId} />;
  }

  if (teacherId && !classId && !isPublicRoute) {
    return <ClassSelector teacherId={teacherId} onSelect={setClassId} />;
  }

  return (
    <div className="relative">
      {teacherId && (
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50"
          onClick={() => setClassId(null)}
        >
          Trocar Turma
        </Button>
      )}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
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
