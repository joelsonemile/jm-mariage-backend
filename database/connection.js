const mongoose = require("mongoose");
const { dbUser, dbPassword } = require("../config/env");

// MONGO_URI permet de pointer vers une base locale (dev/tests) sans toucher au
// reste de la config ; en son absence on se connecte au cluster Atlas du projet.
const url =
  process.env.MONGO_URI ||
  `mongodb+srv://${dbUser}:${dbPassword}@cluster0.i3iyk4h.mongodb.net/jm-mariage?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);

const connectDB = () => {
  return mongoose.connect(url);
};

module.exports = connectDB;
