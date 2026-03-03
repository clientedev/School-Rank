import { db } from "./db";
import { 
  students, activities, grades,
  type Student, type Activity, type Grade,
  type InsertStudent, type InsertActivity, type InsertGrade 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudentByName(name: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudents(): Promise<Student[]>;

  // Activities
  getActivityByName(name: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(): Promise<Activity[]>;

  // Grades
  getGrade(studentId: number, activityId: number): Promise<Grade | undefined>;
  getGradeById(id: number): Promise<Grade | undefined>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, value: number): Promise<Grade>;
  getGrades(): Promise<Grade[]>;
  getAllGradesWithDetails(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getStudentByName(name: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.name, name));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getActivityByName(name: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.name, name));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
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

  async updateGrade(id: number, value: number): Promise<Grade> {
    const [updated] = await db.update(grades)
      .set({ value })
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  async getGrades(): Promise<Grade[]> {
    return await db.select().from(grades);
  }

  async getAllGradesWithDetails(): Promise<any[]> {
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
    .innerJoin(activities, eq(grades.activityId, activities.id));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
