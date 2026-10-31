
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

    if (!/^[A-F0-9]{8}$/.test(code)) {
      setError("Please enter a valid 8-character room code.");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B16] px-4 py-12">

      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">

        {/* Left section */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-10 lg:flex">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <Link to="/dashboard" className="text-sm font-medium text-white/80 transition hover:text-white">
              ← Back to Dashboard
            </Link>

            <div className="mt-24">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-4xl shadow-xl backdrop-blur">
                🍿
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white">
                The best moments
                <br />
                are shared.
              </h1>

              <p className="mt-5 max-w-sm leading-7 text-emerald-50">
                Join your friends, watch together and stay connected
                no matter where you are.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-200" />
            Your friends are just one code away
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
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
              🤝
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              You're invited
            </p>

            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Join a Room
            </h2>

            <p className="mt-3 leading-6 text-slate-400">
              Have a room code? Enter it below and join your friends
              for a shared experience.
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
                htmlFor="roomCode"
                className="mb-3 block text-sm font-medium text-slate-300"
              >
                Enter Room Code
              </label>

              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-F0-9]/g, "")
                      .slice(0, 8)
                  );
                  if (error) setError("");
                }}
                placeholder="A7F92C1B"
                maxLength={8}
                required
                autoComplete="off"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-4 py-5 text-center font-mono text-2xl font-bold tracking-[0.35em] text-white uppercase outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Room codes contain 8 characters.</span>
                <span>{roomCode.length}/8</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || roomCode.length !== 8}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Joining room...
                </>
              ) : (
                <>
                  Join Room
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5">
            <div className="flex gap-3">
              <span className="text-xl">🔐</span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Where can I find the code?
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Ask the room host to share the unique 8-character
                  room code with you.
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

export default JoinRoom;
