const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt.util");
const { clientUrl } = require("../config/env");

let io = null;

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // les visiteurs non connectés peuvent quand même observer le plan de salle

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch (err) {
      // token invalide : on laisse la connexion en mode "spectateur" plutôt que de la rejeter
    }
    next();
  });

  io.on("connection", (socket) => {
    socket.on("table:join", (tableId) => {
      socket.join(`table:${tableId}`);
    });

    socket.on("table:leave", (tableId) => {
      socket.leave(`table:${tableId}`);
    });

    if (socket.data.role === "admin") {
      socket.join("admin");
    }
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO n'est pas initialisé.");
  return io;
}

// Diffuse aux invités qui observent le plan/le détail d'une table.
function emitSeatUpdated(tableId) {
  if (!io) return;
  io.to(`table:${tableId}`).emit("seat:updated", { tableId: tableId.toString() });
}

// Notifie l'admin en direct qu'une nouvelle réservation attend validation.
function emitReservationNew(reservation) {
  if (!io) return;
  io.to("admin").emit("reservation:new", { reservationId: reservation._id.toString() });
}

module.exports = { initSockets, getIO, emitSeatUpdated, emitReservationNew };
