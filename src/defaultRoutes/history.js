const express = require("express");
const dotEnv = require("dotenv");
const connectToMongoDBServer = require("../mongoDBConfig");

dotEnv.config();

const app = express();

app.get("/history", (req, res) => {
  const { authorization } = req.headers;
  if (authorization === process.env.AUTHORIZATION) {
    const { limit } = req.query;
    console.log(limit);
    connectToMongoDBServer("shorty_urls", (error, client) => {
      if (client) {
        client
          .collection("shorten_urls")
          .find({})
          .limit(limit ? parseInt(limit) : Number.MAX_SAFE_INTEGER)
          .toArray()
          .then((value) => {
            res.status(200).json({
              history: value,
            });
          })
          .catch((e) => {
            console.log("Error while fetching history", e);
            res.send(500).json({ error: "Error while fetching history" });
          });
        if (error) {
          console.log("Error in connecting DB.", error);
          res.status(500).json({ error: "Internal Error." });
        }
      }
    });
  } else {
    res.status(401).json({ error: "Authorization Failed." });
  }
});

module.exports = app;
