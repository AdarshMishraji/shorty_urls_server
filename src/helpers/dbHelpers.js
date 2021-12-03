exports.insertOne = (value, db, collection = "shorten_urls") => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection(collection)
                .insertOne(value)
                .then((value) => {
                    return resolve({ insertedCount: value.insertedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.findOne = (query, db, collection = "shorten_urls") => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection(collection)
                .findOne(query)
                .then((value) => {
                    return resolve(value);
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.updateOne = (query, value, db, collection = "shorten_urls") => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection(collection)
                .updateOne(query, value)
                .then((value) => {
                    return resolve({ modifiedCount: value.modifiedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};

exports.deleteOne = (query, db, collection = "shorten_urls") => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection(collection)
                .deleteOne(query)
                .then((value) => {
                    return resolve({ deletedCount: value.deletedCount });
                })
                .catch((e) => {
                    return reject({ error: "Internal Error" });
                });
        } else {
            return reject({ error: "DB is not connected" });
        }
    });
};
