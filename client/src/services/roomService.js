
import api from "./api";

// CREATE ROOM
const createRoom = async (name) => {
  const response = await api.post("/rooms", {
    name,
  });

  return response.data;
};

// GET MY ROOMS
const getMyRooms = async () => {
  const response = await api.get("/rooms/my-rooms");

  return response.data;
};

// GET SINGLE ROOM
const getRoom = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}`);

  return response.data;
};

// JOIN ROOM
const joinRoom = async (roomCode) => {
  const response = await api.post("/rooms/join", {
    roomCode,
  });

  return response.data;
};

// UPDATE ROOM NAME (HOST ONLY)
const updateRoomName = async (roomCode, name) => {
  const response = await api.patch(
    `/rooms/${roomCode}/name`,
    { name }
  );

  return response.data;
};

const roomService = {
  createRoom,
  getMyRooms,
  getRoom,
  joinRoom,
  updateRoomName,
};

export default roomService;
