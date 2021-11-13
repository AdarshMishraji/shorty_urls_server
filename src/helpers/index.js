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
        clientType: deviceData?.client?.type,
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

exports.updateClick = (client, ip, short_url, clientString) => {
    return new Promise((resolve, reject) => {
        const client_info = this.getClientData(clientString);
        ipLocator.getDomainOrIPDetails(ip, "json", (err, data) => {
            if (data == "The IP address is part of a reserved range" || err) {
                console.log("data error at ip locator", data, err);
                client
                    .collection("shorten_urls")
                    .updateOne(
                        { short_url },
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
                        { short_url: short_url },
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
