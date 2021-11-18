const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const crypto = require("crypto");
const DeviceDetector = require("device-detector-js");
const ipLocator = require("ip-locator");
dotEnv.config();

exports.VerifyAndDecodeJWT = (token) => {
    if (token) return jwt.verify(token, process.env.SECRET);
    return null;
};

exports.decodeJWT = (token) => {
    if (token) return jwt.decode(token);
    return null;
};

exports.getClientData = (device) => {
    const deviceData = new DeviceDetector().parse(device);
    return {
        client_type: deviceData?.client?.type,
        client_name: deviceData?.client?.name,
        OS: deviceData?.os?.name,
        device_type: deviceData?.device?.type,
        device_brand: deviceData?.device?.brand,
        is_bot: deviceData?.bot,
    };
};

exports.getUserData = (client, uid) => {
    return client.collection("users").findOne({ uid: uid });
};

exports.aesEncryptData = (string) => {
    return new Promise((resolve, reject) => {
        const aesIV = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", process.env.AUTHORIZATION, aesIV);
        resolve(Buffer.concat([aesIV, Buffer.concat([cipher.update(string), cipher.final()]), cipher.getAuthTag()]).toString("base64"));
    });
};

exports.aesDecryptData = (encrypted_string) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(encrypted_string, "base64");
        const cipher = crypto.createDecipheriv("aes-256-gcm", process.env.AUTHORIZATION, buffer.slice(0, 12));
        cipher.setAuthTag(buffer.slice(-16));
        resolve(cipher.update(buffer.slice(12, -16)) + cipher.final());
    });
};

exports.updateClick = (client, ip, alias, clientString) => {
    return new Promise((resolve, reject) => {
        const client_info = this.getClientData(clientString);
        ipLocator.getDomainOrIPDetails(ip, "json", (err, data) => {
            if (data == "The IP address is part of a reserved range" || err) {
                console.log("data error at ip locator", data, err);
                client
                    .collection("shorten_urls")
                    .updateOne(
                        { alias },
                        {
                            $inc: { num_of_visits: 1 },
                            $push: {
                                from_visited: {
                                    ip: "XXX.XXX.XXX.XXX",
                                    client_info,
                                    requested_at: new Date().toISOString(),
                                    location: null,
                                },
                            },
                        }
                    )
                    .then((val_update) => {
                        console.log("Incremented num_of_visits without location.");
                    })
                    .catch((e) => reject(e));
            } else {
                console.log("else in iplocator");
                client
                    .collection("shorten_urls")
                    .updateOne(
                        { alias },
                        {
                            $inc: { num_of_visits: 1 },
                            $push: {
                                from_visited: {
                                    ip: data.query,
                                    client_info,
                                    requested_at: new Date().toISOString(),
                                    location: {
                                        country: data.country,
                                        city: data.city,
                                        zipCode: data.zip,
                                        lat_long: {
                                            latitude: data.lat,
                                            longitude: data.lon,
                                        },
                                        timezone: data.timezone,
                                    },
                                },
                            },
                        }
                    )
                    .then((val_update) => {
                        console.log("Location inserted and updated.");
                    })
                    .catch((e) => reject(e));
            }
            return resolve();
        });
    });
};

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

            console.log(year_month_day_click);

            if (client_name)
                if (browser_clicks[client_name]) {
                    browser_clicks[client_name].count += 1;
                } else {
                    browser_clicks[client_name] = { count: 1 };
                }

            console.log(browser_clicks);

            if (client_OS)
                if (os_clicks[client_OS]) {
                    os_clicks[client_OS].count += 1;
                } else {
                    os_clicks[client_OS] = { count: 1 };
                }

            console.log(os_clicks);

            if (device_type)
                if (device_clicks[device_type]) {
                    device_clicks[device_type].count += 1;
                } else {
                    device_clicks[device_type] = { count: 1 };
                }

            console.log(device_clicks);

            if (country && city)
                if (country_clicks[country] && country_clicks[country][city]) {
                    console.log("true");
                    country_clicks[country].count += 1;
                    country_clicks[country][city].count += 1;
                } else {
                    console.log("false");
                    country_clicks[country] = { count: 1, [city]: { count: 1 } };
                }

            console.log(country_clicks);
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
