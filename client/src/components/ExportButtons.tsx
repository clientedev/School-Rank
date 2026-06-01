import { Download, FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportData {
  rankings: any[];
  activities: { id: number; name: string }[];
}

export function ExportButtons({ rankings, activities }: ExportData) {
  
  const handleExportExcel = () => {
    // Flatten data for excel
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
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Ranking da Turma", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const headers = [
      'Pos', 'Aluno', 'Média', 'Total', 
      ...activities.map(a => a.name)
    ];

    const body = rankings.map(r => {
      const row = [
        `${r.position}º`,
        r.studentName,
        r.average.toFixed(2),
        r.totalPoints.toFixed(1),
      ];
      
      activities.forEach(act => {
        const grade = r.grades.find((g: any) => g.activityId === act.id);
        row.push(grade ? String(grade.value) : '-');
      });
      
      return row;
    });

    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // matches primary indigo roughly
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      }
    });

    doc.save("ranking_turma.pdf");
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
