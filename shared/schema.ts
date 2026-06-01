import { pgTable, text, serial, integer, real, unique, timestamp } from "drizzle-orm/pg-core";
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

// ----- Frequência -----
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  date: text("date").notNull(),          // "YYYY-MM-DD"
  status: text("status").notNull(),       // "P" | "F" | "A"
  pointsApplied: real("points_applied").notNull().default(0), // desconto já lançado
}, (t) => ({
  unq: unique().on(t.studentId, t.date)
}));

export const classSchedule = pgTable("class_schedule", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id).unique(),
  weekdays: text("weekdays").notNull().default(""), // "1,3,5" → seg,qua,sex
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertClassScheduleSchema = createInsertSchema(classSchedule).omit({ id: true });

export type Teacher = typeof teachers.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type ClassSchedule = typeof classSchedule.$inferSelect;

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;
