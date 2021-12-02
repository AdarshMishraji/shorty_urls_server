const dotEnv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { aesEncryptData, aesDecryptData, hashData } = require("../helpers");

dotEnv.config();

exports.authenticate = (user, db) => {
    return new Promise(async (resolve, reject) => {
        if (db) {
            const email_hash = (await hashData(user.email)).hashed_data;
            const date = new Date().toISOString();
            db.collection("users")
                .findOne({ email_hash })
                .then(async (value) => {
                    if (value) {
                        db.collection("users")
                            .updateOne({ email_hash }, { $set: { last_login_at: date } })
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
                                    return resolve({ code: 500, data: { token: new_token, error: "Internal Error." } });
                                }
                            })
                            .catch((e) => {
                                console.log(e);
                                return reject({ code: 500, error: "Internal Error" });
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
                        db.collection("users")
                            .findOneAndUpdate(
                                { email_hash },
                                {
                                    $set: {
                                        ...dataToClient,
                                        email_hash,
                                        name: (await aesEncryptData(dataToClient.name)).key,
                                        email: (await aesEncryptData(dataToClient?.email)).key,
                                        profile_img: (await aesEncryptData(dataToClient?.profile_img)).key,
                                    },
                                },
                                { returnNewDocument: true, upsert: true, new: true }
                            )
                            .then(() => {
                                const new_token = jwt.sign({ ...dataToClient, authenticate_code: process.env.AUTHORIZATION }, process.env.SECRET, {
                                    expiresIn: "2 days",
                                });
                                return resolve({ code: 200, data: { token: new_token } });
                            })
                            .catch((e) => {
                                console.log("error while inserting user", e);
                                return reject({ code: 500, error: "Internal Error" });
                            });
                    }
                })
                .catch((e) => {
                    console.log(e);
                    return reject({ code: 500, error: "Internal Error" });
                });
        } else {
            return reject({ code: 500, error: "DB is not connected" });
        }
    });
};
