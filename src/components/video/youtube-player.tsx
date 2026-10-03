"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loadYoutubeIframeApi, type YoutubePlayerBridge } from "@/lib/youtube/iframe-api";

export type YoutubePlayerHandle = {
  seekTo: (seconds: number) => boolean;
};

type YoutubePlayerProps = {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
};

export const YoutubePlayer = forwardRef<YoutubePlayerHandle, YoutubePlayerProps>(
  function YoutubePlayer({ videoId, onTimeUpdate, className }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YoutubePlayerBridge | null>(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const pollTimerRef = useRef<number | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        const player = playerRef.current;
        if (!player) return false;
        try {
          player.seekTo(Math.max(0, seconds), true);
          player.playVideo();
          return true;
        } catch {
          return false;
        }
      },
    }), []);

    useEffect(() => {
      let cancelled = false;
      const host = hostRef.current;
      if (!host || !videoId) return;
      if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
        setError("ID de vídeo do YouTube inválido.");
        return;
      }

      setError(null);

      void loadYoutubeIframeApi()
        .then((YT) => {
          if (cancelled || !hostRef.current) return;
          hostRef.current.replaceChildren();
          const mount = document.createElement("div");
          hostRef.current.append(mount);

          playerRef.current = new YT.Player(mount, {
            videoId,
            width: "100%",
            height: "100%",
            playerVars: {
              enablejsapi: 1,
              origin: window.location.origin,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: () => {
                if (cancelled) return;
                if (pollTimerRef.current !== undefined) {
                  window.clearInterval(pollTimerRef.current);
                }
                pollTimerRef.current = window.setInterval(() => {
                  if (cancelled) return;
                  const player = playerRef.current;
                  if (!player) return;
                  try {
                    onTimeUpdateRef.current?.(player.getCurrentTime());
                  } catch {
                    // Player may be destroyed during teardown.
                  }
                }, 400);
              },
            },
          });
        })
        .catch((loadError: unknown) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o player.");
          }
        });

      return () => {
        cancelled = true;
        if (pollTimerRef.current !== undefined) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = undefined;
        }
        try {
          playerRef.current?.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      };
    }, [videoId]);

    return (
      <div className={className}>
        <div ref={hostRef} className="aspect-video w-full bg-black" />
        {error && (
          <p className="border-t border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>
        )}
      </div>
    );
  },
);
