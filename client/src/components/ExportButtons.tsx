import { Download, FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportData {
  rankings: any[];
  activities: { id: number; name: string }[];
}

export function ExportButtons({ rankings, activities }: ExportData) {
  
  const handleExportExcel = () => {
    const exportData = rankings.map(r => {
      const row: any = {
        'Posição': r.position,
        'Aluno': r.studentName,
        'Média Geral': r.average.toFixed(2),
        'Total Pontos': r.totalPoints.toFixed(1),
      };
      
      activities.forEach(act => {
        const grade = r.grades.find((g: any) => g.activityId === act.id);
        row[act.name] = grade ? grade.value : '-';
      });
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ranking");
    XLSX.writeFile(wb, "ranking_turma.xlsx");
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const headers = ['Pos', 'Aluno', 'Média', 'Total', ...activities.map(a => a.name)];

    const rows = rankings.map(r => {
      const cells = [
        `${r.position}º`,
        r.studentName,
        r.average.toFixed(2),
        r.totalPoints.toFixed(1),
      ];
      activities.forEach(act => {
        const grade = r.grades.find((g: any) => g.activityId === act.id);
        cells.push(grade ? String(grade.value) : '-');
      });
      return cells;
    });

    const tableRows = rows.map(row =>
      `<tr>${row.map((cell, i) => `<td style="text-align:${i === 1 ? 'left' : 'center'}">${cell}</td>`).join('')}</tr>`
    ).join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Ranking da Turma</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { font-size: 11px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #4f46e5; color: #fff; padding: 6px 8px; text-align: center; }
    td { padding: 5px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Relatório de Ranking da Turma</h1>
  <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportExcel}
        className="px-4 py-2.5 rounded-xl font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-sm"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar Excel</span>
      </button>
      <button
        onClick={handleExportPDF}
        className="px-4 py-2.5 rounded-xl font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all flex items-center gap-2 text-sm"
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar PDF</span>
      </button>
    </div>
  );
}
