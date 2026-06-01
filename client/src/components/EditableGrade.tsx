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
    
    if (currentValue === "-" || currentValue === "") {
      setCurrentValue(value !== undefined ? String(value) : "-");
      return;
    }

    const numValue = parseFloat(currentValue.replace(',', '.'));
    
    if (!isNaN(numValue) && numValue !== value) {
      updateMutation.mutate({ 
        id: gradeId || 0, // 0 will be ignored if we create
        value: numValue,
        studentId: !gradeId ? studentId : undefined,
        activityId: !gradeId ? activityId : undefined
      });
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

  if (isEditing) {
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
      onClick={() => setIsEditing(true)}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-center
        cursor-pointer hover:bg-muted cursor-text
        ${value !== undefined && value < 6 ? 'text-destructive' : ''} 
        ${value === undefined ? 'text-muted-foreground/30' : ''}
      `}
      title="Clique para editar"
    >
      {value !== undefined ? Number(value).toFixed(1) : "-"}
    </div>
  );
}
