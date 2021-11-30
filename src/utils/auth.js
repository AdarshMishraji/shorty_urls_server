const dotEnv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { aesEncryptData, hashData } = require("../helpers");

dotEnv.config();

exports.authenticate = (user, db) => {
    return new Promise(async (resolve, reject) => {
        if (db) {
            const email_hash = (await hashData(user.email)).hashed_data;
            console.log(email_hash);
            db.collection("users")
                .findOne({ email_hash })
                .then(async (value) => {
                    if (value) {
                        const new_token = jwt.sign({ ...value, authenticate_code: process.env.AUTHORIZATION }, process.env.SECRET, {
                            expiresIn: "2 days",
                        });
                        return resolve({ code: 200, data: { token: new_token, error: "User already esists." } });
                    } else {
                        const uid = uuidv4();
                        const data = {
                            uid,
                            email_hash,
                            email: (await aesEncryptData(user?.email)).key,
                            name: (await aesEncryptData(user?.name)).key,
                            joined_at: new Date().toISOString(),
                            profile_img: (await aesEncryptData(user?.picture)).key,
                        };
                        db.collection("users")
                            .insertOne(data)
                            .then(() => {
                                const new_token = jwt.sign({ ...data, authenticate_code: process.env.AUTHORIZATION }, process.env.SECRET, {
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
                    console.log("error while authenticate", e);
                    return reject({ code: 500, error: "Internal Error" });
                });
        } else {
            return reject({ code: 500, error: "DB is not connected" });
        }
    });
};
