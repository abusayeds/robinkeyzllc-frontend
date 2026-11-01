import Image from "next/image";

export default function TeamLogo({
  name,
  src,
  className = "h-9 w-9",
  rounded = "rounded-lg",
}: {
  name: string;
  src?: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      <span
        className={`relative shrink-0 overflow-hidden bg-white ${rounded} ${className}`}
      >
        {/* Uploaded logos are served from the API host, which is not a
            configured image domain, so they bypass the optimizer like every
            other API-served image in the app. */}
        <Image
          src={src}
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
