"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { screenshotUrl } from "@/lib/screenshot-url";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlayOnHover?: boolean;
}

export function VideoPlayer({ src, poster, className = "", autoPlayOnHover = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);

  const videoSrc = screenshotUrl(src) || src;
  const posterSrc = poster ? screenshotUrl(poster) : undefined;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }, []);

  // Auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (!autoPlayOnHover) return;
    const video = videoRef.current;
    if (video && video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [autoPlayOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (!autoPlayOnHover) return;
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [autoPlayOnHover]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = isLooping;
  }, [isLooping]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`group relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="h-full w-full object-contain"
        playsInline
        muted
        preload="metadata"
      />

      {/* Controls overlay */}
      {!autoPlayOnHover && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Scrub bar */}
          <div
            className="mb-2 h-1 cursor-pointer rounded-full bg-white/20"
            onClick={handleScrub}
          >
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white/80 hover:text-white">
                {isPlaying ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              {/* Time */}
              <span className="font-mono text-[10px] text-white/60">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Loop toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`text-[10px] ${isLooping ? "text-white" : "text-white/40"}`}
              >
                Loop
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white/60 hover:text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play icon overlay for hover mode */}
      {autoPlayOnHover && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-2">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
