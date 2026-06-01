import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useBatchUploadGrades } from "@/hooks/use-dashboard";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useBatchUploadGrades();
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFileData(null);
    setFileName("");
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive"
      });
      return;
    }

    setIsReadingFile(true);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);

    try {
      const data = await selectedFile.arrayBuffer();
      setFileData(data);
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível carregar o arquivo. Verifique se ele não está aberto em outro programa.",
        variant: "destructive"
      });
      clearFile();
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleUpload = async () => {
    if (!fileData) return;

    try {
      const workbook = XLSX.read(fileData);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      const formattedData: any[] = [];
      const columnNames = Object.keys(json[0] || {});
      const studentNameKey = columnNames.find(k =>
        ['Nome do aluno', 'Nome do Aluno', 'Aluno', 'Nome', 'Name', 'Student'].includes(k) || k.toLowerCase().includes('aluno')
      );

      if (!studentNameKey) {
        toast({
          title: "Erro de formatação",
          description: "O Excel deve conter uma coluna com o nome do aluno (ex: 'Nome do aluno').",
          variant: "destructive"
        });
        return;
      }

      // Atividades são todas as outras colunas
      const activityKeys = columnNames.filter(k => k !== studentNameKey);

      json.forEach(row => {
        const studentName = row[studentNameKey];
        if (!studentName) return;

        if (activityKeys.length === 0) {
          formattedData.push({ studentName, activityName: null, value: null });
        } else {
          activityKeys.forEach(activityName => {
            let valueRaw = row[activityName];
            if (valueRaw === undefined || valueRaw === null || valueRaw === '') return;

            let value = 0;
            if (typeof valueRaw === 'string') {
              value = parseFloat(valueRaw.replace(',', '.'));
            } else if (typeof valueRaw === 'number') {
              value = valueRaw;
            }

            if (!isNaN(value)) {
              formattedData.push({ studentName, activityName, value });
            }
          });
        }
      });

      if (formattedData.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não foram encontradas notas para importar.",
          variant: "destructive"
        });
        return;
      }

      await uploadMutation.mutateAsync({ data: formattedData });
      toast({
        title: "Sucesso!",
        description: `${formattedData.length} notas processadas com sucesso.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold font-display">Upload de Notas</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!fileData && !isReadingFile ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">Clique ou arraste um arquivo</p>
                  <p className="text-sm text-muted-foreground mt-1">Suporta arquivos .xlsx e .xls</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Modelo de Planilha:
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full border-collapse border border-border bg-background">
                    <thead>
                      <tr>
                        <th className="border border-border p-1 bg-muted">Nome do aluno</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-1 italic text-muted-foreground">Nome do Aluno...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  * Importe a lista de alunos e depois adicione as atividades no painel.
                </p>
              </div>
            </div>
          ) : isReadingFile ? (
            <div className="border border-border rounded-2xl p-12 flex flex-col items-center gap-4 bg-muted/30">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Lendo arquivo...</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl p-6 flex items-center gap-4 bg-muted/30">
              <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{(fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={clearFile}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                disabled={uploadMutation.isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="mt-8 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              disabled={isReadingFile || uploadMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={!fileData || uploadMutation.isPending || isReadingFile}
              className="px-6 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploadMutation.isPending ? 'Processando...' : 'Importar Dados'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
