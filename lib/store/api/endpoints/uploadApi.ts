import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse, UploadedFile } from "../types";

export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024;

export const UPLOAD_ACCEPT_IMAGE = ".jpg,.jpeg,.png,.webp,.gif,.svg";
export const UPLOAD_ACCEPT_CSV = ".csv,text/csv";

// Checked before the request so an oversized or wrong-typed file never leaves
// the browser; the server enforces the same limits again.
export const validateUploadFile = (
  file: File,
  accept = UPLOAD_ACCEPT_IMAGE,
) => {
  if (file.size > UPLOAD_MAX_SIZE) {
    return `${file.name} is larger than 5 MB.`;
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const allowed = accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.startsWith("."));

  if (allowed.length && !allowed.includes(extension)) {
    return `${extension} files are not allowed.`;
  }

  return null;
};

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // FormData is passed through untouched: fetchBaseQuery leaves the body
    // alone and lets the browser set the multipart boundary itself.
    uploadFile: builder.mutation<UploadedFile, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: "/upload", method: "POST", body: formData };
      },
      transformResponse: (response: ApiResponse<UploadedFile>) =>
        unwrap(response),
    }),

    uploadFiles: builder.mutation<UploadedFile[], File[]>({
      query: (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        return { url: "/upload/multiple", method: "POST", body: formData };
      },
      transformResponse: (response: ApiResponse<UploadedFile[]>) =>
        unwrap(response),
    }),

    deleteFile: builder.mutation<unknown, string>({
      query: (path) => ({
        url: "/upload",
        method: "DELETE",
        params: { path },
      }),
    }),
  }),
});

export const {
  useUploadFileMutation,
  useUploadFilesMutation,
  useDeleteFileMutation,
} = uploadApi;
