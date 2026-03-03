import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, GraduationCap, Trash2, Plus, LogOut, LayoutDashboard, Search } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Stats {
    teachers: number;
    classes: number;
    students: number;
}

interface Teacher {
    id: number;
    name: number;
    email: string;
}

interface Class {
    id: number;
    name: string;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const { data: stats } = useQuery<Stats>({ queryKey: ["/api/admin/stats"] });
    const { data: teachers } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
    const { data: classes } = useQuery<Class[]>({ queryKey: ["/api/classes"] });

    const registerMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/register", { name: newName, email: newEmail, password: newPassword });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            toast({ title: "Sucesso", description: "Professor cadastrado com sucesso" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao cadastrar professor", variant: "destructive" });
        }
    });

    const deleteTeacherMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/teachers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "Sucesso", description: "Professor removido" });
        }
    });

    const deleteClassMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/classes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "Sucesso", description: "Turma removida" });
        }
    });

    const filteredTeachers = teachers?.filter(t =>
        t.name.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-8 mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Admin Control Center
                        </h1>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair do Sistema
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto p-8 space-y-8 max-w-7xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-blue-500 text-white overflow-hidden relative">
                        <Users className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10" />
                        <CardHeader className="pb-2">
                            <CardDescription className="text-blue-100 font-medium">Total de Professores</CardDescription>
                            <CardTitle className="text-4xl font-extrabold">{stats?.teachers || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-violet-500 text-white overflow-hidden relative">
                        <BookOpen className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10" />
                        <CardHeader className="pb-2">
                            <CardDescription className="text-violet-100 font-medium">Total de Turmas</CardDescription>
                            <CardTitle className="text-4xl font-extrabold">{stats?.classes || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-emerald-500 text-white overflow-hidden relative">
                        <GraduationCap className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10" />
                        <CardHeader className="pb-2">
                            <CardDescription className="text-emerald-100 font-medium">Total de Alunos</CardDescription>
                            <CardTitle className="text-4xl font-extrabold">{stats?.students || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Teacher Section */}
                    <Card className="lg:col-span-1 border shadow-sm h-fit">
                        <CardHeader>
                            <CardTitle>Cadastrar Professor</CardTitle>
                            <CardDescription>Crie uma nova conta de acesso para professor.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Nome Completo</label>
                                <Input placeholder="Ex: Prof. Anderson" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Email / Usuário</label>
                                <Input placeholder="anderson@escola.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Senha Inicial</label>
                                <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <Button
                                className="w-full font-bold"
                                onClick={() => registerMutation.mutate()}
                                disabled={registerMutation.isPending || !newName || !newEmail || !newPassword}
                            >
                                {registerMutation.isPending ? "Cadastrando..." : "Confirmar Cadastro"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Teacher Management Table */}
                    <Card className="lg:col-span-2 border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Gerenciar Professores</CardTitle>
                                <CardDescription>Lista de todos os professores no sistema.</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTeachers?.map(teacher => (
                                            <TableRow key={teacher.id}>
                                                <TableCell className="font-medium">{teacher.name}</TableCell>
                                                <TableCell>{teacher.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm(`Deseja realmente excluir o professor ${teacher.name}?`)) {
                                                                deleteTeacherMutation.mutate(teacher.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredTeachers?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    Nenhum professor encontrado.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Section */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Visão Geral das Turmas</CardTitle>
                        <CardDescription>Visualize e gerencie as turmas ativas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {classes?.map(c => (
                                <div key={c.id} className="p-4 rounded-xl border bg-card flex items-center justify-between group hover:border-primary transition-all">
                                    <div>
                                        <p className="font-bold text-lg">{c.name}</p>
                                        <p className="text-xs text-muted-foreground">ID da Turma: #{c.id}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                        onClick={() => {
                                            if (confirm(`Deseja excluir a turma ${c.name}? Isso removerá todos os dados vinculados.`)) {
                                                deleteClassMutation.mutate(c.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {classes?.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                                    Nenhuma turma cadastrada no sistema.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
