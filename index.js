const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const http = require("http");

const { port, clientUrl } = require("./config/env");
const connectDB = require("./database/connection");
const runSeed = require("./jobs/seed.job");
const scheduleReminderJob = require("./jobs/reminder.job");
const { initSockets } = require("./sockets");
const errorHandler = require("./middleware/error.middleware");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", routes);

app.get("/", (req, res) => res.json({ status: "ok", service: "jm-mariage-api" }));

app.use(errorHandler);

const server = http.createServer(app);
initSockets(server);

connectDB()
  .then(async () => {
    console.log("[db] Connexion à MongoDB réussie.");
    await runSeed();
    scheduleReminderJob();
    server.listen(port, () => console.log(`[server] API démarrée sur le port ${port}`));
  })
  .catch((err) => {
    console.error("[db] Échec de connexion à MongoDB:", err.message);
    process.exit(1);
  });
