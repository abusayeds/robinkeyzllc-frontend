import Image from "next/image";

export default function AuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-black lg:flex">
        <div className="relative aspect-[1500/1040] w-full max-w-lg px-12">
          <Image
            src="/image/logo-cropped.png"
            alt="AVORA — Define your vision, experience the reality"
            fill
            priority
            sizes="50vw"
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
