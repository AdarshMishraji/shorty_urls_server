const dotEnv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { aesEncryptData, aesDecryptData, hashData, getClientData, insertOne, findOne } = require("../helpers");

dotEnv.config();

exports.authenticate = (user, geo_data, user_agent, db) => {
    return new Promise(async (resolve, reject) => {
        const email_hash = (await hashData(user.email)).hashed_data;
        const date = new Date().toISOString();
        const client_info = getClientData(user_agent);

        const login_history_element = (
            await aesEncryptData(
                JSON.stringify({
                    ip: geo_data?.query,
                    logged_in_at: new Date().toISOString(),
                    continent: geo_data?.continent,
                    country: geo_data?.country,
                    city: geo_data?.city,
                    region: geo_data?.regionName,
                    zipCode: geo_data?.zip,
                    lat_long: {
                        latitude: geo_data?.lat,
                        longitude: geo_data?.lon,
                    },
                    timezone: geo_data?.timezone,
                    client_info,
                })
            )
        ).key;

        findOne({ email_hash }, db, "users")
            .then(async (value) => {
                if (value) {
                    db.collection("users")
                        .updateOne(
                            { email_hash },
                            {
                                $set: { last_login_at: date },
                                $push: {
                                    login_history: login_history_element,
                                },
                            }
                        )
                        .then(async (val) => {
                            if (val.modifiedCount > 0) {
                                const data = {
                                    ...value,
                                    name: (await aesDecryptData(value?.name)).value,
                                    email: (await aesDecryptData(value?.email)).value,
                                    profile_img: (await aesDecryptData(value?.profile_img)).value,
                                };
                                delete data?.email_hash;
                                const new_token = jwt.sign(
                                    { ...data, last_login_at: date, authenticate_code: process.env.AUTHORIZATION },
                                    process.env.SECRET,
                                    {
                                        expiresIn: "2 days",
                                    }
                                );
                                return resolve({ code: 200, data: { token: new_token, error: "User already exists." } });
                            } else {
                                return reject({ code: 500, error: "Internal Error", reason: "Update Count = 0" });
                            }
                        })
                        .catch((e) => {
                            return reject({ code: 500, error: "Internal Error", reason: e });
                        });
                } else {
                    const dataToClient = {
                        uid: uuidv4(),
                        name: user?.given_name + " " + user?.family_name,
                        email: user?.email,
                        email_verified: user?.email_verified,
                        locale: user?.locale,
                        last_login_at: date,
                        joined_at: date,
                        profile_img: user?.picture,
                    };
                    insertOne(
                        {
                            ...dataToClient,
                            email_hash,
                            name: (await aesEncryptData(dataToClient.name)).key,
                            email: (await aesEncryptData(dataToClient?.email)).key,
                            profile_img: (await aesEncryptData(dataToClient?.profile_img)).key,
                            login_history: [login_history_element],
                        },
                        db,
                        "users"
                    )
                        .then(({ insertedCount }) => {
                            if (insertedCount > 0) {
                                const new_token = jwt.sign({ ...dataToClient, authenticate_code: process.env.AUTHORIZATION }, process.env.SECRET, {
                                    expiresIn: "2 days",
                                });
                                return resolve({ code: 200, data: { token: new_token } });
                            } else {
                                return reject({ code: 500, error: "Internal Error", reason: "Insert Count = 0" });
                            }
                        })
                        .catch(({ error }) => {
                            return reject({ code: 500, error: "Internal Error", reason: error });
                        });
                }
            })
            .catch((e) => {
                return reject({ code: 500, error: "Internal Error", reason: e });
            });
    });
};
