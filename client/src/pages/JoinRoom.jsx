import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import roomService from "../services/roomService";

const JoinRoom = () => {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const code = roomCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter a room code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await roomService.joinRoom(code);

      navigate(`/room/${data.room.roomCode}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to join room. Please check the room code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-white">
            Join a Room
          </h1>

          <p className="mt-2 text-slate-400">
            Enter the room code shared by your friend.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="roomCode"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Room Code
            </label>

            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(event.target.value.toUpperCase())
              }
              placeholder="e.g. A7F92C1B"
              maxLength={8}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center font-mono text-lg tracking-widest text-white uppercase outline-none transition focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Joining Room..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;