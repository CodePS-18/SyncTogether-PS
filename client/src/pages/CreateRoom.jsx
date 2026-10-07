import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import roomService from "../services/roomService";

const CreateRoom = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter a room name.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await roomService.createRoom(
        name.trim()
      );

      navigate(`/room/${data.room.roomCode}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to create room. Please try again."
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
            Create a Room
          </h1>

          <p className="mt-2 text-slate-400">
            Create a room and invite your friends to watch
            together.
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
              htmlFor="roomName"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Room Name
            </label>

            <input
              id="roomName"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Friday Movie Night"
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Room..."
              : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;