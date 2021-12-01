const crypto = require("crypto");
const dotEnv = require("dotenv");
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;
const Meta = require("html-metadata-parser");

const { updateOne, deleteOne, findOne, insertOne, hashData, aesEncryptData, aesDecryptData } = require("../helpers");

dotEnv.config();

exports.generateShortURL = (user, url, db) => {
    return new Promise(async (resolve, reject) => {
        const hashed_url = (await hashData(url)).hashed_data;
        findOne({ hashed_url, uid: user.uid }, db)
            .then(async (value) => {
                if (value) {
                    return resolve({
                        code: 409,
                        data: {
                            short_url: process.env.OWN_URL_DEFAULT + (await aesDecryptData(value.alias)).value,
                            error: "URL already exists.",
                            is_active: value.is_active,
                            is_password_protected: Boolean(value?.protection?.password),
                            is_expired: value?.expired_at > Date.now(),
                        },
                    });
                } else {
                    const new_endpoint = crypto.randomBytes(4).toString("hex");
                    const enpoint_hash = (await hashData(new_endpoint)).hashed_data;
                    const encrypt_endpoint = (await aesEncryptData(new_endpoint)).key;
                    Meta.parser(url)
                        .then(async ({ meta }) => {
                            insertOne(
                                {
                                    url: (await aesEncryptData(url)).key,
                                    hashed_url,
                                    alias: encrypt_endpoint,
                                    hashed_alias: enpoint_hash,
                                    is_active: true,
                                    num_of_visits: 0,
                                    created_at: new Date().toISOString(),
                                    uid: user.uid,
                                    meta_data: (
                                        await aesEncryptData(
                                            JSON.stringify({
                                                title: meta?.title,
                                                description: meta?.description,
                                                image: meta?.image,
                                                site_name: meta?.site_name,
                                                type: meta?.type,
                                            })
                                        )
                                    ).key,
                                },
                                db
                            )
                                .then(({ insertedCount }) => {
                                    if (insertedCount > 0) {
                                        return resolve({
                                            code: 200,
                                            data: {
                                                short_url: process.env.OWN_URL_DEFAULT + new_endpoint,
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
            .catch((error) => reject({ code: 500, error }));
    });
};

exports.changeAlias = (user, urlID, alias, db) => {
    return new Promise(async (resolve, reject) => {
        const valid_alias = alias.replace(/[^a-z0-9-]/gi, "");
        const valid_hash = (await hashData(valid_alias)).hashed_data;
        findOne({ hash: valid_alias }, db)
            .then(async (val) => {
                if (val?._id) {
                    return reject({ code: 403, message: "This alias is already in use." });
                } else {
                    updateOne(
                        { _id: ObjectID(urlID), uid: user.uid },
                        { $set: { alias: (await aesEncryptData(valid_alias)).key, hashed_alias: valid_hash, updated_at: new Date().toISOString() } },
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
        if (!expired_at || expired_at > Date.now())
            updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { expired_at, updated_at: new Date().toISOString() } }, db)
                .then(({ modifiedCount }) => {
                    if (modifiedCount > 0) {
                        return resolve({ code: 200, message: "OK" });
                    } else {
                        return reject({ code: 404, error: "Nothing has Changed." });
                    }
                })
                .catch(({ error }) => reject({ code: 500, error }));
        else reject({ code: 400, error: "Expiration time must be of future" });
    });
};

exports.updatePassword = (user, urlID, password, db) => {
    return new Promise((resolve, reject) => {
        const encryptedPassword = bcrypt.hashSync(password, 12);
        updateOne(
            { _id: ObjectID(urlID), uid: user.uid },
            { $set: { protection: { password: encryptedPassword, protected_at: new Date().toISOString() }, updated_at: new Date().toISOString() } },
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
        updateOne({ _id: ObjectID(urlID), uid: user.uid }, { $set: { protection: {}, updated_at: new Date().toISOString() } }, db)
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
