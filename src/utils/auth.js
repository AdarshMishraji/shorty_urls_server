const dotEnv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
dotEnv.config();

exports.authenticate = (user, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("users")
                .findOne({ email: user?.email })
                .then((value) => {
                    if (value) {
                        console.log("user already existed");
                        const new_token = jwt.sign({ uid: value?.uid }, process.env.SECRET);
                        return resolve({ code: 200, token: new_token });
                    } else {
                        const uid = uuidv4();
                        db.collection("users")
                            .insertOne({
                                uid,
                                email: user?.email,
                                name: user?.name,
                                joined_at: new Date().toISOString(),
                                profile_img: user?.picture,
                            })
                            .then(() => {
                                const new_token = jwt.sign({ uid }, process.env.SECRET);
                                return resolve({ code: 200, token: new_token });
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
