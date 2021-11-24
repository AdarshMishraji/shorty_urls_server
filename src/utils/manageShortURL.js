const crypto = require("crypto");
const dotEnv = require("dotenv");
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;
const Meta = require("html-metadata-parser");

const { updateOne, deleteOne, findOne, insertOne } = require("../utils");

dotEnv.config();

exports.generateShortURL = (user, url, db) => {
    return new Promise((resolve, reject) => {
        findOne({ url, uid: user.uid }, db)
            .then((value) => {
                if (value) {
                    console.log("URL already exists.");
                    return resolve({
                        code: 409,
                        data: {
                            short_url: process.env.OWN_URL_DEFAULT + value.alias,
                            error: "URL already exists.",
                            is_active: value.is_active,
                            is_password_protected: Boolean(value?.protection?.password),
                            is_expired: value?.expired_at > Date.now(),
                        },
                    });
                } else {
                    const newEndpoint = crypto.randomBytes(4).toString("hex");
                    Meta.parser(url)
                        .then(({ meta }) => {
                            insertOne(
                                {
                                    url,
                                    alias: newEndpoint,
                                    is_active: true,
                                    num_of_visits: 0,
                                    created_at: new Date().toISOString(),
                                    uid: user.uid,
                                    title: meta?.title,
                                    description: meta?.description,
                                },
                                db
                            )
                                .then(({ insertedCount }) => {
                                    if (insertedCount > 0) {
                                        return resolve({
                                            code: 200,
                                            data: {
                                                short_url: process.env.OWN_URL_DEFAULT + newEndpoint,
                                            },
                                        });
                                    } else {
                                        return reject({
                                            code: 404,
                                            error: "Nothing has Changed.",
                                        });
                                    }
                                })
                                .catch(({ error }) => reject({ code: 500, error }));
                        })
                        .catch((e) => {
                            return reject({ code: 400, error: "Invalid URL." });
                        });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.changeAlias = (user, urlID, alias, db) => {
    return new Promise((resolve, reject) => {
        findOne({ alias }, db)
            .then((val) => {
                if (val?._id) {
                    return reject({ code: 403, message: "This alias is already in use." });
                } else {
                    updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { alias } }, db)
                        .then(({ modifiedCount }) => {
                            if (modifiedCount > 0) {
                                return resolve({ code: 200, message: "OK" });
                            } else {
                                return reject({ code: 404, error: "Nothing has Changed." });
                            }
                        })
                        .catch(({ error }) => reject({ code: 500, error }));
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.deleteURL = (user, urlID, db) => {
    return new Promise((resolve, reject) => {
        deleteOne({ _id: ObjectID(urlID), uid: user.uid }, db)
            .then(({ deletedCount }) => {
                if (deletedCount > 0) {
                    return resolve({ code: 200, message: "OK" });
                } else {
                    return reject({ code: 404, error: "URL not found" });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.updateURLStatus = (user, urlID, status, db) => {
    return new Promise((resolve, reject) => {
        updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { is_active: status } }, db)
            .then(({ modifiedCount }) => {
                if (modifiedCount > 0) {
                    return resolve({ code: 200, message: "OK" });
                } else {
                    return reject({ code: 404, error: "Nothing has Changed." });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.setExpirationTime = (user, urlID, expired_at, db) => {
    return new Promise((resolve, reject) => {
        updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { expired_at } }, db)
            .then(({ modifiedCount }) => {
                if (modifiedCount > 0) {
                    return resolve({ code: 200, message: "OK" });
                } else {
                    return reject({ code: 404, error: "Nothing has Changed." });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.updatePassword = (user, urlID, password, db) => {
    return new Promise((resolve, reject) => {
        const encryptedPassword = bcrypt.hashSync(password, 12);
        updateOne(
            { _id: ObjectID(urlID), uid: user.uid },
            { $set: { protection: { password: encryptedPassword, protected_at: new Date().toISOString() } } },
            db
        )
            .then(({ modifiedCount }) => {
                if (modifiedCount > 0) {
                    return resolve({ code: 200, message: "OK" });
                } else {
                    return reject({ code: 404, error: "Nothing has Changed." });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};

exports.removePassword = (user, urlID, db) => {
    return new Promise((resolve, reject) => {
        updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { protection: {} } }, db)
            .then(({ modifiedCount }) => {
                if (modifiedCount > 0) {
                    return resolve({ code: 200, message: "OK" });
                } else {
                    return reject({ code: 404, error: "Nothing has Changed." });
                }
            })
            .catch(({ error }) => reject({ code: 500, error }));
    });
};
