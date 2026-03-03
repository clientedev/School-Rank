import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.dashboard.path, async (req, res) => {
    try {
      const allGrades = await storage.getAllGradesWithDetails();
      const activities = await storage.getActivities();
      const students = await storage.getStudents();
      const className = await storage.getSetting("class_name") || "Minha Turma";
      
      const studentMap = new Map<number, any>();
      
      // Initialize map with all students to ensure they show up even without grades
      students.forEach(s => {
        studentMap.set(s.id, {
          studentId: s.id,
          studentName: s.name,
          extraPoints: s.extraPoints || 0,
          sumGrades: 0,
          activitiesCount: 0,
          grades: []
        });
      });
      
      allGrades.forEach(g => {
        const s = studentMap.get(g.studentId);
        if (s) {
          s.sumGrades += g.value;
          s.activitiesCount += 1;
          s.grades.push({
            activityId: g.activityId,
            activityName: g.activityName,
            value: g.value,
            gradeId: g.gradeId
          });
        }
      });
      
      let classTotalPoints = 0;
      let classActivitiesCount = 0;
      
      const rankings = Array.from(studentMap.values()).map(s => {
        const rawAverage = s.activitiesCount > 0 ? s.sumGrades / s.activitiesCount : 0;
        const average = Math.min(rawAverage, 100);
        const totalPoints = s.sumGrades + s.extraPoints;
        
        classTotalPoints += totalPoints;
        classActivitiesCount += s.activitiesCount;
        
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          extraPoints: s.extraPoints,
          totalPoints,
          activitiesCount: s.activitiesCount,
          grades: s.grades,
          average
        };
      });
      
      // Sort by total points descending (as requested by user)
      rankings.sort((a, b) => b.totalPoints - a.totalPoints);
      
      // Add positions
      let classAverage = 0;
      let highestAverage = 0;
      let lowestAverage = 0;
      
      const finalizedRankings = rankings.map((r, index) => {
        if (index === 0) highestAverage = r.average;
        if (index === rankings.length - 1) lowestAverage = r.average;
        
        return {
          ...r,
          position: index + 1
        };
      });
      
      if (classActivitiesCount > 0) {
        classAverage = classTotalPoints / classActivitiesCount;
      }
      
      res.json({
        className,
        rankings: finalizedRankings,
        stats: {
          classAverage,
          highestAverage,
          lowestAverage
        },
        activities
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.settings.updateClassName.path, async (req, res) => {
    try {
      const { className } = api.settings.updateClassName.input.parse(req.body);
      await storage.updateSetting("class_name", className);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update class name" });
    }
  });

  app.post(api.activities.create.path, async (req, res) => {
    try {
      const input = api.activities.create.input.parse(req.body);
      const activity = await storage.createActivity(input);
      res.status(201).json(activity);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.post(api.grades.batchUpload.path, async (req, res) => {
    try {
      const { data } = api.grades.batchUpload.input.parse(req.body);
      
      for (const row of data) {
        // Find or create student
        let student = await storage.getStudentByName(row.studentName);
        if (!student) {
          student = await storage.createStudent({ name: row.studentName });
        }
        
        // Se houver atividade e valor, processa a nota
        if (row.activityName && row.value !== null) {
          // Parse numbers safely from potentially localized formats if needed (e.g. 8,5 -> 8.5)
          const valueStr = String(row.value).replace(',', '.');
          const numericValue = parseFloat(valueStr);
          
          if (isNaN(numericValue)) continue;
          
          // Find or create activity
          let activity = await storage.getActivityByName(row.activityName);
          if (!activity) {
            activity = await storage.createActivity({ name: row.activityName });
          }
          
          // Find or create/update grade
          const existingGrade = await storage.getGrade(student.id, activity.id);
          if (existingGrade) {
            await storage.updateGrade(existingGrade.id, numericValue);
          } else {
            await storage.createGrade({
              studentId: student.id,
              activityId: activity.id,
              value: numericValue
            });
          }
        }
      }
      
      res.json({ success: true, message: "Importação concluída com sucesso" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      console.error("Batch upload error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.grades.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { value, studentId, activityId, reason } = req.body;
      
      if (id === 0 && studentId && activityId) {
        // Create new grade if it doesn't exist
        const existing = await storage.getGrade(studentId, activityId);
        if (existing) {
          const updated = await storage.updateGrade(existing.id, value, reason);
          return res.json(updated);
        }
        const created = await storage.createGrade({
          studentId,
          activityId,
          value,
          reason
        } as any);
        return res.json(created);
      }

      const existing = await storage.getGradeById(id);
      if (!existing) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      const updated = await storage.updateGrade(id, value, reason);
      res.json(updated);
    } catch (err) {
      console.error("Grade update error:", err);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.post("/api/students/:id/points", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { points, reason } = req.body;
      const studentsList = await storage.getStudents();
      const student = studentsList.find(s => s.id === id);
      if (!student) return res.status(404).json({ message: "Student not found" });
      
      const updated = await storage.updateStudentExtraPoints(id, (student.extraPoints || 0) + points, reason || "Ajuste de pontos");
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update points" });
    }
  });

  app.get("/api/students/:id/logs", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const logs = await storage.getStudentLogs(id);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch student logs" });
    }
  });

  return httpServer;
}
