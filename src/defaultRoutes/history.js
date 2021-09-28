const express = require("express");
const dotEnv = require("dotenv");
const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT } = require("../helpers");

dotEnv.config();

const app = express();

app.get("/history", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    console.log(accesstoken, req.headers);
    if (authorization === process.env.AUTHORIZATION) {
        const { limit } = req.query;
        console.log(limit);
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("users")
                            .findOne({ uid: user.uid })
                            .then((value) => {
                                if (value) {
                                    client
                                        .collection("shorten_urls")
                                        .find({ uid: user.uid })
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
                                } else {
                                    res.status(400).json({ error: "Invalid User." });
                                }
                            });
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            res.status(500).json({ error: "Internal Error." });
                        }
                    }
                });
            } else {
                res.status(400).json({ error: "Invalid User." });
            }
        } else {
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
