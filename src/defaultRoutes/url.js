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
        const { limit, skip } = req.query;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                connectToMongoDBServer("shorty_urls", (error, client) => {
                    if (client) {
                        client
                            .collection("shorten_urls")
                            .find({ uid: user.uid })
                            .skip(skip ? skip : 0)
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
            if (data[i].from_visited) {
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

const getMetaData = (data) => {
    let count = 0;
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
        count += data[i].num_of_visits;
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
        if (data[i].from_visited) {
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
    }
    return {
        count,
        clicks: res1,
        links_added: res2,
        top_three: [
            {
                url: data?.[0]?.url,
                short_url: data?.[0]?.short_url,
                title: data[0]?.title,
            },
            {
                url: data?.[1]?.url,
                short_url: data?.[1]?.short_url,
                title: data[1]?.title,
            },
            {
                url: data?.[2]?.url,
                short_url: data?.[2]?.short_url,
                title: data[2]?.title,
            },
        ],
    };
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
                        .sort({ num_of_visits: -1 })
                        .toArray()
                        .then((result) => {
                            const metaData = getMetaData(result);
                            console.log(metaData);
                            return res.status(200).json({
                                all_links: result.length,
                                all_clicks: metaData.count,
                                clicks: metaData.clicks,
                                links_added: metaData.links_added,
                                top_three: metaData.top_three,
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
