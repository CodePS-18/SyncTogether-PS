
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import roomService from "../services/roomService";
import { useSocket } from "../context/SocketContext";
import VideoPlayer from "../components/VideoPlayer";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [socketConnected, setSocketConnected] = useState(
    socket?.connected ?? false
  );
  const [socketError, setSocketError] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomNotice, setRoomNotice] = useState("");
  const [onlineParticipants, setOnlineParticipants] = useState([]);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);


  // Load room information.
  useEffect(() => {
    let cancelled = false;

    const loadRoom = async () => {
      try {
        const data = await roomService.getRoom(roomCode);

        if (!cancelled) {
          setRoom(data.room);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Failed to load room."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!roomCode) {
      setError("Room code is missing.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);


  // Listen for participant updates and incoming chat messages.
  useEffect(() => {
    if (!socket || !roomCode) return;

    const normalizedRoomCode = roomCode.toUpperCase();

    const handleUserJoined = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setRoomNotice("A user joined the room.");

      roomService
        .getRoom(roomCode)
        .then((data) => setRoom(data.room))
        .catch((err) =>
          console.error("Failed to refresh room:", err)
        );
    };

    const handleUserLeft = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setRoomNotice("A user left the room.");

      roomService
        .getRoom(roomCode)
        .then((data) => setRoom(data.room))
        .catch((err) =>
          console.error("Failed to refresh room:", err)
        );
    };

    const handleChatMessage = (message) => {
      if (
        message?.roomCode?.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setMessages((previousMessages) => {
        // Prevent duplicate persisted messages.
        if (
          message._id &&
          previousMessages.some(
            (item) => item._id === message._id
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    socket.on("room:user-joined", handleUserJoined);
    socket.on("room:user-left", handleUserLeft);
    socket.on("chat:message", handleChatMessage);
    const handleParticipantsUpdate = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      if (Array.isArray(data?.onlineParticipants)) {
        setOnlineParticipants(
          data.onlineParticipants.map((id) => String(id))
        );
      }
    };

    return () => {
      socket.off("room:user-joined", handleUserJoined);
      socket.off("room:user-left", handleUserLeft);
      socket.off("chat:message", handleChatMessage);
      socket.off("room:participants", handleParticipantsUpdate);
    };
  }, [socket, roomCode]);

  // Connect to the live room and restore saved chat history.
  useEffect(() => {
    if (!roomCode || !socket) return;

    let active = true;

    const handleConnect = () => {
      if (!active) return;

      setSocketConnected(true);
      setSocketError("");

      socket.emit("room:join", roomCode, (response) => {
        if (!active) return;

        if (!response?.success) {
          setSocketError(
            response?.message || "Could not join live room."
          );
          return;
        }

        setSocketError("");

        // Correct setter: restore history into the messages state.
        setMessages(
          Array.isArray(response.messages) ? response.messages : []
        );
        setOnlineParticipants(
          Array.isArray(response.onlineParticipants)
            ? response.onlineParticipants.map((id) => String(id))
            : []
        );
      });
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleConnectError = (err) => {
      setSocketConnected(false);
      setSocketError(
        err.message || "Socket connection failed."
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      active = false;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      if (socket.connected) {
        socket.emit("room:leave", roomCode);
      }
    };
  }, [socket, roomCode]);

  // Send a chat message.
  const handleSendMessage = (event) => {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message) {
      setChatError("Please enter a message.");
      return;
    }

    if (message.length > 1000) {
      setChatError("Message cannot exceed 1000 characters.");
      return;
    }

    if (!socket?.connected) {
      setChatError("Not connected. Please try again.");
      return;
    }

    setSending(true);
    setChatError("");

    socket.timeout(5000).emit(
      "chat:send",
      { roomCode, message },
      (timeoutError, response) => {
        setSending(false);

        if (timeoutError) {
          console.error(
            "Chat acknowledgment timed out:",
            timeoutError
          );
          setChatError(
            "Server did not respond. Please refresh and try again."
          );
          return;
        }

        if (!response?.success) {
          setChatError(
            response?.message || "Could not send your message."
          );
          return;
        }

        setChatInput("");
      }
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Loading room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">
            Room Error
          </h1>

          <p className="mt-3 text-slate-400">
            {error || "Room information is unavailable."}
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
            <h1 className="text-2xl font-bold">SyncTogether</h1>

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
          <h2 className="text-3xl font-bold">{room.name}</h2>

          <p className="mt-2 text-slate-400">
            Share the room code with your friends to watch together.
          </p>

          {roomNotice && (
            <p className="mt-2 text-sm text-emerald-400">
              {roomNotice}
            </p>
          )}

          <p className="mt-2 text-sm">
            <span
              className={
                socketConnected
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
            >
              ●{" "}
              {socketConnected
                ? "Live connection connected"
                : "Connecting to live room..."}
            </span>
          </p>

          {socketError && (
            <p className="mt-2 text-sm text-red-400">
              {socketError}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <VideoPlayer
              roomCode={roomCode}
              initialVideoUrl={room.media?.url || ""}
            />
          </div>

          {/* Participants */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Participants</h3>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {onlineParticipants.length} online
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-slate-400">
                {onlineParticipants.length} online / {room.participants.length}{" "}
                {room.participants.length === 1 ? "participant" : "participants"}
              </p>

              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live status
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {room.participants.length}{" "}
              {room.participants.length === 1 ? "person" : "people"}{" "}
              in this room
            </p>

            <div className="mt-5 space-y-3">

              {room.participants.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center">
                  <p className="text-2xl">👥</p>
                  <p className="mt-2 font-medium text-slate-300">
                    No participants yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Invite friends using the room code.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {room.participants.map((participant) => {
                    const isOnline = onlineParticipants.includes(
                      String(participant._id)
                    );

                    const isHost =
                      String(room.host?._id) === String(participant._id);

                    const initial =
                      participant.username?.charAt(0).toUpperCase() || "?";

                    return (
                      <div
                        key={participant._id}
                        className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-800/70 p-3 transition duration-200 hover:border-slate-600 hover:bg-slate-800"
                      >
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-md">
                          {initial}

                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-800 ${isOnline ? "bg-emerald-400" : "bg-slate-500"
                              }`}
                            title={isOnline ? "Online" : "Offline"}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-slate-100">
                              {participant.username}
                            </p>

                            {isHost && (
                              <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                                Host
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-xs ${isOnline ? "text-emerald-400" : "text-slate-500"
                              }`}
                          >
                            {isOnline ? "Online now" : "Offline"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Chat */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              <h3 className="text-xl font-semibold">Room Chat</h3>
              <p className="mt-1 text-sm text-slate-400">
                Chat with everyone watching together.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {messages.length} messages
            </span>
          </div>

          <div
            className="h-80 space-y-4 overflow-y-auto p-5"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="text-4xl">💬</span>
                <p className="mt-3 font-medium text-slate-300">
                  No messages yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((item, index) => (
                <div
                  key={
                    item._id ||
                    `${item.createdAt}-${item.userId}-${index}`
                  }
                  className="flex items-start gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold">
                    {item.username?.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="font-semibold text-blue-300">
                        {item.username}
                      </p>

                      <span className="text-xs text-slate-500">
                        {item.createdAt &&
                          new Date(item.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                      </span>
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-800 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => {
                  setChatInput(event.target.value);

                  if (chatError) {
                    setChatError("");
                  }
                }}
                placeholder="Type your message..."
                maxLength={1000}
                autoComplete="off"
                aria-label="Chat message"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={sending || !socketConnected}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            {chatError && (
              <p role="alert" className="mt-2 text-sm text-red-400">
                {chatError}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-500">
              {chatInput.length}/1000 characters
            </p>
          </form>
        </section>

        {/* Room Information */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">
            Room Information
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Room Code</p>
              <p className="mt-1 font-mono text-lg text-blue-400">
                {room.roomCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Host</p>
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
