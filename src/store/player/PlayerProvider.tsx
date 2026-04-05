import React from "react";

import { supabase } from "@/services/supabase/client";
import { useAuth } from "@/services/auth/AuthProvider";
import { getSong, listSongArtists } from "@/services/music/songs";

type PlayerTrack = {
  id: string;
  title: string;
  cover_image: any;
  preview_url: string | null;
  artistsText: string;
};

type PlayerContextValue = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playSongId: (songId: string) => Promise<void>;
  toggle: () => void;
  seek: (time: number) => void;
  stop: () => void;
};

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = React.useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime || 0);
    const onDur = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const stop = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const toggle = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time));
  }, []);

  const playSongId = React.useCallback(
    async (songId: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      const song = (await getSong(songId)) as any;
      const artists = await listSongArtists(songId);
      const artistsText = artists.length
        ? artists.map((a: any) => a.artist?.name).filter(Boolean).join(", ")
        : song.album?.artist?.name ?? "—";

      const previewUrl = song.preview_url ?? null;
      if (!previewUrl) {
        stop();
        setTrack({
          id: song.id,
          title: song.title,
          cover_image: song.cover_image ?? song.album?.cover_image ?? null,
          preview_url: null,
          artistsText,
        });
        return;
      }

      const isSame = track?.id === song.id;
      setTrack({
        id: song.id,
        title: song.title,
        cover_image: song.cover_image ?? song.album?.cover_image ?? null,
        preview_url: previewUrl,
        artistsText,
      });

      if (!isSame) {
        audio.src = previewUrl;
        audio.currentTime = 0;
      }

      await audio.play().catch(() => {});

      if (user) {
        supabase.from("user_play_history").insert({ user_id: user.id, song_id: song.id }).then(() => {});
      }
    },
    [stop, track?.id, user],
  );

  const value = React.useMemo<PlayerContextValue>(
    () => ({ track, isPlaying, progress, duration, playSongId, toggle, seek, stop }),
    [duration, isPlaying, playSongId, progress, seek, stop, toggle, track],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

