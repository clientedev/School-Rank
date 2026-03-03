import { Trophy, Medal, Award, Search, Filter, UserCog } from "lucide-react";
import { EditableGrade } from "./EditableGrade";
import { useState } from "react";
import { StudentActionModal } from "./StudentActionModal";

interface RankingData {
  studentId: number;
  studentName: string;
  average: number;
  totalPoints: number;
  activitiesCount: number;
  position: number;
  grades: {
    activityId: number;
    activityName: string;
    value: number;
    gradeId: number;
  }[];
}

interface RankingsTableProps {
  rankings: RankingData[];
  activities: { id: number; name: string }[];
  readonly?: boolean;
}

export function RankingsTable({ rankings, activities, readonly = false }: RankingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<RankingData | null>(null);
  
  const filteredRankings = rankings.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by name if no activities exist, otherwise use the provided ranking order
  const displayRankings = activities.length === 0 
    ? [...filteredRankings].sort((a, b) => a.studentName.localeCompare(b.studentName))
    : filteredRankings;

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-lg animate-bounce" />;
    if (position === 2) return <Medal className="w-5 h-5 text-slate-400 drop-shadow-md" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600 drop-shadow-sm" />;
    return <span className="font-bold text-muted-foreground w-6 h-6 flex items-center justify-center bg-muted/50 rounded-full text-xs">{position}</span>;
  };

  const getRowClass = (position: number) => {
    if (position === 1) return "bg-gradient-to-r from-yellow-50/50 to-transparent border-l-yellow-400 hover:from-yellow-100/50";
    if (position === 2) return "bg-gradient-to-r from-slate-50/50 to-transparent border-l-slate-300 hover:from-slate-100/50";
    if (position === 3) return "bg-gradient-to-r from-amber-50/50 to-transparent border-l-amber-400 hover:from-amber-100/50";
    return "bg-card hover:bg-muted/30 border-l-transparent";
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/10">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">Ranking da Turma</h2>
          <p className="text-sm text-muted-foreground mt-1">Classificação baseada na média geral de todas as atividades.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">Pos</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Média</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Total</th>
              
              {/* Dynamic Activity Columns */}
              {activities.map(act => (
                <th key={act.id} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center whitespace-nowrap min-w-[100px]">
                  {act.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {displayRankings.length === 0 ? (
              <tr>
                <td colSpan={4 + activities.length} className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              displayRankings.map((student) => (
                <tr 
                  key={student.studentId} 
                  className={`group transition-colors border-l-4 ${activities.length > 0 ? getRowClass(student.position) : "bg-card hover:bg-muted/30 border-l-transparent"}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center h-full">
                      {getRankIcon(student.position)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                    <button 
                      onClick={() => !readonly && setSelectedStudent(student)}
                      className={`hover:text-primary transition-colors flex items-center gap-2 ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {student.studentName}
                      {!readonly && <UserCog className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {student.average.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-muted-foreground font-medium">
                    {student.totalPoints.toFixed(1)} pt
                  </td>
                  
                  {/* Dynamic Grade Cells */}
                  {activities.map(act => {
                    const grade = student.grades.find(g => g.activityId === act.id);
                    return (
                      <td key={act.id} className="px-6 py-4 text-center">
                        {readonly ? (
                          <span className="font-medium text-sm">
                            {grade?.value !== undefined ? grade.value.toFixed(1) : "-"}
                          </span>
                        ) : (
                          <EditableGrade 
                            gradeId={grade?.gradeId}
                            value={grade?.value}
                            studentId={student.studentId}
                            activityId={act.id}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <StudentActionModal 
          student={selectedStudent}
          activities={activities}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
