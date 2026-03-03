import { pgTable, text, serial, integer, real, unique, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Em um app real, usaríamos hash
  name: text("name").notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(), // Código para os alunos acessarem
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull(),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  activityId: integer("activity_id").notNull(),
  value: real("value").notNull(),
}, (t) => ({
  unq: unique().on(t.studentId, t.activityId)
}));

export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, code: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true });

export type Teacher = typeof teachers.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Grade = typeof grades.$inferSelect;
