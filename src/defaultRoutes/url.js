const express = require("express");
const dotEnv = require("dotenv");
var ObjectID = require("mongodb").ObjectID;
const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT, getMetaData, getMetaDataOfAURL } = require("../helpers");

dotEnv.config();

const app = express.Router();

app.get("/urls", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { limit, skip } = req.query;
        console.log(limit, skip);
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            console.log(user);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("shorten_urls")
                            .find({ uid: user.uid })
                            .skip(skip ? parseInt(skip) : 0)
                            .limit(limit ? parseInt(limit) : Number.MAX_SAFE_INTEGER)
                            .toArray()
                            .then((value) => {
                                res.status(200).json({
                                    urls: value.map((val) => {
                                        return { ...val, short_url: process.env.OWN_URL_DEFAULT + val.alias };
                                    }),
                                });
                            })
                            .catch((e) => {
                                console.log("Error while fetching history", e);
                                res.send(500).json({ error: "Error while fetching history" });
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
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Invalid Access." });
    }
});

app.get("/url/:urlID", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.params;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("shorten_urls")
                            .findOne({ uid: user.uid, _id: ObjectID(urlID) })
                            .then((value) => {
                                const meta = getMetaDataOfAURL(value?.from_visited);
                                console.log(req.params.urlID);
                                return res.status(200).json({ info: { ...value, short_url: process.env.OWN_URL_DEFAULT + value.alias }, meta });
                            })
                            .catch((err) => {
                                return res.status();
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
            res.status(401).json({ error: "Invalid Access." });
        }
    }
});

app.get("/meta", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    const { withoutAuth } = req.query;
    if (authorization === process.env.AUTHORIZATION) {
        if (withoutAuth === "true" || accesstoken) {
            const user = withoutAuth === "true" || VerifyAndDecodeJWT(accesstoken);
            connectToMongoDBServer("shorty_urls", (error, client) => {
                if (client) {
                    client
                        .collection("shorten_urls")
                        .find(withoutAuth === "true" ? null : { uid: user.uid })
                        .sort({ num_of_visits: -1 })
                        .toArray()
                        .then((result) => {
                            const metaData = getMetaData(result);
                            return res.status(200).json({
                                all_links: result.length,
                                all_clicks: metaData?.count,
                                clicks: metaData?.clicks,
                                links_added: metaData?.links_added,
                                top_three: metaData?.top_three,
                            });
                        })
                        .catch((e) => {
                            console.log(e);
                            res.status(500).send(e);
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
        res.status(401).json({ error: "Invalid Access." });
    }
});

module.exports = app;
