const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");

// ---------------------------------------------- GENERAL SETTINGS -------------------------------

require("dotenv").config();
const app = express();

const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS.split(","),
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'"],
      "img-src": ["'self'", "*.cloudinary.com"],
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------- DATABASE CONNECTION -------------------------------

mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.CONNECTION_STRING);
}

// ---------------------------------------------- ROUTES -------------------------------

const authRoutes = require("./routes/authRoute");
app.use("/api", authRoutes);

const messageRoomRoutes = require("./routes/messageRoomRoute");
app.use("/api", messageRoomRoutes);

const messageRoutes = require("./routes/messageRoute");
app.use("/api", messageRoutes);

const friendRequestRoutes = require("./routes/friendRequestRoute");
app.use("/api", friendRequestRoutes);

const userRoutes = require("./routes/userRoute");
app.use("/api", userRoutes);

// ---------------------------------------------- ERROR HANDLER -------------------------------

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log("hello9" + err);
  console.log("hello10" + req);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

// ---------------------------------------------- SERVER LISTEN -------------------------------

const PORT = process.env.PORT || "3000";

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
