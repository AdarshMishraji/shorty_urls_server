const dotEnv = require("dotenv");

const { getClientData, aesEncryptData, updateOne, fetchGeoData } = require("../helpers");

dotEnv.config();

exports.updateClick = (ip, hashed_alias, clientString, db) => {
    return new Promise(async (resolve, reject) => {
        fetchGeoData(ip, async (data) => {
            const client_info = (await aesEncryptData(JSON.stringify(getClientData(clientString)))).key;
            const encrypted_ip = (await aesEncryptData(ip)).key;
            const requested_at = new Date().toISOString();
            const data_to_send = {
                $set: { last_clicked_at: requested_at },
                $inc: { num_of_visits: 1 },
                $push: {
                    from_visited: {
                        ip: encrypted_ip,
                        client_info,
                        requested_at,
                        location: null,
                    },
                },
            };
            if (data) {
                const location = (
                    await aesEncryptData(
                        JSON.stringify({
                            continent: data.continent,
                            country: data.country,
                            city: data.city,
                            region: data.regionName,
                            zipCode: data.zip,
                            lat_long: {
                                latitude: data.lat,
                                longitude: data.lon,
                            },
                            timezone: data.timezone,
                        })
                    )
                ).key;
                data_to_send.$push.from_visited.location = location;
            }
            updateOne({ hashed_alias }, data_to_send, db)
                .then(({ modifiedCount }) => {
                    if (modifiedCount > 0) {
                        return resolve({ code: 200, message: "Incremented num_of_visits" });
                    } else {
                        return reject({ code: 400, error: "Failed to udpate.", reason: "Update Count = 0" });
                    }
                })
                .catch(({ error }) => reject({ code: 500, error: "Internal Error", reason: error }));
        });
    });
};
