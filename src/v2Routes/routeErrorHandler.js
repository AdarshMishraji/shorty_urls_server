const express = require("express");
const path = require("path");

const app = express.Router();

app.use(express.static(path.join(__dirname, "../../public/")));

app.all("*", (req, res) => {
  console.log("User bhand ho gya hai.");
  res.status(404).sendFile(path.join(__dirname, "../../public/404.html"));
});

module.exports = app;
