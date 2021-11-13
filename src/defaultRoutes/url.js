const express = require("express");
const dotEnv = require("dotenv");
var ObjectID = require("mongodb").ObjectID;
const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT, getUserData } = require("../helpers");

dotEnv.config();

const app = express.Router();

app.get("/urls", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { limit } = req.query;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("shorten_urls")
                            .find({ uid: user.uid })
                            .limit(limit ? parseInt(limit) : Number.MAX_SAFE_INTEGER)
                            .toArray()
                            .then((value) => {
                                res.status(200).json({
                                    urls: value,
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

app.get("/url/:id", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { limit } = req.query;
        const { urlID } = req.params;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("shorten_urls")
                            .find({ uid: user.uid, _id: ObjectID(urlID) })
                            .toArray()
                            .then((value) => {
                                return res.status(200).json(value);
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

const filterWRTYearsAndMonths = (data) => {
    return new Promise((resolve, reject) => {
        const noMonths = {
            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",
            7: "July",
            8: "August",
            9: "September",
            10: "October",
            11: "November",
            12: "December",
        };
        const res1 = {};
        const res2 = {};
        for (let i = 0; i < data.length; i++) {
            const month = data[i].created_at.substr(5, 2);
            const year = data[i].created_at.substr(0, 4);
            if (res2[year]) {
                res2[year].count += 1;
                if (res2[year][noMonths[month]]) {
                    res2[year][noMonths[month]].count += 1;
                } else {
                    res2[year][noMonths[month]] = { count: 1 };
                }
            } else {
                res2[year] = { count: 1, [noMonths[month]]: { count: 1 } };
            }
            for (let j = 0; j < data[i].from_visited.length; j++) {
                const currMonth = data[i].from_visited[j].requested_at.substr(5, 2);
                const currYear = data[i].from_visited[j].requested_at.substr(0, 4);
                const currDate = data[i].from_visited[j].requested_at.substr(8, 2);
                if (res1[currYear] && res1[currYear][noMonths[currMonth]]) {
                    res1[currYear].count += 1;
                    res1[currYear][noMonths[currMonth]].count += 1;
                    if (res1[currYear][noMonths[currMonth]][currDate]) {
                        res1[currYear][noMonths[currMonth]][currDate] += 1;
                    } else {
                        res1[currYear][noMonths[currMonth]] = { ...res1[currYear][noMonths[currMonth]], [currDate]: 1 };
                    }
                } else {
                    res1[currYear] = { count: 1, [noMonths[currMonth]]: { count: 1, [currDate]: 1 } };
                }
                prevMonth = currMonth;
            }
        }
        resolve([res1, res2]);
    });
};

const calculateTotalClicks = (data) => {
    return new Promise((resolve, reject) => {
        let count = 0;
        data.forEach((ele) => {
            count += ele.num_of_visits;
        });
        resolve(count);
    });
};

app.get("/meta", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    const { withoutAuth } = req.query;
    if (authorization === process.env.AUTHORIZATION) {
        if (withoutAuth || accesstoken) {
            const user = withoutAuth || VerifyAndDecodeJWT(accesstoken);
            connectToMongoDBServer("shorty_urls", (error, client) => {
                if (client) {
                    client
                        .collection("shorten_urls")
                        .find(withoutAuth ? null : { uid: user.uid })
                        .toArray()
                        .then((result) => {
                            console.log(result);
                            const p1 = calculateTotalClicks(result);
                            const p2 = filterWRTYearsAndMonths(result);
                            Promise.all([p1, p2])
                                .then((response) => {
                                    const [res1, res2] = response;
                                    res.status(200).json({
                                        all_links: result.length,
                                        all_clicks: res1,
                                        clicks: res2[0],
                                        links_added: res2[1],
                                    });
                                })
                                .catch((e) => {
                                    console.log(e);
                                    res.status(500).json({ err: "Internal Error" });
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
