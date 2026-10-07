import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            SyncTogether
          </h1>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome, {user?.username}! 👋
          </h2>

          <p className="mt-2 text-slate-400">
            Watch and enjoy entertainment together with
            your friends.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Room */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 text-4xl">
              🎬
            </div>

            <h3 className="text-xl font-semibold">
              Create a Room
            </h3>

            <p className="mt-2 text-slate-400">
              Create a private room and invite your friends
              to watch together.
            </p>

            <button
              onClick={() => navigate("/create-room")}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              Create Room
            </button>
          </div>

          {/* Join Room */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 text-4xl">
              👥
            </div>

            <h3 className="text-xl font-semibold">
              Join a Room
            </h3>

            <p className="mt-2 text-slate-400">
              Enter a room code and join your friends.
            </p>

            <button
              onClick={() => navigate("/join-room")}
              className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 font-medium transition hover:bg-emerald-700"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">
            Account Information
          </h3>

          <div className="mt-5 space-y-3 text-slate-300">
            <div>
              <span className="text-slate-500">
                Username:
              </span>{" "}
              {user?.username}
            </div>

            <div>
              <span className="text-slate-500">
                Email:
              </span>{" "}
              {user?.email}
            </div>

            <div>
              <span className="text-slate-500">
                Status:
              </span>{" "}
              <span className="text-emerald-400">
                ● Online
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

