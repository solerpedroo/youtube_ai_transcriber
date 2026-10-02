export type YoutubePlayerBridge = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

export type YoutubeIframeApi = {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YoutubePlayerBridge }) => void;
        onStateChange?: (event: { data: number; target: YoutubePlayerBridge }) => void;
      };
    },
  ) => YoutubePlayerBridge;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
};

declare global {
  interface Window {
    YT?: YoutubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YoutubeIframeApi> | null = null;

/** Loads the YouTube IFrame API once per page. */
export function loadYoutubeIframeApi(): Promise<YoutubeIframeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube IFrame API só está disponível no navegador."));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API indisponível."));
    };

    if (document.querySelector('script[data-youtube-iframe-api="true"]')) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.youtubeIframeApi = "true";
    script.onerror = () => reject(new Error("Não foi possível carregar a YouTube IFrame API."));
    document.head.append(script);
  });

  return apiPromise;
}
