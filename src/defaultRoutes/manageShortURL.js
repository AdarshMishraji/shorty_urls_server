const express = require("express");
const crypto = require("crypto");
const dotEnv = require("dotenv");
const bcrypt = require("bcrypt");
var ObjectID = require("mongodb").ObjectID;
var Meta = require("html-metadata-parser");

const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT } = require("../helpers");

dotEnv.config();

const app = express.Router();

app.post("/generate_short_url", async (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { url } = req.body;
        if (url.includes(process.env.OWN_URL_DEFAULT)) {
            return res.status(405).json({ error: "It's already shortened." });
        } else {
            if (accesstoken) {
                const user = VerifyAndDecodeJWT(accesstoken);
                if (url) {
                    if (user) {
                        connectToMongoDBServer("shorty_urls", (error, client) => {
                            if (client) {
                                client
                                    .collection("shorten_urls")
                                    .findOne({ url, uid: user.uid })
                                    .then(async (value) => {
                                        if (value) {
                                            console.log("URL already exists.");
                                            res.status(409).json({
                                                short_url: process.env.OWN_URL_DEFAULT + value.alias,
                                                error: "URL already exists.",
                                                is_active: value.is_active,
                                                is_password_protected: Boolean(value?.protection?.password),
                                                is_expired: value?.expired_at > Date.now(),
                                            });
                                            return;
                                        } else {
                                            const newEndpoint = crypto.randomBytes(4).toString("hex");
                                            Meta.parser(url)
                                                .then(({ meta }) => {
                                                    client
                                                        .collection("shorten_urls")
                                                        .insertOne({
                                                            url,
                                                            alias: newEndpoint,
                                                            is_active: true,
                                                            num_of_visits: 0,
                                                            created_at: new Date().toISOString(),
                                                            uid: user.uid,
                                                            title: meta?.title,
                                                            description: meta?.description,
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
                                                            return res.status(500).json({ error: "Internal Error." });
                                                        });
                                                })
                                                .catch((e) => {
                                                    return res.status(500).json({ error: "Invalid URL" });
                                                });
                                        }
                                    });
                            }
                            if (error) {
                                console.log("Error in connecting DB.", error);
                                return res.status(500).json({ error: "Internal Error." });
                            }
                        });
                    } else {
                        res.status(400).json({ error: "Invalid User." });
                    }
                } else {
                    res.status(422).json({ error: "Not accepted empty url." });
                }
            } else {
                res.status(401).json({ error: "Invalid Access." });
            }
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/change_alias", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, alias } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("shorten_urls")
                                .findOne({ alias })
                                .then((val) => {
                                    if (val?._id) {
                                        return res.status(403).send({ message: "This alias is already in use" });
                                    } else {
                                        client
                                            .collection("shorten_urls")
                                            .updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { alias } })
                                            .then((value) => {
                                                if (value.modifiedCount > 0) {
                                                    return res.status(200).send({ message: "OK" });
                                                } else {
                                                    return res.status(500).send({ error: "Internal Error" });
                                                }
                                            });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).json({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.delete("/delete_url", async (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("shorten_urls")
                                .deleteOne({ _id: ObjectID(urlID), uid: user.uid })
                                .then((value) => {
                                    if (value.deletedCount > 0) {
                                        return res.status(200).send({ message: "OK" });
                                    } else {
                                        return res.status(404).send({ error: "URL not found" });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).send({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/update_url_status", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, status } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("shorten_urls")
                                .updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { is_active: status } })
                                .then((value) => {
                                    if (value.modifiedCount > 0) {
                                        return res.status(200).send({ message: "OK" });
                                    } else {
                                        return res.status(404).send({ error: "URL not found" });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).send({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/set_expiration_time", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, expired_at } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("shorten_urls")
                                .updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { expired_at } })
                                .then((value) => {
                                    if (value.modifiedCount > 0) {
                                        return res.status(200).send({ message: "OK" });
                                    } else {
                                        return res.status(404).send({ error: "Nothing has Updated." });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).send({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/update_password", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, password } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID && password) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            const encryptedPassword = bcrypt.hashSync(password, 12);
                            client
                                .collection("shorten_urls")
                                .updateOne(
                                    { _id: ObjectID(urlID), uid: user.uid },
                                    { $set: { protection: { password: encryptedPassword, protected_at: new Date().toISOString() } } }
                                )
                                .then((value) => {
                                    console.log(value);
                                    if (value.modifiedCount > 0) {
                                        return res.status(200).send({ message: "OK" });
                                    } else {
                                        return res.status(404).send({ error: "URL not found" });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).send({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.delete("/remove_password", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    connectToMongoDBServer("shorty_urls", (error, client) => {
                        if (client) {
                            client
                                .collection("shorten_urls")
                                .updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { protection: {} } })
                                .then((value) => {
                                    if (value.modifiedCount > 0) {
                                        return res.status(200).send({ message: "OK" });
                                    } else {
                                        return res.status(404).send({ error: "URL not found" });
                                    }
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).send({ error: "Internal Error." });
                                });
                        }
                        if (error) {
                            console.log("Error in connecting DB.", error);
                            return res.status(500).json({ error: "Internal Error." });
                        }
                    });
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
