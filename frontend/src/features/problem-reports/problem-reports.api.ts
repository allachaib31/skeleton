import { api } from '@/shared/lib/api/axios';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { ApiResponse } from '@/shared/types/api.types';
import {
  AdminProblemReportMessageRequest,
  CreateProblemReportRequest,
  ProblemReport,
  ProblemReportDetail,
  ProblemReportMessageRequest,
  ProblemReportPriority,
  ProblemReportQuery,
  ProblemReportStatus,
} from './problem-reports.types';

export const getProblemReports = async (params: ProblemReportQuery): Promise<ApiResponse<ProblemReport[]>> => {
  const response = await api.get(API_ENDPOINTS.PROBLEM_REPORTS.LIST, { params: cleanParams(params) });
  return response.data;
};

export const getProblemReport = async (id: string): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.get(API_ENDPOINTS.PROBLEM_REPORTS.BY_ID(id));
  return response.data;
};

export const createProblemReport = async (payload: CreateProblemReportRequest): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.post(API_ENDPOINTS.PROBLEM_REPORTS.LIST, payload);
  return response.data;
};

export const addProblemReportMessage = async (id: string, payload: ProblemReportMessageRequest): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.post(API_ENDPOINTS.PROBLEM_REPORTS.MESSAGES(id), payload);
  return response.data;
};

export const closeProblemReport = async (id: string): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.patch(API_ENDPOINTS.PROBLEM_REPORTS.CLOSE(id));
  return response.data;
};

export const getAdminProblemReports = async (params: ProblemReportQuery): Promise<ApiResponse<ProblemReport[]>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.PROBLEM_REPORTS, { params: cleanParams(params) });
  return response.data;
};

export const getAdminProblemReport = async (id: string): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.PROBLEM_REPORT_BY_ID(id));
  return response.data;
};

export const addAdminProblemReportMessage = async (id: string, payload: AdminProblemReportMessageRequest): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.post(API_ENDPOINTS.ADMIN.PROBLEM_REPORT_MESSAGES(id), payload);
  return response.data;
};

export const assignAdminProblemReport = async (id: string, assignedAdminId?: string): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.PROBLEM_REPORT_ASSIGN(id), { assignedAdminId });
  return response.data;
};

export const updateAdminProblemReportStatus = async (
  id: string,
  status: ProblemReportStatus,
  resolutionNote?: string,
): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.PROBLEM_REPORT_STATUS(id), { status, resolutionNote });
  return response.data;
};

export const updateAdminProblemReportPriority = async (
  id: string,
  priority: ProblemReportPriority,
): Promise<ApiResponse<ProblemReportDetail>> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.PROBLEM_REPORT_PRIORITY(id), { priority });
  return response.data;
};

const cleanParams = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
