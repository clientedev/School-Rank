import { useState, useEffect, useRef } from "react";
import { useUpdateGrade } from "@/hooks/use-dashboard";
import { Loader2 } from "lucide-react";

interface EditableGradeProps {
  gradeId?: number;
  value?: number;
  studentId: number;
  activityId: number;
}

export function EditableGrade({ gradeId, value, studentId, activityId }: EditableGradeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value !== undefined ? String(value) : "-");
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateGrade();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update local state if props change from outside (e.g. after refetch)
  useEffect(() => {
    setCurrentValue(value !== undefined ? String(value) : "-");
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    
    // If it's empty or dash, we might want to delete, but prompt says update. 
    // Let's just ignore if they revert to dash or empty
    if (currentValue === "-" || currentValue === "") {
      setCurrentValue(value !== undefined ? String(value) : "-");
      return;
    }

    const numValue = parseFloat(currentValue.replace(',', '.'));
    
    // Only update if it's a valid number, changed, and we have an existing gradeId
    // Note: The prompt doesn't explicitly ask for creation of single grades via UI, 
    // only updating existing ones after upload.
    if (!isNaN(numValue) && numValue !== value && gradeId) {
      updateMutation.mutate({ id: gradeId, value: numValue });
    } else {
      setCurrentValue(value !== undefined ? String(value) : "-");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value !== undefined ? String(value) : "-");
    }
  };

  if (updateMutation.isPending) {
    return (
      <div className="flex justify-center">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
    );
  }

  if (isEditing && gradeId) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-16 px-2 py-1 text-center bg-background border-2 border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
      />
    );
  }

  return (
    <div 
      onClick={() => gradeId && setIsEditing(true)}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-center
        ${gradeId ? 'cursor-pointer hover:bg-muted cursor-text' : 'text-muted-foreground/50'}
        ${value !== undefined && value < 6 ? 'text-destructive' : ''} 
      `}
      title={gradeId ? "Clique para editar" : "Sem nota"}
    >
      {value !== undefined ? Number(value).toFixed(1) : "-"}
    </div>
  );
}
