"use client";

import Image from "next/image";
import { avatarSrc, initials } from "@/lib/avatar";

/**
 * A player's picture, drawn as the approved design draws it: a rounded
 * square rather than a circle, and his initials where the feed has no
 * picture of him — balldontlie leaves plenty of them blank.
 */
export default function PlayerHeadshot({
  name,
  src,
  className = "h-9 w-9",
  rounded = "rounded-lg",
}: {
  name: string;
  src: string | null | undefined;
  className?: string;
  rounded?: string;
}) {
  const resolved = avatarSrc(src);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-brand-border bg-brand-soft text-[10px] font-bold text-brand-muted ${rounded} ${className}`}
    >
      {resolved ? (
        <Image
          src={resolved}
          alt={name}
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
