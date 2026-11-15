import Image from "next/image";
import Link from "next/link";

export default function AccountCreatedView() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-dark px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,255,107,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,255,107,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
        {/* The mark fills the circle rather than floating in the middle of
            it: a 40px image inside a 64px circle read as a mistake. The same
            icon the sidebar uses, so the brand is one file. */}
        <div className="relative mx-auto mb-6 h-16 w-16 overflow-hidden rounded-full bg-white/10">
          <Image
            src="/image/logo-icon.png"
            alt="AVORA"
            fill
            sizes="64px"
            className="object-cover p-1.5"
          />
        </div>

        <h1 className="text-xl font-bold text-white">
          Account <span className="text-brand-cta">created!</span> 🎉
        </h1>
        <p className="mt-3 text-sm text-white/70">
          Your profile has been created successfully. We have sent an email to
          your inbox confirming account registration.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          TO ENTER
        </Link>
      </div>
    </div>
  );
}
