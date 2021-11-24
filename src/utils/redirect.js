const dotEnv = require("dotenv");
const ipLocator = require("ip-locator");

const { updateOne } = require(".");
const { getClientData } = require("../helpers");

dotEnv.config();

exports.updateClick = (ip, alias, clientString, db) => {
    return new Promise((resolve, reject) => {
        const client_info = getClientData(clientString);
        ipLocator.getDomainOrIPDetails(ip, "json", (err, data) => {
            if (data == "The IP address is part of a reserved range" || err) {
                updateOne(
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
                    },
                    db
                )
                    .then(({ modifiedCount }) => {
                        if (modifiedCount > 0) {
                            return resolve({ code: 200, message: "Incremented num_of_visits without location." });
                        } else {
                            return reject({ code: 400, error: "Failed to udpate." });
                        }
                    })
                    .catch(({ error }) => reject({ code: 500, error }));
            } else {
                updateOne(
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
                    },
                    db
                )
                    .then(({ modifiedCount }) => {
                        if (modifiedCount > 0) {
                            return resolve({ code: 200, message: "Incremented num_of_visits with location." });
                        } else {
                            return reject({ code: 400, error: "Failed to udpate." });
                        }
                    })
                    .catch(({ error }) => reject({ code: 500, error }));
            }
        });
    });
};
