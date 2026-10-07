import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import roomService from "../services/roomService";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const data = await roomService.getRoom(roomCode);

        setRoom(data.room);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Failed to load room."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomCode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Loading room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">
            Room Error
          </h1>

          <p className="mt-3 text-slate-400">
            {error}
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">
              SyncTogether
            </h1>

            <p className="text-sm text-slate-400">
              Room:{" "}
              <span className="font-mono text-blue-400">
                {room.roomCode}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-slate-700 px-4 py-2 font-medium hover:bg-slate-600"
          >
            Exit Room
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">
            {room.name}
          </h2>

          <p className="mt-2 text-slate-400">
            Share the room code with your friends to watch
            together.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Area */}
          <div className="lg:col-span-2">
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-800 bg-black">
              <div className="text-center">
                <div className="mb-4 text-5xl">
                  🎬
                </div>

                <h3 className="text-xl font-semibold">
                  Video Player
                </h3>

                <p className="mt-2 text-slate-500">
                  Video player will be added next.
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold">
              Participants
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {room.participants.length}{" "}
              {room.participants.length === 1
                ? "person"
                : "people"}{" "}
              in this room
            </p>

            <div className="mt-5 space-y-3">
              {room.participants.map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold">
                    {participant.username
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-medium">
                      {participant.username}
                    </p>

                    {room.host?._id ===
                      participant._id && (
                        <p className="text-xs text-blue-400">
                          Host
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Information */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">
            Room Information
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                Room Code
              </p>

              <p className="mt-1 font-mono text-lg text-blue-400">
                {room.roomCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Host
              </p>

              <p className="mt-1 text-lg">
                {room.host?.username}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;