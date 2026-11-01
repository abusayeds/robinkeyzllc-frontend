import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse, ListQuery, ListResult } from "../types";

export type ManagementType = "about" | "terms" | "privacy";

export type ManagementPage = {
  id: number;
  type: ManagementType;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export const managementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getManagementByType: builder.query<ManagementPage | null, ManagementType>({
      query: (type) => ({ url: "/management", params: { type } }),
      transformResponse: (response: ApiResponse<ManagementPage | null>) =>
        unwrap(response),
      providesTags: (_result, _error, type) => [
        { type: "Management", id: type },
      ],
    }),

    managementList: builder.query<ListResult<ManagementPage>, ListQuery | void>(
      {
        query: (params) => ({
          url: "/management/list",
          params: params ?? {},
        }),
        transformResponse: (response: ApiResponse<ManagementPage[]>) => ({
          items: response.data ?? [],
          pagination: response.pagination,
        }),
        providesTags: ["Management"],
      },
    ),

    saveManagement: builder.mutation<
      ManagementPage,
      { type: ManagementType; description: string }
    >({
      query: (body) => ({
        url: "/management/create",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ManagementPage>) =>
        unwrap(response),
      invalidatesTags: (_result, _error, { type }) => [
        "Management",
        { type: "Management", id: type },
      ],
    }),
  }),
});

export const {
  useGetManagementByTypeQuery,
  useManagementListQuery,
  useSaveManagementMutation,
} = managementApi;
