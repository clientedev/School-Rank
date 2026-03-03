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
      
      const studentMap = new Map<number, any>();
      
      allGrades.forEach(g => {
        if (!studentMap.has(g.studentId)) {
          studentMap.set(g.studentId, {
            studentId: g.studentId,
            studentName: g.studentName,
            totalPoints: 0,
            activitiesCount: 0,
            grades: []
          });
        }
        
        const s = studentMap.get(g.studentId)!;
        s.totalPoints += g.value;
        s.activitiesCount += 1;
        s.grades.push({
          activityId: g.activityId,
          activityName: g.activityName,
          value: g.value,
          gradeId: g.gradeId
        });
      });
      
      let classTotalPoints = 0;
      let classActivitiesCount = 0;
      
      const rankings = Array.from(studentMap.values()).map(s => {
        const average = s.activitiesCount > 0 ? s.totalPoints / s.activitiesCount : 0;
        
        classTotalPoints += s.totalPoints;
        classActivitiesCount += s.activitiesCount;
        
        return {
          ...s,
          average
        };
      });
      
      // Sort by average descending
      rankings.sort((a, b) => b.average - a.average);
      
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
        // Parse numbers safely from potentially localized formats if needed (e.g. 8,5 -> 8.5)
        const valueStr = String(row.value).replace(',', '.');
        const numericValue = parseFloat(valueStr);
        
        if (isNaN(numericValue)) continue; // skip invalid grades
        
        // Find or create student
        let student = await storage.getStudentByName(row.studentName);
        if (!student) {
          student = await storage.createStudent({ name: row.studentName });
        }
        
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
      
      res.json({ success: true, message: "Batch uploaded successfully" });
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
      const { value } = api.grades.update.input.parse(req.body);
      
      const existing = await storage.getGradeById(id);
      if (!existing) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      const updated = await storage.updateGrade(id, value);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  return httpServer;
}
