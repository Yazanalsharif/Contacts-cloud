const express = require("express");
const chalk = require("chalk");
const dotenv = require("dotenv");
const mongooseConnection = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
// bring the routes files here
const Contacts = require("./routes/Contacts");
const users = require("./routes/auth");

dotenv.config({
  path: "./config/config.env",
});

const app = express();
let port = process.env.PORT || 3000;

mongooseConnection();

// getting json data from the user
app.use(express.json());
// getting the data from the cookie that send with the request
app.use(cookieParser());

//mount the routes here
app.use("/v1/contact", Contacts);
app.use("/v1/user", users);

// catch the error if it did't catch in the controllers
app.use(errorHandler);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// launch the server on port 80 or 3000
const server = app.listen(port, () => {
  console.log(
    chalk.yellow.bold(
      `the server is runing on port ${port} and in the ${process.env.NODE_ENV} enviorment`
    )
  );
});

process.on("unhandledRejection", (err, promise) => {
  console.log("Error: ", err.message);

  server.close(() => process.exit(1));
});
