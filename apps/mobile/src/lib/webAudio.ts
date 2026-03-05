import { useEffect, useRef, useState } from "react";

export type WebAudioStatus = {
  playing: boolean;
  currentTime: number;
  duration: number;
  didJustFinish: boolean;
  ready: boolean;
};

type WebAudioPlayer = {
  status: WebAudioStatus;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (seconds: number) => Promise<void>;
};

const INITIAL_STATUS: WebAudioStatus = {
  playing: false,
  currentTime: 0,
  duration: 0,
  didJustFinish: false,
  ready: false,
};

export function useWebAudioPlayer(sourceUri: string | null, loop: boolean): WebAudioPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<WebAudioStatus>(INITIAL_STATUS);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  useEffect(() => {
    const previousAudio = audioRef.current;
    if (previousAudio) {
      previousAudio.pause();
      previousAudio.src = "";
      audioRef.current = null;
    }

    if (!sourceUri || typeof Audio === "undefined") {
      setStatus(INITIAL_STATUS);
      return;
    }

    const audio = new Audio(sourceUri);
    audio.loop = loop;
    audio.preload = "auto";
    audioRef.current = audio;

    const updateStatus = (overrides?: Partial<WebAudioStatus>) => {
      const duration = asPositiveNumber(audio.duration);
      const currentTime = Math.min(asPositiveNumber(audio.currentTime), duration > 0 ? duration : Number.MAX_VALUE);

      setStatus((previous) => ({
        ...previous,
        ready: true,
        playing: !audio.paused && !audio.ended,
        currentTime,
        duration,
        ...overrides,
      }));
    };

    const onLoadedMetadata = () => updateStatus({ didJustFinish: false });
    const onDurationChange = () => updateStatus();
    const onTimeUpdate = () => updateStatus();
    const onPlay = () => updateStatus({ didJustFinish: false });
    const onPause = () => updateStatus();
    const onEnded = () =>
      updateStatus({
        playing: false,
        didJustFinish: true,
        currentTime: asPositiveNumber(audio.duration),
      });
    const onError = () => setStatus(INITIAL_STATUS);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    updateStatus();

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [sourceUri, loop]);

  async function play() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    await audio.play();
  }

  function pause() {
    audioRef.current?.pause();
  }

  async function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const duration = asPositiveNumber(audio.duration);
    const requested = asPositiveNumber(seconds);
    const targetTime = duration > 0 ? Math.min(duration, requested) : requested;
    audio.currentTime = targetTime;
    setStatus((previous) => ({
      ...previous,
      currentTime: targetTime,
      didJustFinish: false,
    }));
  }

  return {
    status,
    play,
    pause,
    seekTo,
  };
}

function asPositiveNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}
