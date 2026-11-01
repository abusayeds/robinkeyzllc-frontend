"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiVolume2, FiVolumeX } from "react-icons/fi";

const VOLUME = 0.4;
// Stop playback right before the "Define your Vision" tagline appears,
// instead of the full ~10s clip.
const CUTOFF_SECONDS = 6;

export default function OnboardingView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = VOLUME;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onTimeUpdate() {
      if (video && video.currentTime >= CUTOFF_SECONDS) {
        video.pause();
        setEnded(true);
      }
    }
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.volume = VOLUME;
    video.muted = next;
    if (!next) video.play().catch(() => {});
    setMuted(next);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/image/Onboarding2.mp4"
        poster="/image/Onboarding.png"
        autoPlay
        muted
        playsInline
        onEnded={() => setEnded(true)}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="absolute inset-0 bg-black/25" />

      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
      >
        {muted ? (
          <FiVolumeX className="h-5 w-5" />
        ) : (
          <FiVolume2 className="h-5 w-5" />
        )}
      </button>

      <div className="relative flex min-h-screen flex-col items-center justify-end px-6 pb-14 text-center sm:pb-20">
        <Link
          href="/register"
          aria-hidden={!ended}
          tabIndex={ended ? 0 : -1}
          className={`mt-10 inline-flex items-center justify-center rounded-full bg-brand-cta px-12 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-cta/30 transition-all duration-500 hover:bg-brand-cta-dark ${
            ended
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
