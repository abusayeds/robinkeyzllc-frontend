"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiVolume2, FiVolumeX } from "react-icons/fi";

const VOLUME = 0.4;

/**
 * Stop playback before the "Define your Vision" tagline fades in, so the
 * frozen frame is the logo alone.
 *
 * Measured against the clip rather than its end: the file runs about ten
 * seconds and the tagline starts shortly after six, so this leaves room for
 * the fade to begin without being seen.
 */
const CUTOFF_SECONDS = 5.6;

export default function OnboardingView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);

  const stop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setEnded(true);
  }, []);

  // Start it here rather than with `autoPlay`, because only play() hands back
  // a promise — and a refusal is the one thing this needs to know about.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = VOLUME;
    video.muted = false;

    video.play().catch(() => {
      // Chrome and Safari refuse to start a clip with sound until the visitor
      // has interacted with the site, and a first-time visitor never has. A
      // silent clip that plays beats a loud one that does not, so it falls
      // back and the unmute button is there for anyone who wants it.
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => {});
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // `timeupdate` only fires about every 250ms, which is long enough for the
    // tagline to appear before the pause lands. Where the browser offers
    // per-frame callbacks the cut is exact; `timeupdate` stays as the fallback.
    const withFrames = typeof video.requestVideoFrameCallback === "function";

    let handle = 0;
    function onFrame() {
      const video = videoRef.current;
      if (!video) return;
      if (video.currentTime >= CUTOFF_SECONDS) {
        stop();
        return;
      }
      handle = video.requestVideoFrameCallback(onFrame);
    }

    function onTimeUpdate() {
      const video = videoRef.current;
      if (video && video.currentTime >= CUTOFF_SECONDS) stop();
    }

    if (withFrames) {
      handle = video.requestVideoFrameCallback(onFrame);
    } else {
      video.addEventListener("timeupdate", onTimeUpdate);
    }

    return () => {
      if (withFrames) video.cancelVideoFrameCallback?.(handle);
      else video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [stop]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.volume = VOLUME;
    video.muted = next;
    // Unmuting is a click, so the browser allows sound from here on.
    if (!next && video.currentTime < CUTOFF_SECONDS) {
      void video.play().catch(() => {});
    }
    setMuted(next);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/image/Onboarding2.mp4"
        poster="/image/Onboarding.png"
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
