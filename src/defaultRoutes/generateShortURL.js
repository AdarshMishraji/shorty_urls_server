const express = require("express");
const crypto = require("crypto");
const dotEnv = require("dotenv");

const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT } = require("../helpers");

dotEnv.config();

const app = express();

app.post("/generate_short_url", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { url } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            const newEndpoint = crypto.randomBytes(4).toString("hex");
            if (url) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("users")
                                .findOne({ uid: user.uid })
                                .then((value) => {
                                    if (value) {
                                        client
                                            .collection("shorten_urls_old")
                                            .findOne({ url, uid: user.uid })
                                            .then((value) => {
                                                if (value) {
                                                    console.log("URL already exists.");
                                                    res.status(409).json({
                                                        short_url: value.short_url,
                                                        error: "URL already exists.",
                                                    });
                                                    return;
                                                } else {
                                                    const short_url = process.env.OWN_URL_DEFAULT + newEndpoint;
                                                    client
                                                        .collection("shorten_urls_old")
                                                        .insertOne({
                                                            url,
                                                            short_url,
                                                            num_of_visits: 0,
                                                            created_at: Date.now(),
                                                            uid: user.uid,
                                                        })
                                                        .then((value) => {
                                                            console.log("Inserted one url in shorten_urls.");
                                                            res.status(200).json({
                                                                short_url: process.env.OWN_URL_DEFAULT + newEndpoint,
                                                            });
                                                            return;
                                                        })
                                                        .catch((e) => {
                                                            console.log("Error while inserting url in shorten_urls.", JSON.stringify(e));
                                                            res.status(500).json({ error: "Internal Error." });
                                                        });
                                                    return;
                                                }
                                            });
                                    } else {
                                        res.status(400).json({ error: "Invalid User." });
                                    }
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Not accepted empty url." });
            }
        } else {
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
