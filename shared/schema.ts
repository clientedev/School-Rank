import { pgTable, text, serial, integer, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  activityId: integer("activity_id").notNull(),
  value: real("value").notNull(),
}, (t) => ({
  unq: unique().on(t.studentId, t.activityId)
}));

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export type Student = typeof students.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
