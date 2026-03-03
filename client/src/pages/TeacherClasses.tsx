import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Layout, Trash2, ArrowRight, Settings2, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TeacherClasses({ onSelect, onLogout }: { onSelect: (id: number) => void, onLogout: () => void }) {
    const [newClassName, setNewClassName] = useState("");
    const { toast } = useToast();
    const { data: classes, isLoading } = useQuery<any[]>({ queryKey: ["/api/classes"] });

    const createClassMutation = useMutation({
        mutationFn: async () => {
            if (!newClassName.trim()) throw new Error("Nome vazio");
            await apiRequest("POST", "/api/classes", { name: newClassName, password: "default-password" });
        },
        onSuccess: () => {
            setNewClassName("");
            queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
            toast({ title: "Sucesso", description: "Turma criada com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao criar turma", variant: "destructive" });
        }
    });

    const deleteClassMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/classes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
            toast({ title: "Sucesso", description: "Turma removida" });
        }
    });

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header Area */}
            <div className="bg-white border-b sticky top-0 z-30">
                <div className="container mx-auto px-8 h-20 flex items-center justify-between max-w-7xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-200">
                            <Layout className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800">Minhas Turmas</h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Painel do Professor</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={onLogout} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                        <LogOut className="h-4 w-4 mr-2 text-slate-400" />
                        Sair
                    </Button>
                </div>
            </div>

            <main className="container mx-auto p-8 max-w-7xl space-y-10">
                {/* Create Class Card */}
                <section>
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-violet-600 rounded-3xl p-8 shadow-2xl shadow-violet-200 text-white relative overflow-hidden">
                        <div className="relative z-10 flex-1">
                            <h2 className="text-3xl font-bold mb-2">Adicionar Nova Turma</h2>
                            <p className="text-violet-100 mb-6 max-w-md">Organize seus alunos e começe a gerenciar as notas de forma eficiente.</p>
                            <div className="flex gap-3 max-w-md bg-white/10 p-2 rounded-2xl backdrop-blur-md">
                                <Input
                                    placeholder="Nome da Turma (Ex: 3º Ano B)"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus-visible:ring-white/30"
                                />
                                <Button
                                    onClick={() => createClassMutation.mutate()}
                                    className="bg-white text-violet-600 hover:bg-violet-50 h-12 px-6 rounded-xl font-bold shadow-lg"
                                    disabled={createClassMutation.isPending}
                                >
                                    <Plus className="h-5 w-5 mr-1" />
                                    Criar
                                </Button>
                            </div>
                        </div>
                        <div className="hidden lg:block relative z-10">
                            <div className="w-48 h-48 bg-white/10 rounded-full border-4 border-white/5 flex items-center justify-center animate-pulse">
                                <Plus className="h-24 w-24 text-white/20" />
                            </div>
                        </div>
                        {/* Aesthetic Blobs */}
                        <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-500 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute -bottom-12 left-1/4 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                    </div>
                </section>

                {/* Classes Grid */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800">Turmas Ativas</h3>
                        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{classes?.length || 0} Turmas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-3xl"></div>
                            ))
                        ) : classes?.map(c => (
                            <Card
                                key={c.id}
                                className="group relative border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden bg-white"
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                                            <Layout className="h-6 w-6" />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Remover turma ${c.name}?`)) deleteClassMutation.mutate(c.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-2xl font-bold pt-4 group-hover:text-violet-600 transition-colors">{c.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-slate-400 text-sm font-medium">Gerenciar Notas e Ranking</p>
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-slate-900 group-hover:bg-violet-600 shadow-lg group-hover:shadow-violet-200 transition-all font-bold px-4"
                                            onClick={() => {
                                                localStorage.setItem("classId", c.id.toString());
                                                onSelect(c.id);
                                            }}
                                        >
                                            Entrar
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>


                                    </div>
                                </CardContent>
                                {/* Visual Accent */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-violet-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                            </Card>
                        ))}
                        {!isLoading && classes?.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="inline-flex bg-slate-50 p-6 rounded-full text-slate-300 mb-2">
                                    <Layout className="h-12 w-12" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800">Você ainda não tem turmas</h4>
                                <p className="text-slate-500 max-w-sm mx-auto">Crie sua primeira turma no painel acima para começar o controle das notas.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
