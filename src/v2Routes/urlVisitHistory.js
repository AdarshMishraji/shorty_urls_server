const express = require("express");
const dotEnv = require("dotenv");
const connectToMongoDBServer = require("../mongoDBConfig");

dotEnv.config();

const app = express.Router();

app.get("/url_visit_history", (req, res) => {
    const { authorization } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { url } = req.query;
        connectToMongoDBServer("shorty_urls", (error, client) => {
            if (client) {
                client
                    .collection("url_visit_history_v2")
                    .findOne({ url })
                    .then((value) => {
                        if (value) {
                            res.status(200).json({
                                history: value,
                            });
                        } else {
                            res.status(404).send({
                                error: "Not available. OR URL not exists.",
                            });
                        }
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
