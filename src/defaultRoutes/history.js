const express = require("express");
const dotEnv = require("dotenv");
const connectToMongoDBServer = require("../mongoDBConfig");
const { VerifyAndDecodeJWT } = require("../helpers");

dotEnv.config();

const app = express();

app.get("/history", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { limit } = req.query;
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
        res.status(401).json({ error: "Authorization Failed." });
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
        const res = {};
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].from_visited.length; j++) {
                const currMonth = parseInt(data[i].from_visited[j].requested_at.substr(5, 2));
                const currYear = parseInt(data[i].from_visited[j].requested_at.substr(0, 4));
                if (res[currYear] && res[currYear][noMonths[currMonth]]) {
                    res[currYear][noMonths[currMonth]] += 1;
                } else {
                    res[currYear] = { [noMonths[currMonth]]: 1 };
                }
                prevMonth = currMonth;
            }
        }
        resolve(res);
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
    if (authorization === process.env.AUTHORIZATION) {
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
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
                                    .toArray()
                                    .then((result) => {
                                        const p1 = calculateTotalClicks(result);
                                        const p2 = filterWRTYearsAndMonths(result);
                                        Promise.all([p1, p2])
                                            .then((response) => {
                                                const [res1, res2] = response;
                                                res.status(200).json({
                                                    allLinks: result.length,
                                                    allClicks: res1,
                                                    monthlyClicks: res2,
                                                });
                                            })
                                            .catch((e) => {
                                                console.log(e);
                                                res.status(500).json({ err: "Internal Error" });
                                            });
                                    })
                                    .catch((e) => {
                                        res.send(e);
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
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
