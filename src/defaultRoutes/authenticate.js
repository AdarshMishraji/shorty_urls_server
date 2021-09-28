const express = require("express");
const dotEnv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectToMongoDBServer = require("../mongoDBConfig");
const { decodeJWT } = require("../helpers");
const { v4: uuidv4 } = require("uuid");

dotEnv.config();

const app = express();

app.post("/authenticate", (req, res) => {
    const { authorization } = req.headers;
    const { token } = req.body;
    if (token) {
        const user = decodeJWT(token);
        if (authorization === process.env.AUTHORIZATION && user) {
            connectToMongoDBServer("shorty_urls", (error, client) => {
                if (client) {
                    client
                        .collection("users")
                        .findOne({ email: user.email })
                        .then((value) => {
                            if (value) {
                                console.log("user already existed");
                                const new_token = jwt.sign({ uid: value.uid }, process.env.SECRET);
                                res.status(200).json({
                                    token: new_token,
                                });
                                return;
                            } else {
                                const uid = uuidv4();
                                client
                                    .collection("users")
                                    .insertOne({
                                        uid,
                                        email: user.email,
                                    })
                                    .then(() => {
                                        const new_token = jwt.sign({ uid }, process.env.SECRET);
                                        res.status(200).json({
                                            token: new_token,
                                        });
                                        return;
                                    })
                                    .catch((e) => {
                                        res.status(500).json({ error: "Internal Error." });
                                    });
                                return;
                            }
                        })
                        .catch((e) => {
                            console.log("error while authenticate", e);
                            res.status(500).json({ error: "Internal Error." });
                        });
                }
                if (error) {
                    console.log("Error in connecting DB.", error);
                    res.status(500).json({ error: "Internal Error." });
                }
            });
        } else {
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
