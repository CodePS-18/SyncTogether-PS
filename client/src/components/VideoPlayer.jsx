
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

const DEFAULT_VIDEO =
  "https://www.w3schools.com/html/mov_bbb.mp4";

const VideoPlayer = ({ roomCode, initialVideoUrl = "" }) => {
  const videoRef = useRef(null);
  const socket = useSocket();

  const [videoUrl, setVideoUrl] = useState(
    initialVideoUrl || DEFAULT_VIDEO
  );
  const [urlInput, setUrlInput] = useState(
    initialVideoUrl || DEFAULT_VIDEO
  );
  const [videoError, setVideoError] = useState("");

  // Load the saved room video when the room data becomes available.
  useEffect(() => {
    const savedUrl = initialVideoUrl || DEFAULT_VIDEO;

    setVideoUrl(savedUrl);
    setUrlInput(savedUrl);
    setVideoError("");
  }, [initialVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !socket || !roomCode) return;

    let applyingRemoteUpdate = false;

    const handleRemotePlayback = async (data) => {
      const player = videoRef.current;

      if (!data || !player) return;

      applyingRemoteUpdate = true;

      try {
        if (
          typeof data.currentTime === "number" &&
          Number.isFinite(data.currentTime) &&
          Math.abs(player.currentTime - data.currentTime) > 1
        ) {
          player.currentTime = data.currentTime;
        }

        if (data.action === "play" && player.paused) {
          await player.play();
        } else if (
          data.action === "pause" &&
          !player.paused
        ) {
          player.pause();
        }
      } catch (error) {
        console.error("Remote playback failed:", error);
      } finally {
        applyingRemoteUpdate = false;
      }
    };

    const emitPlayback = (action) => {
      if (applyingRemoteUpdate || !socket.connected) return;

      socket.emit("video:control", {
        roomCode,
        action,
        currentTime: video.currentTime,
      });
    };

    const handlePlay = () => emitPlayback("play");
    const handlePause = () => emitPlayback("pause");
    const handleSeeked = () => emitPlayback("seek");

    const handleVideoChanged = (data) => {
      const changedUrl = data?.videoUrl;

      if (!changedUrl) return;

      setVideoError("");
      setUrlInput(changedUrl);
      setVideoUrl(changedUrl);
    };

    socket.on("video:sync", handleRemotePlayback);
    socket.on("video:changed", handleVideoChanged);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      socket.off("video:sync", handleRemotePlayback);
      socket.off("video:changed", handleVideoChanged);

      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [socket, roomCode, videoUrl]);

  const handleLoadVideo = (event) => {
    event.preventDefault();

    const trimmedUrl = urlInput.trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(trimmedUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      setVideoError(
        "Please enter a valid HTTP or HTTPS video URL."
      );
      return;
    }

    if (!socket?.connected) {
      setVideoError(
        "Not connected to the room. Please try again."
      );
      return;
    }

    setVideoError("");

    socket.emit(
      "video:change",
      {
        roomCode,
        videoUrl: parsedUrl.href,
      },
      (response) => {
        if (!response?.success) {
          setVideoError(
            response?.message || "Failed to update room video."
          );
          return;
        }

        // Update the current user's player after the server saves it.
        setVideoUrl(parsedUrl.href);
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <form
        onSubmit={handleLoadVideo}
        className="flex flex-col gap-3 p-4 sm:flex-row"
      >
        <input
          type="url"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Enter a direct video URL (.mp4)"
          required
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Load Video
        </button>
      </form>

      {videoError && (
        <p className="px-4 pb-3 text-sm text-red-400">
          {videoError}
        </p>
      )}

      <video
        key={videoUrl}
        ref={videoRef}
        className="aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
        onError={() =>
          setVideoError(
            "Unable to load this video. Try a direct MP4 URL that permits browser playback."
          )
        }
        onLoadedMetadata={() => setVideoError("")}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
};

export default VideoPlayer;
