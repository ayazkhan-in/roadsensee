import { parseLatLngLabel, reverseGeocode } from "@/lib/location";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
let accessToken = "";

export function setAccessToken(token: string) {
  accessToken = token;
}

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "citizen" | "admin";
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Complaint = {
  id: string;
  type: string;
  description?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  status: string;
  location: string;
  imageUrl?: string;
  coordinates?: [number, number];
  createdAt?: string;
  updatedAt?: string;
  reporterName?: string;
  category?: string;
  assignedOfficer?: { id: string; name: string; email: string };
  resolution?: { notes: string; resolvedDate?: string };
  priorityTag?: "HIGH" | "MEDIUM" | "LOW";
};

export type TimelineEvent = {
  state: string;
  at: string;
};

export type AdminSummary = {
  totalComplaints: number;
  pending: number;
  inProgress: number;
  resolved: number;
};

export type ActivityLogEntry = {
  time: string;
  complaintId: string;
  action: string;
};

export type PublicMapData = {
  pins: Array<{ id: string; coordinates: [number, number]; severity: "HIGH" | "MEDIUM" | "LOW" }>;
  heatmapSummary: { high: number; medium: number; low: number };
};

export type AdminMapData = {
  clusters: Array<{ area: string; count: number }>;
};

export type AdminPriorityQueueItem = {
  id: string;
  score: number;
  reason: string;
};

export type AdminAnalytics = {
  averageResolutionHours: number;
  highRiskZone: string;
  closureRate: number;
};

export type DuplicateCheckResponse = {
  duplicate: boolean;
  matches: Array<{ complaintId: string; type: string; location: string }>;
};

export type AssignmentSuggestion = {
  recommendedTeam: string;
  etaHours: number;
};

export type RepairVerification = {
  verified: boolean;
  confidence: number;
  message: string;
};

export type AssistantChatResponse = {
  reply: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormDataBody = options?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormDataBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: formData,
  });
}

async function normalizeComplaintLocation(complaint: Complaint): Promise<Complaint> {
  const parsedFromLabel = parseLatLngLabel(complaint.location);
  const parsedFromCoordinates = complaint.coordinates
    ? { lat: complaint.coordinates[1], lng: complaint.coordinates[0] }
    : null;

  const source = parsedFromLabel || parsedFromCoordinates;
  if (!source) {
    return complaint;
  }

  const placeName = await reverseGeocode(source.lat, source.lng);
  if (!placeName) {
    return complaint;
  }

  return {
    ...complaint,
    location: placeName,
  };
}

export const api = {
  register: (payload: { name: string; email: string; password: string }) => apiPost<AuthResponse>("/auth/register", payload),
  login: (payload: { email: string; password: string }) => apiPost<AuthResponse>("/auth/login", payload),
  adminLogin: (payload: { email: string; password: string }) => apiPost<AuthResponse>("/auth/admin/login", payload),
  getMe: () => apiGet<AuthUser>("/auth/me"),

  analyzeIssue: (payload: { description?: string; issueType?: string; imageUrl?: string }) => apiPost<{ classification: string; severity: "HIGH" | "MEDIUM" | "LOW"; confidence: number; explanation: string }>("/ai/analyze-image", payload),
  assistantChat: (payload: { message: string }) => apiPost<AssistantChatResponse>("/ai/assistant-chat", payload),
  detectDuplicate: (payload: { lat: number; lng: number; type: string }) =>
    apiPost<DuplicateCheckResponse>("/ai/duplicate-detect", payload),
  getAssignmentSuggestion: (payload: { severity: "HIGH" | "MEDIUM" | "LOW" }) =>
    apiPost<AssignmentSuggestion>("/ai/assignment-suggest", payload),
  verifyRepair: (payload: { complaintId: string; beforeImageUrl?: string; afterImageUrl?: string; notes?: string }) =>
    apiPost<RepairVerification>("/ai/repair-verify", payload),

  getComplaints: async () => {
    const complaints = await apiGet<Complaint[]>("/complaints");
    return Promise.all(complaints.map(normalizeComplaintLocation));
  },
  createComplaint: (payload: {
    type: string;
    description?: string;
    location: string;
    lat: number;
    lng: number;
    severity?: "HIGH" | "MEDIUM" | "LOW";
    imageUrl?: string;
  }) => apiPost<Complaint>("/complaints", payload),
  uploadComplaintImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiPostFormData<{ imageUrl: string; publicId: string }>("/uploads/image", formData);
  },
  getComplaintById: async (id: string) => {
    const complaint = await apiGet<Complaint>(`/complaints/${id}`);
    return normalizeComplaintLocation(complaint);
  },
  getComplaintTimeline: (id: string) => apiGet<TimelineEvent[]>(`/complaints/${id}/timeline`),
  confirmComplaint: (id: string) => apiPost<Complaint>(`/complaints/${id}/confirm`, {}),
  updateComplaintStatus: (id: string, payload: { status: string }) => apiPatch<{ status: string }>(`/admin/complaints/${id}/status`, payload),
  
  // Admin action endpoints
  verifyComplaint: (id: string) => apiPatch<Complaint>(`/admin/complaints/${id}/verify`, {}),
  rejectComplaint: (id: string, reason?: string) => apiPatch<Complaint>(`/admin/complaints/${id}/reject`, { reason }),
  assignComplaint: (id: string, payload: { departmentId: string; deadline: string; notes?: string }) =>
    apiPatch<Complaint>(`/admin/complaints/${id}/assign`, {
      assignedTo: payload.departmentId,
      deadline: payload.deadline,
      notes: payload.notes,
    }),
  resolveComplaint: (id: string, beforeImageUrl?: string, afterImageUrl?: string) =>
    apiPost<Complaint>(`/admin/resolution/${id}`, { beforeImageUrl, afterImageUrl }),
  
  getOfficers: () => apiGet<Array<{ id: string; name: string; email: string; department: string }>>("/admin/officers"),
  assignComplaintToOfficer: (id: string, payload: { officerId: string }) =>
    apiPatch<Complaint>(`/admin/complaints/${id}/assign-officer`, payload),
  addComplaintResolution: (id: string, payload: { notes: string; resolvedDate: string }) =>
    apiPost<Complaint>(`/admin/resolution/${id}`, payload),
  getPublicMapData: () => apiGet<PublicMapData>("/complaints/public/map"),
  getAdminSummary: () => apiGet<AdminSummary>("/admin/dashboard/summary"),
  getAdminActivityLog: () => apiGet<ActivityLogEntry[]>("/admin/activity-log"),
  getAdminPriorityQueue: () => apiGet<AdminPriorityQueueItem[]>("/admin/priority-queue"),
  getAdminMapData: () => apiGet<AdminMapData>("/admin/map"),
  getAdminAnalytics: () => apiGet<AdminAnalytics>("/admin/analytics"),
};
