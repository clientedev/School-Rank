import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

interface StudentActionModalProps {
  student: {
    studentId: number;
    studentName: string;
    totalPoints: number;
    grades: any[];
  };
  activities: { id: number; name: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export function StudentActionModal({ student, activities, isOpen, onClose }: StudentActionModalProps) {
  const [amount, setAmount] = useState<string>("1");
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id.toString() || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAction = async (type: 'add' | 'remove') => {
    if (!selectedActivityId) {
      toast({ title: "Selecione uma atividade", variant: "destructive" });
      return;
    }

    const valueChange = parseFloat(amount);
    if (isNaN(valueChange) || valueChange <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const activityId = parseInt(selectedActivityId);
      const existingGrade = student.grades.find(g => g.activityId === activityId);
      const currentGrade = existingGrade?.value || 0;
      const newValue = type === 'add' ? currentGrade + valueChange : currentGrade - valueChange;
      
      const gradeId = existingGrade?.gradeId || 0;

      const res = await fetch(api.grades.update.path.replace(':id', gradeId.toString()), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newValue,
          studentId: student.studentId,
          activityId,
          reason: reason || (type === 'add' ? 'Atribuição de pontos' : 'Penalidade')
        })
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
        toast({ 
          title: type === 'add' ? "Pontos atribuídos!" : "Penalidade aplicada!",
          description: `${type === 'add' ? '+' : '-'}${valueChange} pontos para ${student.studentName}`
        });
        setReason("");
        onClose();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast({ title: "Erro ao processar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl overflow-hidden glass-card border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-primary">
            Ações: {student.studentName}
          </DialogTitle>
          <DialogDescription>
            Atribua pontos ou aplique penalidades vinculadas a uma atividade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Atividade</Label>
            <select
              id="activity"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              {activities.map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade de Pontos</Label>
            <Input
              id="amount"
              type="number"
              step="0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Input
              id="reason"
              placeholder="Ex: Bom comportamento, atraso..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-center pt-2">
          <Button
            type="button"
            variant="destructive"
            className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-destructive/20"
            onClick={() => handleAction('remove')}
            disabled={isSubmitting}
          >
            <Minus className="w-5 h-5 mr-2" />
            Penalidade
          </Button>
          <Button
            type="button"
            className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
            onClick={() => handleAction('add')}
            disabled={isSubmitting}
          >
            <Plus className="w-5 h-5 mr-2" />
            Atribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
