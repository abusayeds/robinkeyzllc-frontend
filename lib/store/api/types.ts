export type ApiPagination = {
  page?: number;
  limit?: number;
  totalItem?: number;
  totalPage?: number;
  currentPage?: number;
  prevPage?: number;
  nextPage?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message?: string;
  pagination?: ApiPagination;
  data: T;
};

export type ApiErrorSource = {
  path: string;
  message: string;
};

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  errorSources?: ApiErrorSource[];
  path?: string;
  timestamp?: string;
};

export type PlatformRole = "user" | "superAdmin";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  image?: string | null;
  role: PlatformRole;
  isEmailVerified: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TokenOnly = {
  token: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

export type UploadedFile = {
  path: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type ListResult<T> = {
  items: T[];
  pagination?: ApiPagination;
};

export type ListQuery = {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sort?: string;
  fields?: string;
  [key: string]: string | number | boolean | undefined;
};
