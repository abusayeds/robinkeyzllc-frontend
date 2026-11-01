import { API_URL } from "@/lib/store/api";

// Uploaded files are served from the API host, and stored paths are kept
// relative so they survive a change of domain.
const ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export const avatarSrc = (path: string | null | undefined) =>
  path && path.startsWith("/public/") ? `${ORIGIN}${path}` : path || null;

export const initials = (name: string | null | undefined) =>
  (name ?? "")
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
