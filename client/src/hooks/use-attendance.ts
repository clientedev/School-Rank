import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

export function useAttendance(classId: number, date: string) {
    return useQuery({
        queryKey: [api.attendance.getDaily.path, classId, date],
        queryFn: async () => {
            const res = await fetch(`${api.attendance.getDaily.path}?classId=${classId}&date=${date}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch attendance");
            return res.json() as Promise<z.infer<typeof api.attendance.getDaily.responses[200]>>;
        },
        enabled: !!classId && !!date,
    });
}

export function useAttendanceReport(classId: number) {
    return useQuery({
        queryKey: [api.attendance.getReport.path, classId],
        queryFn: async () => {
            const res = await fetch(`${api.attendance.getReport.path}?classId=${classId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch report");
            return res.json() as Promise<z.infer<typeof api.attendance.getReport.responses[200]>>;
        },
        enabled: !!classId,
    });
}

export function useStudentAttendance(studentId: number) {
    return useQuery({
        queryKey: ["/api/attendance/student", studentId],
        queryFn: async () => {
            const res = await fetch(`/api/attendance/student/${studentId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch student attendance");
            return res.json() as Promise<z.infer<typeof api.attendance.getReport.responses[200]>>;
        },
        enabled: !!studentId,
    });
}

export function useSchedule(classId: number) {
    return useQuery({
        queryKey: [api.attendance.getSchedule.path, classId],
        queryFn: async () => {
            const res = await fetch(`${api.attendance.getSchedule.path}?classId=${classId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch schedule");
            return res.json() as Promise<z.infer<typeof api.attendance.getSchedule.responses[200]>>;
        },
        enabled: !!classId,
    });
}

export function useSaveAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: z.infer<typeof api.attendance.save.input>) => {
            const res = await apiRequest(
                api.attendance.save.method,
                api.attendance.save.path,
                data
            );
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [api.attendance.getDaily.path, variables.classId, variables.date] });
            queryClient.invalidateQueries({ queryKey: [api.attendance.getReport.path, variables.classId] });
            // Invalidate dashboard to reflect point changes
            queryClient.invalidateQueries({ queryKey: [api.dashboard.path] });
        },
    });
}

export function useSaveSchedule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: z.infer<typeof api.attendance.saveSchedule.input>) => {
            const res = await apiRequest(
                api.attendance.saveSchedule.method,
                api.attendance.saveSchedule.path,
                data
            );
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [api.attendance.getSchedule.path, variables.classId] });
        },
    });
}
