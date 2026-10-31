
import { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sessionExpired = location.state?.sessionExpired;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-4 py-10 text-white">

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">

        {/* Left Side - Branding */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-10 lg:flex">

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-blue-400/10" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-violet-400/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <Link to="/login" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold shadow-lg shadow-blue-500/20">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SyncTogether
              </h1>
              <p className="text-xs text-blue-200/60">
                Watch. Connect. Enjoy.
              </p>
            </div>
          </Link>

          <div className="relative my-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              YOUR SHARED ENTERTAINMENT SPACE
            </div>

            <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Good times are better
              <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                together.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Create rooms, invite your friends, watch videos together,
              and stay connected through real-time conversations.
            </p>

            {/* Feature Cards */}
            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
                  ▶
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Synchronized Playback
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Enjoy videos together in real time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                  ◉
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Real-Time Chat
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Share reactions and conversations instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-xl">
                  ♧
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Private Rooms
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Create rooms and invite your friends.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} SyncTogether. All rights reserved.
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">

          <div className="w-full max-w-md">

            {/* Mobile Branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold">
                S
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  SyncTogether
                </h1>
                <p className="text-xs text-slate-500">
                  Watch. Connect. Enjoy.
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                WELCOME BACK
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sign in to your
                <span className="block text-blue-400">
                  account.
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your credentials to continue your SyncTogether experience.
              </p>
            </div>

            {/* Session Expired */}
            {sessionExpired && (
              <div className="mb-5 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <span>!</span>
                <p>
                  Your session has expired. Please sign in again.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-300"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 pr-16 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-4 text-xs font-semibold text-slate-400 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            {/* Register Link */}
            <div className="mt-8 border-t border-slate-800 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Create one
                </Link>
              </p>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-600 lg:hidden">
              © {new Date().getFullYear()} SyncTogether. All rights reserved.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
