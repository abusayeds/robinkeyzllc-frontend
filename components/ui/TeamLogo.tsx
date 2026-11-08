import Image from "next/image";
import { avatarSrc } from "@/lib/avatar";

export default function TeamLogo({
  name,
  src,
  className = "h-9 w-9",
  rounded = "rounded-lg",
}: {
  name: string;
  src?: string | null;
  className?: string;
  rounded?: string;
}) {
  // An uploaded logo is stored as a path relative to the API host, so a raw
  // one would be fetched from the web app's own origin and 404. Resolving it
  // here rather than in each caller is why only the one page that remembered
  // to do it used to show a crest. A full URL passes through untouched.
  const resolved = avatarSrc(src);

  if (resolved) {
    return (
      <span
        className={`relative shrink-0 overflow-hidden bg-white ${rounded} ${className}`}
      >
        {/* Uploaded logos are served from the API host, which is not a
            configured image domain, so they bypass the optimizer like every
            other API-served image in the app. */}
        <Image
          src={resolved}
          alt={name}
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-brand-forest text-sm font-bold text-brand-accent ${rounded} ${className}`}
    >
      {name.charAt(0)}
    </span>
  );
}
