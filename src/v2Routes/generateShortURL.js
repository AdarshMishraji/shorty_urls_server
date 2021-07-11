const express = require("express");
const crypto = require("crypto");
const dotEnv = require("dotenv");

const connectToMongoDBServer = require("../mongoDBConfig");

dotEnv.config();

const app = express.Router();

app.post("/generate_short_url", (req, res) => {
  const { authorization } = req.headers;
  if (authorization === process.env.AUTHORIZATION) {
    const { url } = req.body;
    const newEndpoint = crypto.randomBytes(4).toString("hex");
    if (url) {
      connectToMongoDBServer("shorty_urls", (error, client) => {
        if (client) {
          client
            .collection("shorten_urls_v2")
            .findOne({ url })
            .then((value) => {
              if (value) {
                console.log("URL already exists.");
                res.status(409).json({
                  short_url: value.short_url,
                  error: "URL already exists.",
                });
                return;
              } else {
                const short_url = process.env.OWN_URL_V2 + newEndpoint;
                client
                  .collection("shorten_urls_v2")
                  .insertOne({
                    url,
                    short_url,
                    created_at: Date.now(),
                  })
                  .then((value) => {
                    console.log("Inserted one url in shorten_urls_v2.");
                    client
                      .collection("url_visit_history_v2")
                      .insertOne({
                        url: short_url,
                        num_of_visits: 0,
                      })
                      .then((val) => {
                        console.log(
                          "Inserted one url in url_visit_history_v2."
                        );
                        res.status(200).json({
                          short_url: process.env.OWN_URL_V2 + newEndpoint,
                        });
                        return;
                      })
                      .catch((e) => {
                        console.log(
                          "Error while inserting url in url_visit_history_v2.",
                          JSON.stringify(e)
                        );
                        res.status(500).json({ error: "Internal Error." });
                        return;
                      });
                  })
                  .catch((e) => {
                    console.log(
                      "Error while inserting url in shorten_urls_v2.",
                      JSON.stringify(e)
                    );
                    res.status(500).json({ error: "Internal Error." });
                  });
                return;
              }
            });
        }
        if (error) {
          console.log("Error in connecting DB.", error);
          res.status(500).json({ error: "Internal Error." });
        }
      });
    } else {
      res.status(422).json({ error: "Not accepted empty url." });
    }
  } else {
    res.status(401).json({ error: "Authorization Failed." });
  }
});

module.exports = app;
