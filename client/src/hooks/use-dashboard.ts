import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Validation failed for ${label}`);
  }
  return result.data;
}

export function useDashboard(classId?: number) {
  return useQuery({
    queryKey: [api.dashboard.path, classId],
    queryFn: async () => {
      const url = classId
        ? `${api.dashboard.path}?classId=${classId}`
        : api.dashboard.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      return parseWithLogging(api.dashboard.responses[200], data, "dashboard.get");
    },
  });
}


export function useBatchUploadGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.grades.batchUpload.input>) => {
      const validated = api.grades.batchUpload.input.parse(data);
      const res = await fetch(api.grades.batchUpload.path, {
        method: api.grades.batchUpload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message || "Validation error");
        }
        throw new Error("Failed to upload grades");
      }
      return parseWithLogging(api.grades.batchUpload.responses[200], await res.json(), "grades.batchUpload");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, studentId, activityId }: { id: number; value: number; studentId?: number; activityId?: number }) => {
      const url = buildUrl(api.grades.update.path, { id });
      const validated = api.grades.update.input.parse({ value, studentId, activityId });

      const res = await fetch(url, {
        method: api.grades.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update grade");
      return parseWithLogging(api.grades.update.responses[200], await res.json(), "grades.update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.activities.create.input>) => {
      const validated = api.activities.create.input.parse(data);
      const res = await apiRequest(
        api.activities.create.method,
        api.activities.create.path,
        validated
      );

      const jsonRes = await res.json();
      return parseWithLogging(api.activities.create.responses[201], jsonRes, "activities.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
    },
  });
}
