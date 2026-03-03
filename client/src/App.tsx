import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

function Login({ onLogin }: { onLogin: (classId: number) => void }) {
  const [className, setClassName] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const res = await apiRequest("POST", "/api/login", { className, password });
      const data = await res.json();
      onLogin(data.classId);
    } catch (e) {
      toast({ title: "Erro", description: "Turma ou senha inválida", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      const res = await apiRequest("POST", "/api/classes", { name: className, password });
      const data = await res.json();
      onLogin(data.id);
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar turma", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isCreating ? "Criar Nova Turma" : "Acessar Turma"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nome da Turma" value={className} onChange={e => setClassName(e.target.value)} />
          <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
          <Button className="w-full" onClick={isCreating ? handleCreate : handleLogin}>
            {isCreating ? "Criar Turma" : "Entrar"}
          </Button>
          <Button variant="link" className="w-full" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Já tenho uma turma" : "Criar nova turma"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const [classId, setClassId] = useState<number | null>(() => {
    const saved = localStorage.getItem("classId");
    return saved ? Number(saved) : null;
  });
  const [location] = useLocation();

  useEffect(() => {
    if (classId) localStorage.setItem("classId", String(classId));
  }, [classId]);

  const isPublicRoute = location.startsWith("/ranking/") || location.startsWith("/student/");

  if (!classId && !isPublicRoute) {
    return <Login onLogin={setClassId} />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/ranking/:classId" component={PublicRanking} />
      <Route path="/student/:id" component={StudentProfile} />
      <Route component={NotFound} />
    </Switch>
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
