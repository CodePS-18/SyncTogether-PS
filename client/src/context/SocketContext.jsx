
import {
  createContext,
  useContext,
  useEffect,
} from "react";

import { useAuth } from "./AuthContext";
import socket from "../services/socket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, handleSessionExpired } = useAuth();

  useEffect(() => {
    // Connect only when a user is authenticated.
    const token = localStorage.getItem("syncTogetherToken");

    if (user && token) {
      socket.auth = { token };
    }

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);

      const authenticationErrors = [
        "Authentication required",
        "Session expired. Please sign in again.",
        "Invalid or expired token",
        "User account not found",
      ];

      if (authenticationErrors.includes(error.message)) {
        handleSessionExpired();
      }
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);

      // Handle forced server-side disconnection.
      if (reason === "io server disconnect") {
        handleSessionExpired();
      }
    };

    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (user && token) {
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [user, handleSessionExpired]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
