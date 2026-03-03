import { useState } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { UploadModal } from "@/components/UploadModal";
import { StatsCards } from "@/components/StatsCards";
import { RankingsTable } from "@/components/RankingsTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ExportButtons } from "@/components/ExportButtons";
import { UploadCloud, LayoutDashboard, FileSpreadsheet, Loader2, Edit2, Share2 } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const { data, isLoading, error } = useDashboard();
  const { toast } = useToast();

  const handleUpdateName = async () => {
    try {
      const res = await fetch(api.settings.updateClassName.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: newName })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
        setIsEditingName(false);
        toast({ title: "Nome atualizado!" });
      }
    } catch (err) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleShare = () => {
    const url = window.location.origin + "/ranking";
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Envie este link para seus alunos." });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-primary gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-medium font-display animate-pulse">Carregando painel educacional...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center rounded-3xl">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Erro de Conexão</h2>
          <p className="text-muted-foreground mb-6">Não foi possível carregar os dados. O backend pode estar indisponível.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const hasData = data && data.rankings.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-violet-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  className="bg-muted px-2 py-1 rounded-md outline-none border border-primary"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
                <button onClick={handleUpdateName} className="text-xs bg-primary text-white px-2 py-1 rounded">Salvar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-extrabold font-display">
                  <span className="text-gradient">{data?.className || "EduRank"}</span>
                </h1>
                <button 
                  onClick={() => { setIsEditingName(true); setNewName(data?.className || ""); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-2"
              title="Compartilhar Ranking"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline">Link Alunos</span>
            </button>
            {hasData && <ExportButtons rankings={data.rankings} activities={data.activities} />}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Importar Excel</span>
            </button>
          </div>
        </div>
      </header>
// ... rest of Dashboard ...

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6 shadow-inner">
              <FileSpreadsheet className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold font-display mb-3">Nenhum dado encontrado</h2>
            <p className="text-lg text-muted-foreground max-w-lg mb-8">
              Faça o upload de uma planilha Excel contendo as notas para gerar o ranking automaticamente.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-3"
            >
              <UploadCloud className="w-6 h-6" />
              Fazer Upload da Planilha
            </button>
          </div>
        ) : (
          <>
            {/* Top Stats Overview */}
            <StatsCards stats={data.stats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column: Rankings Table (Takes up more space) */}
              <div className="xl:col-span-2">
                <RankingsTable 
                  rankings={data.rankings} 
                  activities={data.activities} 
                />
              </div>

              {/* Right Column: Charts & Extras */}
              <div className="space-y-8">
                <PerformanceChart rankings={data.rankings} />
                
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold font-display text-foreground mb-2">Informações</h3>
                  <ul className="space-y-3 mt-4">
                    <li className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Clique em qualquer nota na tabela para editá-la manualmente. O ranking será atualizado.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      O formato da planilha deve ter uma coluna para o nome do aluno e as outras colunas para as atividades com suas respectivas notas.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
}
