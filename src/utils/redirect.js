const dotEnv = require("dotenv");
const ipLocator = require("ip-locator");

const { updateOne } = require(".");
const { getClientData, aesEncryptData } = require("../helpers");

dotEnv.config();

exports.updateClick = (ip, hashed_alias, clientString, db) => {
    return new Promise(async (resolve, reject) => {
        ipLocator.getDomainOrIPDetails(ip, "json", async (err, data) => {
            const client_info = (await aesEncryptData(JSON.stringify(getClientData(clientString)))).key;
            const encrypted_ip = (await aesEncryptData(ip)).key;
            let data_to_send = {};
            if (data == "The IP address is part of a reserved range" || err) {
                data_to_send = {
                    $inc: { num_of_visits: 1 },
                    $push: {
                        from_visited: {
                            ip: encrypted_ip,
                            client_info,
                            requested_at: new Date().toISOString(),
                            location: null,
                        },
                    },
                };
            } else {
                const location = (
                    await aesEncryptData(
                        JSON.stringify({
                            country: data.country,
                            city: data.city,
                            zipCode: data.zip,
                            lat_long: {
                                latitude: data.lat,
                                longitude: data.lon,
                            },
                            timezone: data.timezone,
                        })
                    )
                ).key;
                data_to_send = {
                    $inc: { num_of_visits: 1 },
                    $push: {
                        from_visited: {
                            ip: encrypted_ip,
                            client_info,
                            requested_at: new Date().toISOString(),
                            location,
                        },
                    },
                };
            }
            updateOne({ hashed_alias }, data_to_send, db)
                .then(({ modifiedCount }) => {
                    if (modifiedCount > 0) {
                        return resolve({ code: 200, message: "Incremented num_of_visits" });
                    } else {
                        return reject({ code: 400, error: "Failed to udpate." });
                    }
                })
                .catch(({ error }) => reject({ code: 500, error }));
        });
    });
};
