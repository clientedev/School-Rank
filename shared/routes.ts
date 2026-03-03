import { z } from "zod";
import { insertActivitySchema } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  dashboard: {
    method: 'GET' as const,
    path: '/api/dashboard' as const,
    responses: {
      200: z.object({
        className: z.string().optional(),
        rankings: z.array(z.object({
          studentId: z.number(),
          studentName: z.string(),
          average: z.number(),
          totalPoints: z.number(),
          activitiesCount: z.number(),
          position: z.number(),
          grades: z.array(z.object({
            activityId: z.number(),
            activityName: z.string(),
            value: z.number(),
            gradeId: z.number()
          }))
        })),
        stats: z.object({
          classAverage: z.number(),
          highestAverage: z.number(),
          lowestAverage: z.number(),
        }),
        activities: z.array(z.object({
          id: z.number(),
          name: z.string()
        }))
      })
    }
  },
  settings: {
    updateClassName: {
      method: 'POST' as const,
      path: '/api/settings/class-name' as const,
      input: z.object({ className: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  activities: {
    create: {
      method: 'POST' as const,
      path: '/api/activities' as const,
      input: insertActivitySchema,
      responses: {
        201: z.object({
          id: z.number(),
          name: z.string()
        }),
        400: errorSchemas.validation,
      }
    }
  },
  grades: {
    batchUpload: {
      method: 'POST' as const,
      path: '/api/grades/batch' as const,
      input: z.object({
        data: z.array(z.object({
          studentName: z.string(),
          activityName: z.string(),
          value: z.number()
        }))
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/grades/:id' as const,
      input: z.object({ value: z.number() }),
      responses: {
        200: z.object({
          id: z.number(),
          studentId: z.number(),
          activityId: z.number(),
          value: z.number()
        }),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
