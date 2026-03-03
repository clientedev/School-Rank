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
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      const data = await res.json();
      onLogin(data.teacherId);
    } catch (e) {
      toast({ title: "Erro", description: "Email ou senha inválida", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      const res = await apiRequest("POST", "/api/register", { name, email, password });
      const data = await res.json();
      onLogin(data.id);
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar conta", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isCreating ? "Criar Conta de Professor" : "Acesso do Professor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreating && (
            <Input placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
          )}
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
          <Button className="w-full" onClick={isCreating ? handleCreate : handleLogin}>
            {isCreating ? "Criar Conta" : "Entrar"}
          </Button>
          <Button variant="link" className="w-full" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Já tenho uma conta" : "Criar nova conta de professor"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ClassSelector({ teacherId, onSelect }: { teacherId: number, onSelect: (id: number) => void }) {
  const [newClassName, setNewClassName] = useState("");
  const { toast } = useToast();
  const { data: classes, refetch } = useQuery<any[]>({ queryKey: ["/api/classes"] });

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Suas Turmas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Selecionar Turma Existente</p>
            <Select onValueChange={(v) => onSelect(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma turma" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Ou Criar Nova Turma</p>
            <div className="flex gap-2">
              <Input placeholder="Nome da Turma" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
              <Button onClick={handleCreateClass}>Criar</Button>
            </div>
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
