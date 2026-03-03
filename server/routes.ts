import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStoreFactory from "memorystore";

const MemoryStore = MemoryStoreFactory(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000
    }),
    resave: false,
    saveUninitialized: false,
    secret: "ranking-secret-key"
  }));

  app.post("/api/login", async (req, res) => {
    const { className, password } = req.body;
    const c = await storage.getClassByName(className);
    if (!c || c.password !== password) {
      return res.status(401).json({ message: "Turma ou senha inválida" });
    }
    (req.session as any).classId = c.id;
    res.json({ success: true, classId: c.id });
  });

  app.post("/api/classes", async (req, res) => {
    const { name, password } = req.body;
    const existing = await storage.getClassByName(name);
    if (existing) return res.status(400).json({ message: "Turma já existe" });
    const created = await storage.createClass({ name, password });
    (req.session as any).classId = created.id;
    res.json(created);
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.classId) return res.status(401).json({ message: "Não autorizado" });
    next();
  };

  app.get(api.dashboard.path, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.query.classId);
      if (!classId) return res.status(400).json({ message: "Turma não especificada" });

      const allGrades = await storage.getAllGradesWithDetails(classId);
      const activities = await storage.getActivities(classId);
      const students = await storage.getStudents(classId);
      const c = await storage.getClass(classId);
      const className = c?.name || "Minha Turma";
      
      const studentMap = new Map<number, any>();
      
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
      
      rankings.sort((a, b) => b.totalPoints - a.totalPoints);
      
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
      
      let classAverage = 0;
      if (classActivitiesCount > 0) {
        classAverage = classTotalPoints / classActivitiesCount;
      }
      
      res.json({
        className,
        classId,
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

  app.post(api.settings.updateClassName.path, requireAuth, async (req, res) => {
    try {
      const { className } = api.settings.updateClassName.input.parse(req.body);
      const classId = (req.session as any).classId;
      await storage.updateSetting("class_name", className, classId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update class name" });
    }
  });

  app.post(api.activities.create.path, requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId;
      const input = api.activities.create.input.parse(req.body);
      const activity = await storage.createActivity({ ...input, classId });
      res.status(201).json(activity);
    } catch (err) {
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.post(api.grades.batchUpload.path, requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId;
      const { data } = api.grades.batchUpload.input.parse(req.body);
      
      for (const row of data) {
        let student = await storage.getStudentByName(row.studentName, classId);
        if (!student) {
          student = await storage.createStudent({ name: row.studentName, classId, extraPoints: 0 });
        }
        
        if (row.activityName && row.value !== null) {
          const numericValue = parseFloat(String(row.value).replace(',', '.'));
          if (isNaN(numericValue)) continue;
          
          let activity = await storage.getActivityByName(row.activityName, classId);
          if (!activity) {
            activity = await storage.createActivity({ name: row.activityName, classId });
          }
          
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
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.grades.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { value, reason } = req.body;
      const updated = await storage.updateGrade(id, value, reason);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.post("/api/students/:id/points", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { points, reason } = req.body;
      const updated = await storage.updateStudentExtraPoints(id, points, reason);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update points" });
    }
  });

  app.get("/api/students/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getStudentLogs(Number(req.params.id));
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch student logs" });
    }
  });

  return httpServer;
}
