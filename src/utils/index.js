const dotEnv = require("dotenv");

dotEnv.config();

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

exports.getMetaData = (data) => {
    if (data.length) {
        let count = 0;
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
                    short_url: process.env.OWN_URL_DEFAULT + data?.[0]?.alias,
                    title: data[0]?.title,
                },
                {
                    url: data?.[1]?.url,
                    short_url: process.env.OWN_URL_DEFAULT + data?.[1]?.alias,
                    title: data[1]?.title,
                },
                {
                    url: data?.[2]?.url,
                    short_url: process.env.OWN_URL_DEFAULT + data?.[2]?.alias,
                    title: data[2]?.title,
                },
            ],
        };
    } else {
        return {
            count: 0,
            clicks: {},
            links_added: {},
            top_three: [],
        };
    }
};

exports.getMetaDataOfAURL = (data) => {
    if (data) {
        const year_month_day_click = {};
        const browser_clicks = {};
        const os_clicks = {};
        const device_clicks = {};
        const country_clicks = {};
        for (let j = 0; j < data.length; j++) {
            let currMonth = data[j].requested_at.substr(5, 2);
            let currYear = data[j].requested_at.substr(0, 4);
            let currDate = data[j].requested_at.substr(8, 2);
            let client_name = data[j]?.client_info?.client_name;
            let client_OS = data[j]?.client_info?.OS;
            let device_type = data[j]?.client_info?.device_type;
            let country = data[j]?.location?.country;
            let city = data[j]?.location?.city;

            if (year_month_day_click[currYear] && year_month_day_click[currYear][noMonths[currMonth]]) {
                year_month_day_click[currYear].count += 1;
                year_month_day_click[currYear][noMonths[currMonth]].count += 1;
                if (year_month_day_click[currYear][noMonths[currMonth]][currDate]) {
                    year_month_day_click[currYear][noMonths[currMonth]][currDate] += 1;
                } else {
                    year_month_day_click[currYear][noMonths[currMonth]] = { ...year_month_day_click[currYear][noMonths[currMonth]], [currDate]: 1 };
                }
            } else {
                year_month_day_click[currYear] = { count: 1, [noMonths[currMonth]]: { count: 1, [currDate]: 1 } };
            }

            if (client_name) {
                if (browser_clicks[client_name]) {
                    browser_clicks[client_name].count += 1;
                } else {
                    browser_clicks[client_name] = { count: 1 };
                }
            }

            if (client_OS) {
                if (os_clicks[client_OS]) {
                    os_clicks[client_OS].count += 1;
                } else {
                    os_clicks[client_OS] = { count: 1 };
                }
            }

            if (device_type) {
                if (device_clicks[device_type]) {
                    device_clicks[device_type].count += 1;
                } else {
                    device_clicks[device_type] = { count: 1 };
                }
            }

            if (country && city) {
                if (country_clicks[country] && country_clicks[country][city]) {
                    country_clicks[country].count += 1;
                    country_clicks[country][city].count += 1;
                } else {
                    country_clicks[country] = { count: 1, [city]: { count: 1 } };
                }
            }
        }
        return {
            year_month_day_click,
            device_clicks,
            browser_clicks,
            os_clicks,
            country_clicks,
        };
    }
    return {};
};

exports.ResponseError = class ResponseError extends Error {
    constructor({ code, error }) {
        super(error);
        this.code = code;
        this.error = error;
    }
};

exports.insertOne = (value, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .insertOne(value)
                .then((value) => {
                    return resolve({ insertedCount: value.insertedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.findOne = (query, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .findOne(query)
                .then((value) => {
                    return resolve(value);
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.updateOne = (query, value, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .updateOne(query, value)
                .then((value) => {
                    return resolve({ modifiedCount: value.modifiedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.deleteOne = (query, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .deleteOne(query)
                .then((value) => {
                    return resolve({ deletedCount: value.deletedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};
