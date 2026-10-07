import api from "./api";

const createRoom = async (name) => {
  const response = await api.post("/rooms", {
    name,
  });

  return response.data;
};

const getRoom = async (roomCode) => {
  const response = await api.get(
    `/rooms/${roomCode}`
  );

  return response.data;
};

const joinRoom = async (roomCode) => {
  const response = await api.post("/rooms/join", {
    roomCode,
  });

  return response.data;
};

const roomService = {
  createRoom,
  getRoom,
  joinRoom,
};

export default roomService;