
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    const username = formData.username.trim();
    const email = formData.email.trim();

    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await register({
        username,
        email,
        password: formData.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
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

          <Link to="/register" className="relative flex items-center gap-3">
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              JOIN THE EXPERIENCE
            </div>

            <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Create memories,
              <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                share moments.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Start your SyncTogether journey. Connect with friends,
              create private rooms, and enjoy entertainment together
              from anywhere.
            </p>

            {/* Feature Cards */}
            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
                  ▶
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Watch Together
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Enjoy synchronized video playback.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                  ◉
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Connect with Friends
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Chat and share reactions in real time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-xl">
                  ♧
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Create Private Rooms
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Invite your friends and enjoy together.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} SyncTogether. All rights reserved.
          </p>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">

          <div className="w-full max-w-md">

            {/* Mobile Branding */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
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
                GET STARTED
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your
                <span className="block text-blue-400">
                  account.
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Join SyncTogether and start enjoying entertainment with
                your friends.
              </p>
            </div>

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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  minLength={3}
                  maxLength={30}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Username must be 3–30 characters.
                </p>
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    minLength={6}
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

                <p className="mt-2 text-xs text-slate-500">
                  Password must contain at least 6 characters.
                </p>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            {/* Login Link */}
            <div className="mt-8 border-t border-slate-800 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Sign in
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

export default Register;
