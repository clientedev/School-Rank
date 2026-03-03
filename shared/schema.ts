import { pgTable, text, serial, integer, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("teacher"),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  teacherId: integer("teacher_id").references(() => teachers.id),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  extraPoints: real("extra_points").default(0).notNull(),
  classId: integer("class_id").notNull().references(() => classes.id),
});

export const studentLogs = pgTable("student_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  points: real("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull().references(() => classes.id),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  value: real("value").notNull(),
  reason: text("reason"),
}, (t) => ({
  unq: unique().on(t.studentId, t.activityId)
}));

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  classId: integer("class_id").references(() => classes.id),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export type Teacher = typeof teachers.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
