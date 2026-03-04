import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, CalendarCheck2, LayoutList, Settings2, Download, AlertCircle, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAttendance, useAttendanceReport, useSchedule, useSaveAttendance, useSaveSchedule } from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";
import * as xlsx from "xlsx";

export default function Attendance() {
    const classId = Number(localStorage.getItem("classId"));
    const [activeTab, setActiveTab] = useState<"launch" | "report" | "settings">("launch");
    const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

    const { data: dashboard, isLoading: dashLoading } = useDashboard(classId);
    const { data: schedule, isLoading: scheduleLoading } = useSchedule(classId);
    const { data: attendanceData, isLoading: attLoading } = useAttendance(classId, currentDate);
    const { data: reportData, isLoading: reportLoading } = useAttendanceReport(classId);

    const saveAtt = useSaveAttendance();
    const saveSched = useSaveSchedule();
    const { toast } = useToast();

    // --- Helpers Data & Dia da Semana ---
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const pData = new Date(currentDate + "T12:00:00Z"); // Fix timezone
    const currentDayOfWeek = pData.getUTCDay(); // 0(Dom) a 6(Sab)

    // Map 1..7 (Seg..Dom) used in schedule DB
    const dbDayMap = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    const isClassDay = schedule?.weekdays?.split(',').includes(String(dbDayMap)) || false;
    const noConfig = !schedule?.weekdays || schedule?.weekdays === "";

    const isLoading = dashLoading || scheduleLoading || (activeTab === 'launch' && attLoading) || (activeTab === 'report' && reportLoading);

    // --- Handlers Configuração ---
    const [tempWeekdays, setTempWeekdays] = useState<string[]>([]);
    useMemo(() => {
        if (schedule) setTempWeekdays(schedule.weekdays.split(',').filter(Boolean));
    }, [schedule]);

    const toggleDay = (dayStr: string) => {
        setTempWeekdays(prev => prev.includes(dayStr) ? prev.filter(d => d !== dayStr) : [...prev, dayStr]);
    };

    const handleSaveSetup = () => {
        saveSched.mutate({ classId, weekdays: tempWeekdays.join(',') }, {
            onSuccess: () => toast({ title: "Configuração salva!" })
        });
    };

    // --- Handlers Frequência ---
    const handleSetStatus = (studentId: number, status: string) => {
        saveAtt.mutate({ classId, studentId, date: currentDate, status }, {
            onSuccess: () => {
                // Optimistic UI updates handled by React Query invalidation in the hook
            }
        });
    };

    // --- Exportação Excel ---
    const exportToExcel = () => {
        if (!dashboard || !reportData) return;

        // Pegar todas as datas únicas lançadas
        const allDates = Array.from(new Set(reportData.map(r => r.date))).sort();

        const dataRows = dashboard.rankings.map(student => {
            const row: any = { 'Aluno': student.studentName };

            let faltas = 0, atrasos = 0, pontosRemovidos = 0;

            allDates.forEach(date => {
                const att = reportData.find(r => r.studentId === student.studentId && r.date === date);
                row[date.split('-').reverse().join('/')] = att ? att.status : '-';

                if (att?.status === 'F') { faltas++; pontosRemovidos += 5; }
                if (att?.status === 'A') { atrasos++; pontosRemovidos += 2; }
            });

            row['Total Faltas'] = faltas;
            row['Total Atrasos'] = atrasos;
            row['Total Desconto XP'] = pontosRemovidos;

            return row;
        });

        const worksheet = xlsx.utils.json_to_sheet(dataRows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Frequência");
        xlsx.writeFile(workbook, `Frequencia_${dashboard.className}.xlsx`);
    };

    if (!classId) return <div className="p-8 text-center text-red-500">Turma não definida.</div>;
    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Link href="/">
                            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold mb-2">
                                <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
                            </button>
                        </Link>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <CalendarCheck2 className="text-primary w-8 h-8" />
                            Controle de Frequência
                        </h1>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl shadow-sm border">
                        <button
                            onClick={() => setActiveTab('launch')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'launch' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >Lançamento</button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'report' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >Relatório</button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >Configurar</button>
                    </div>
                </div>

                {/* --- ABA LANÇAMENTO --- */}
                {activeTab === 'launch' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Data do Registro</div>
                                <div className="text-2xl font-black text-slate-800">
                                    {currentDate.split('-').reverse().join('/')} <span className="text-slate-400 font-medium">({daysOfWeek[currentDayOfWeek]})</span>
                                </div>
                            </div>
                            <input
                                type="date"
                                value={currentDate}
                                onChange={e => setCurrentDate(e.target.value)}
                                className="px-4 py-2 border rounded-xl text-slate-700 bg-slate-50 font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        {noConfig ? (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-3xl flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-amber-500" />
                                <div>
                                    <h3 className="font-bold text-lg">Defina os dias de aula</h3>
                                    <p className="text-sm mt-1 mb-3">Antes de lançar frequência, informe na aba Configurar quais dias da semana têm aula.</p>
                                    <button onClick={() => setActiveTab('settings')} className="text-sm font-bold bg-amber-200 px-4 py-2 rounded-lg text-amber-900 hover:bg-amber-300 transition">Configurar Agora</button>
                                </div>
                            </div>
                        ) : !isClassDay ? (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-8 text-center rounded-3xl">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
                                <h3 className="font-bold text-2xl">Não há aula hoje!</h3>
                                <p className="mt-2 text-red-600/80">O dia de {daysOfWeek[currentDayOfWeek]} não está configurado como dia letivo.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                                <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700">Turma: {dashboard?.className}</h3>
                                    <div className="text-xs font-semibold text-slate-400">{dashboard?.rankings.length} alunos</div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {dashboard?.rankings.map(student => {
                                        const rec = attendanceData?.find(a => a.studentId === student.studentId);
                                        const status = rec?.status;

                                        return (
                                            <div key={student.studentId} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {student.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-800">{student.studentName}</span>
                                                </div>

                                                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleSetStatus(student.studentId, 'P')}
                                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${status === 'P' ? 'bg-green-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                                                    >P - Presente</button>

                                                    <button
                                                        onClick={() => handleSetStatus(student.studentId, 'F')}
                                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${status === 'F' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                                                    >F - Falta</button>

                                                    <button
                                                        onClick={() => handleSetStatus(student.studentId, 'A')}
                                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${status === 'A' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                                                    >A - Atraso</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ABA RELATÓRIO --- */}
                {activeTab === 'report' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
                            >
                                <Download className="w-4 h-4" /> Exportar Planilha XLSX
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl overflow-x-auto border border-slate-100">
                            {(!reportData || reportData.length === 0) ? (
                                <div className="p-12 text-center text-slate-400 font-medium">Nenhuma frequência registrada ainda.</div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b">
                                            <th className="p-4 font-bold text-slate-600 sticky left-0 bg-slate-50 shadow-[1px_0_0_#f1f5f9]">Aluno</th>
                                            {Array.from(new Set(reportData.map(r => r.date))).sort().map(d => (
                                                <th key={d} className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider whitespace-nowrap">
                                                    {d.split('-').reverse().slice(0, 2).join('/')}
                                                </th>
                                            ))}
                                            <th className="p-4 text-xs font-bold text-red-500 text-center">Faltas</th>
                                            <th className="p-4 text-xs font-bold text-amber-500 text-center">Atrasos</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 text-center">Desconto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dashboard?.rankings.map(student => {
                                            let f = 0, a = 0, desc = 0;
                                            return (
                                                <tr key={student.studentId} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-sm text-slate-800 sticky left-0 bg-white shadow-[1px_0_0_#f1f5f9] whitespace-nowrap">
                                                        {student.studentName}
                                                    </td>
                                                    {Array.from(new Set(reportData.map(r => r.date))).sort().map(d => {
                                                        const att = reportData.find(r => r.studentId === student.studentId && r.date === d);
                                                        if (att?.status === 'F') { f++; desc += 5; }
                                                        if (att?.status === 'A') { a++; desc += 2; }
                                                        const cor = att?.status === 'P' ? 'text-green-500' : att?.status === 'F' ? 'text-red-500 font-bold' : att?.status === 'A' ? 'text-amber-500 font-bold' : 'text-slate-300';
                                                        return (
                                                            <td key={d} className={`p-4 text-center text-sm ${cor}`}>
                                                                {att ? att.status : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-4 text-center text-sm font-bold text-red-600">{f}</td>
                                                    <td className="p-4 text-center text-sm font-bold text-amber-600">{a}</td>
                                                    <td className="p-4 text-center text-sm font-bold text-slate-500">-{desc}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ABA DE CONFIGURAÇÃO --- */}
                {activeTab === 'settings' && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl">
                        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /> Dias de Aula</h2>
                        <p className="text-slate-500 mb-8 border-b pb-6 text-sm">Selecione abaixo quais dias da semana sua turma tem aula. O lançamento de frequência será bloqueado nos dias não selecionados para evitar erros.</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { id: '1', name: 'Segunda-feira' },
                                { id: '2', name: 'Terça-feira' },
                                { id: '3', name: 'Quarta-feira' },
                                { id: '4', name: 'Quinta-feira' },
                                { id: '5', name: 'Sexta-feira' },
                                { id: '6', name: 'Sábado' },
                                { id: '7', name: 'Domingo' },
                            ].map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`p-4 border rounded-2xl text-sm font-bold transition-all ${tempWeekdays.includes(day.id) ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>

                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                            <div>
                                <strong>Lembrete sobre os pontos:</strong> A lógica de pontuação é automática na hora do lançamento.
                                <ul className="list-disc ml-5 mt-1 opacity-80 space-y-0.5">
                                    <li>Presença (P) = Nenhum desconto</li>
                                    <li>Falta (F) = Desconto de 5 pontos (XP)</li>
                                    <li>Atraso (A) = Desconto de 2 pontos (XP)</li>
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSetup}
                            disabled={saveSched.isPending}
                            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex justify-center"
                        >
                            {saveSched.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Configuração'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
