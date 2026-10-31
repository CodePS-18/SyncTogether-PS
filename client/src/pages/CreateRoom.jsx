
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
      const data = await roomService.createRoom(name.trim());
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B16] px-4 py-12">

      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">

        {/* Left section */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-10 lg:flex">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <Link to="/dashboard" className="text-sm font-medium text-white/80 transition hover:text-white">
              ← Back to Dashboard
            </Link>

            <div className="mt-24">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-4xl shadow-xl backdrop-blur">
                🎬
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white">
                Your space.
                <br />
                Your people.
                <br />
                Your entertainment.
              </h1>

              <p className="mt-5 max-w-sm leading-7 text-blue-100">
                Create a private room, invite your friends and enjoy movies
                together in perfect sync.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Made for sharing moments
          </div>
        </div>

        {/* Right section */}
        <div className="p-7 sm:p-10 lg:p-12">

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white lg:hidden"
          >
            ← Back to Dashboard
          </Link>

          <div className="mb-9 mt-5 lg:mt-0">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl">
              ✨
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Let's get together
            </p>

            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Create a Room
            </h2>

            <p className="mt-3 leading-6 text-slate-400">
              Give your room a name and start a shared entertainment
              experience with your friends.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label
                htmlFor="roomName"
                className="mb-3 block text-sm font-medium text-slate-300"
              >
                Room Name
              </label>

              <input
                id="roomName"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Friday Movie Night"
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Choose a name your friends will recognize.</span>
                <span>{name.length}/100</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating your room...
                </>
              ) : (
                <>
                  Create Room
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  What happens next?
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Your room will be created with a unique room code.
                  Share that code with friends so they can join you.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            SyncTogether · Enjoy together, from anywhere.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
