import { db } from "./db";
import {
  students, activities, grades, settings, studentLogs, classes, teachers,
  attendance, classSchedule,
  type Student, type Activity, type Grade, type Class, type Teacher,
  type Attendance, type ClassSchedule,
  type InsertStudent, type InsertActivity, type InsertGrade, type InsertClass, type InsertTeacher
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Teachers
  createTeacher(t: InsertTeacher): Promise<Teacher>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  getTeachers(): Promise<Teacher[]>;
  deleteTeacher(id: number): Promise<void>;

  // Classes
  createClass(c: InsertClass): Promise<Class>;
  getClass(id: number): Promise<Class | undefined>;
  getClassByName(name: string): Promise<Class | undefined>;
  getClasses(teacherId?: number): Promise<Class[]>;
  deleteClass(id: number): Promise<void>;
  updateClass(id: number, data: { name: string }): Promise<Class>;

  // Students
  getStudentByName(name: string, classId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudents(classId: number): Promise<Student[]>;
  updateStudentExtraPoints(id: number, points: number, reason: string): Promise<Student>;
  getStudentLogs(studentId: number): Promise<any[]>;

  // Activities
  getActivityByName(name: string, classId: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(classId: number): Promise<Activity[]>;

  // Grades
  getGrade(studentId: number, activityId: number): Promise<Grade | undefined>;
  getGradeById(id: number): Promise<Grade | undefined>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, value: number, reason?: string): Promise<Grade>;
  getGrades(): Promise<Grade[]>;
  getAllGradesWithDetails(classId: number): Promise<any[]>;

  // Settings
  getSetting(key: string, classId?: number): Promise<string | undefined>;
  updateSetting(key: string, value: string, classId?: number): Promise<void>;

  // Admin Stats
  getSystemStats(): Promise<{ teachers: number, classes: number, students: number }>;

  // --- Frequência ---
  getAttendance(classId: number, date: string): Promise<Attendance[]>;
  upsertAttendance(data: { studentId: number; classId: number; date: string; status: string }): Promise<Attendance>;
  getAttendanceReport(classId: number): Promise<Attendance[]>;
  getStudentAttendance(studentId: number): Promise<Attendance[]>;
  getSchedule(classId: number): Promise<ClassSchedule | undefined>;
  saveSchedule(classId: number, weekdays: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private teachers: Map<number, Teacher>;
  private classes: Map<number, Class>;
  private students: Map<number, Student>;
  private activities: Map<number, Activity>;
  private grades: Map<number, Grade>;
  private studentLogs: any[];
  private settings: Map<string, string>;
  private attendance: Map<number, Attendance>;
  private classSchedule: Map<number, ClassSchedule>;
  private nextId: { [key: string]: number };

  constructor() {
    this.teachers = new Map();
    this.classes = new Map();
    this.students = new Map();
    this.activities = new Map();
    this.grades = new Map();
    this.studentLogs = [];
    this.settings = new Map();
    this.attendance = new Map();
    this.classSchedule = new Map();
    this.nextId = { teachers: 1, classes: 1, students: 1, activities: 1, grades: 1, attendance: 1, classSchedule: 1 };

    // Initial Demo Data
    this.createTeacher({ name: "Professor Demo", email: "professor@demo.com", password: "123", role: "teacher" });
    this.createClass({ name: "Turma de Exemplo A", password: "123", teacherId: 1 });
    this.createStudent({ name: "Caleb Gabriel", classId: 1, extraPoints: 10 });
    this.createStudent({ name: "Ana Beatriz", classId: 1, extraPoints: 5 });
    this.createActivity({ name: "Prova 1", classId: 1 });
    this.createGrade({ studentId: 1, activityId: 1, value: 85, reason: "Ótimo desempenho" });
    this.createGrade({ studentId: 2, activityId: 1, value: 92, reason: "Excelente" });
  }

  async createTeacher(t: InsertTeacher): Promise<Teacher> {
    const id = this.nextId.teachers++;
    const teacher: Teacher = { ...t, id, role: t.role || "teacher" };
    this.teachers.set(id, teacher);
    return teacher;
  }
  async getTeacher(id: number): Promise<Teacher | undefined> { return this.teachers.get(id); }
  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(t => t.email === email);
  }
  async getTeachers(): Promise<Teacher[]> { return Array.from(this.teachers.values()); }
  async deleteTeacher(id: number): Promise<void> { this.teachers.delete(id); }

  async createClass(c: InsertClass): Promise<Class> {
    const id = this.nextId.classes++;
    const classObj: Class = { ...c, id, teacherId: c.teacherId ?? null };
    this.classes.set(id, classObj);
    return classObj;
  }
  async getClass(id: number): Promise<Class | undefined> { return this.classes.get(id); }
  async getClassByName(name: string): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(c => c.name === name);
  }
  async getClasses(teacherId?: number): Promise<Class[]> {
    if (teacherId === -1) return Array.from(this.classes.values());
    if (teacherId) return Array.from(this.classes.values()).filter(c => c.teacherId === teacherId);
    return Array.from(this.classes.values());
  }
  async deleteClass(id: number): Promise<void> { this.classes.delete(id); }
  async updateClass(id: number, data: { name: string }): Promise<Class> {
    const c = this.classes.get(id);
    if (!c) throw new Error("Class not found");
    const updated = { ...c, ...data };
    this.classes.set(id, updated);
    return updated;
  }

  async createStudent(s: InsertStudent): Promise<Student> {
    const id = this.nextId.students++;
    const student: Student = { ...s, id, extraPoints: s.extraPoints ?? 0 };
    this.students.set(id, student);
    return student;
  }
  async getStudentByName(name: string, classId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.name === name && s.classId === classId);
  }
  async getStudents(classId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.classId === classId);
  }
  async updateStudentExtraPoints(id: number, points: number, reason: string): Promise<Student> {
    const s = this.students.get(id);
    if (!s) throw new Error("Student not found");
    const oldPoints = s.extraPoints || 0;
    const updated = { ...s, extraPoints: points };
    this.students.set(id, updated);
    this.studentLogs.push({ id: this.studentLogs.length + 1, studentId: id, points: points - oldPoints, reason, createdAt: new Date().toISOString() });
    return updated;
  }
  async getStudentLogs(studentId: number): Promise<any[]> {
    return this.studentLogs.filter(l => l.studentId === studentId);
  }

  async createActivity(a: InsertActivity): Promise<Activity> {
    const id = this.nextId.activities++;
    const activity: Activity = { ...a, id };
    this.activities.set(id, activity);
    return activity;
  }
  async getActivityByName(name: string, classId: number): Promise<Activity | undefined> {
    return Array.from(this.activities.values()).find(a => a.name === name && a.classId === classId);
  }
  async getActivities(classId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(a => a.classId === classId);
  }

  async createGrade(g: InsertGrade): Promise<Grade> {
    const id = this.nextId.grades++;
    const grade: Grade = { ...g, id, reason: g.reason ?? null };
    this.grades.set(id, grade);
    return grade;
  }
  async getGrade(studentId: number, activityId: number): Promise<Grade | undefined> {
    return Array.from(this.grades.values()).find(g => g.studentId === studentId && g.activityId === activityId);
  }
  async getGradeById(id: number): Promise<Grade | undefined> { return this.grades.get(id); }
  async updateGrade(id: number, value: number, reason?: string): Promise<Grade> {
    const g = this.grades.get(id);
    if (!g) throw new Error("Grade not found");
    const updated = { ...g, value, reason: reason ?? g.reason };
    this.grades.set(id, updated);
    return updated;
  }
  async getGrades(): Promise<Grade[]> { return Array.from(this.grades.values()); }
  async getAllGradesWithDetails(classId: number): Promise<any[]> {
    const classStudents = await this.getStudents(classId);
    const studentIds = new Set(classStudents.map(s => s.id));
    return Array.from(this.grades.values())
      .filter(g => studentIds.has(g.studentId))
      .map(g => {
        const s = this.students.get(g.studentId);
        const a = this.activities.get(g.activityId);
        return {
          gradeId: g.id,
          value: g.value,
          studentId: g.studentId,
          studentName: s?.name,
          activityId: g.activityId,
          activityName: a?.name
        };
      });
  }

  async getSetting(key: string, classId?: number): Promise<string | undefined> {
    return this.settings.get(`${key}_${classId || 'global'}`);
  }
  async updateSetting(key: string, value: string, classId?: number): Promise<void> {
    this.settings.set(`${key}_${classId || 'global'}`, value);
  }

  async getSystemStats(): Promise<{ teachers: number, classes: number, students: number }> {
    return {
      teachers: this.teachers.size,
      classes: this.classes.size,
      students: this.students.size
    };
  }

  // --- Frequência MemStorage ---
  async getAttendance(classId: number, date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.classId === classId && a.date === date);
  }

  async upsertAttendance(data: { studentId: number; classId: number; date: string; status: string }): Promise<Attendance> {
    let existing = Array.from(this.attendance.values()).find(a => a.studentId === data.studentId && a.date === data.date);

    // Calcula pontos do novo status
    let newPoints = 0;
    if (data.status === "F") newPoints = -5;
    if (data.status === "A") newPoints = -2;

    // Se já existia, reverte o desconto anterior
    let pointsApplied = existing ? existing.pointsApplied : 0;

    if (existing && existing.status !== data.status && pointsApplied !== 0) {
      await this.updateStudentExtraPoints(data.studentId, (this.students.get(data.studentId)?.extraPoints || 0) - pointsApplied, `Estorno correção frequência (${existing.status})`);
      pointsApplied = 0;
    }

    // Aplica novo desconto se necessário e diferente do anterior
    if ((!existing || existing.status !== data.status) && newPoints !== 0) {
      await this.updateStudentExtraPoints(data.studentId, (this.students.get(data.studentId)?.extraPoints || 0) + newPoints, `Desconto por ${data.status === 'F' ? 'falta' : 'atraso'}`);
      pointsApplied = newPoints;
    } else if (newPoints === 0) {
      pointsApplied = 0;
    }

    if (existing) {
      const updated = { ...existing, status: data.status, pointsApplied };
      this.attendance.set(existing.id, updated);
      return updated;
    } else {
      const id = this.nextId.attendance++;
      const newAtt: Attendance = { ...data, id, pointsApplied };
      this.attendance.set(id, newAtt);
      return newAtt;
    }
  }

  async getAttendanceReport(classId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.classId === classId);
  }

  async getStudentAttendance(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.studentId === studentId && (a.status === "F" || a.status === "A"));
  }

  async getSchedule(classId: number): Promise<ClassSchedule | undefined> {
    return Array.from(this.classSchedule.values()).find(s => s.classId === classId);
  }

  async saveSchedule(classId: number, weekdays: string): Promise<void> {
    const existing = await this.getSchedule(classId);
    if (existing) {
      this.classSchedule.set(existing.id, { ...existing, weekdays });
    } else {
      const id = this.nextId.classSchedule++;
      this.classSchedule.set(id, { id, classId, weekdays });
    }
  }
}

export class DatabaseStorage implements IStorage {
  async createTeacher(t: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values({
      ...t,
      role: t.role || "teacher"
    }).returning();
    return created;
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [t] = await db.select().from(teachers).where(eq(teachers.id, id));
    return t;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [t] = await db.select().from(teachers).where(eq(teachers.email, email));
    return t;
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async createClass(c: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(c).returning();
    return created;
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [c] = await db.select().from(classes).where(eq(classes.id, id));
    return c;
  }

  async getClassByName(name: string): Promise<Class | undefined> {
    const [c] = await db.select().from(classes).where(eq(classes.name, name));
    return c;
  }

  async deleteClass(id: number): Promise<void> {
    // In a real app we might want to delete students/grades too or use cascades
    await db.delete(classes).where(eq(classes.id, id));
  }

  async updateClass(id: number, data: { name: string }): Promise<Class> {
    const [updated] = await db.update(classes)
      .set({ name: data.name })
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async getClasses(teacherId?: number): Promise<Class[]> {
    if (teacherId) {
      if (teacherId === -1) {
        return await db.select().from(classes);
      }
      const teacher = await this.getTeacher(teacherId);
      if (teacher?.role === "admin") {
        return await db.select().from(classes);
      }
      return await db.select().from(classes).where(eq(classes.teacherId, teacherId));
    }
    return await db.select().from(classes);
  }

  async getSetting(key: string, classId?: number): Promise<string | undefined> {
    const query = classId
      ? and(eq(settings.key, key), eq(settings.classId, classId))
      : eq(settings.key, key);
    const [setting] = await db.select().from(settings).where(query);
    return setting?.value;
  }

  async updateSetting(key: string, value: string, classId?: number): Promise<void> {
    const existing = await this.getSetting(key, classId);
    if (existing !== undefined) {
      const query = classId
        ? and(eq(settings.key, key), eq(settings.classId, classId))
        : eq(settings.key, key);
      await db.update(settings).set({ value }).where(query);
    } else {
      await db.insert(settings).values({ key, value, classId });
    }
  }

  async getStudentByName(name: string, classId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(and(eq(students.name, name), eq(students.classId, classId)));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async getStudents(classId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.classId, classId));
  }

  async updateStudentExtraPoints(id: number, points: number, reason: string): Promise<Student> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    const oldPoints = student?.extraPoints || 0;

    const [updated] = await db.update(students)
      .set({ extraPoints: points })
      .where(eq(students.id, id))
      .returning();

    await db.insert(studentLogs).values({
      studentId: id,
      points: points - oldPoints,
      reason: reason
    });
    return updated;
  }

  async getStudentLogs(studentId: number): Promise<any[]> {
    return await db.select().from(studentLogs).where(eq(studentLogs.studentId, studentId));
  }

  async getActivityByName(name: string, classId: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(and(eq(activities.name, name), eq(activities.classId, classId)));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getActivities(classId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.classId, classId));
  }

  async getGrade(studentId: number, activityId: number): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(
      and(eq(grades.studentId, studentId), eq(grades.activityId, activityId))
    );
    return grade;
  }

  async getGradeById(id: number): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [created] = await db.insert(grades).values(grade).returning();
    return created;
  }

  async updateGrade(id: number, value: number, reason?: string): Promise<Grade> {
    const [updated] = await db.update(grades)
      .set({ value, reason })
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  async getGrades(): Promise<Grade[]> {
    return await db.select().from(grades);
  }

  async getAllGradesWithDetails(classId: number): Promise<any[]> {
    const result = await db.select({
      gradeId: grades.id,
      value: grades.value,
      studentId: students.id,
      studentName: students.name,
      activityId: activities.id,
      activityName: activities.name
    })
      .from(grades)
      .innerJoin(students, eq(grades.studentId, students.id))
      .innerJoin(activities, eq(grades.activityId, activities.id))
      .where(eq(students.classId, classId));

    return result;
  }

  async getSystemStats(): Promise<{ teachers: number, classes: number, students: number }> {
    const [tCount] = await db.select({ count: sql<number>`count(*)` }).from(teachers);
    const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(classes);
    const [sCount] = await db.select({ count: sql<number>`count(*)` }).from(students);

    return {
      teachers: Number(tCount.count),
      classes: Number(cCount.count),
      students: Number(sCount.count)
    };
  }

  // --- Frequência DatabaseStorage ---
  async getAttendance(classId: number, date: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(and(eq(attendance.classId, classId), eq(attendance.date, date)));
  }

  async upsertAttendance(data: { studentId: number; classId: number; date: string; status: string }): Promise<Attendance> {
    const [existing] = await db.select().from(attendance)
      .where(and(eq(attendance.studentId, data.studentId), eq(attendance.date, data.date)));

    // Calcula pontos do novo status
    let newPoints = 0;
    if (data.status === "F") newPoints = -5;
    if (data.status === "A") newPoints = -2;

    let pointsApplied = existing ? existing.pointsApplied : 0;

    // Se já existia, reverte o desconto anterior
    if (existing && existing.status !== data.status && pointsApplied !== 0) {
      const student = await this.getStudentByName((await db.select({ name: students.name }).from(students).where(eq(students.id, data.studentId)))[0]?.name || "", data.classId);
      if (student) {
        await this.updateStudentExtraPoints(data.studentId, (student.extraPoints || 0) - pointsApplied, `Estorno correção frequência (${existing.status})`);
      }
      pointsApplied = 0;
    }

    // Aplica novo desconto se necessário
    if ((!existing || existing.status !== data.status) && newPoints !== 0) {
      const student = await this.getStudentByName((await db.select({ name: students.name }).from(students).where(eq(students.id, data.studentId)))[0]?.name || "", data.classId);
      if (student) {
        await this.updateStudentExtraPoints(data.studentId, (student.extraPoints || 0) + newPoints, `Desconto por ${data.status === 'F' ? 'falta' : 'atraso'}`);
      }
      pointsApplied = newPoints;
    } else if (newPoints === 0) {
      pointsApplied = 0;
    }

    if (existing) {
      const [updated] = await db.update(attendance)
        .set({ status: data.status, pointsApplied })
        .where(eq(attendance.id, existing.id)).returning();
      return updated;
    } else {
      const [newAtt] = await db.insert(attendance)
        .values({ ...data, pointsApplied }).returning();
      return newAtt;
    }
  }

  async getAttendanceReport(classId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async getStudentAttendance(studentId: number): Promise<Attendance[]> {
    // Busca apenas Faltas e Atrasos para o perfil do aluno
    return await db.select().from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.status} IN ('F', 'A')`
      )).orderBy(attendance.date);
  }

  async getSchedule(classId: number): Promise<ClassSchedule | undefined> {
    const [schedule] = await db.select().from(classSchedule).where(eq(classSchedule.classId, classId));
    return schedule;
  }

  async saveSchedule(classId: number, weekdays: string): Promise<void> {
    const existing = await this.getSchedule(classId);
    if (existing) {
      await db.update(classSchedule).set({ weekdays }).where(eq(classSchedule.id, existing.id));
    } else {
      await db.insert(classSchedule).values({ classId, weekdays });
    }
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

