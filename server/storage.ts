import { db } from "./db";
import { 
  students, activities, grades, settings, studentLogs, classes,
  type Student, type Activity, type Grade, type Class,
  type InsertStudent, type InsertActivity, type InsertGrade, type InsertClass 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Classes
  createClass(c: InsertClass): Promise<Class>;
  getClass(id: number): Promise<Class | undefined>;
  getClassByName(name: string): Promise<Class | undefined>;
  getClasses(): Promise<Class[]>;

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
}

export class DatabaseStorage implements IStorage {
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

  async getClasses(): Promise<Class[]> {
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
}

export const storage = new DatabaseStorage();
