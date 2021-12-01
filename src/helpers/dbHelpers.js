exports.insertOne = (value, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
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

exports.findOne = (query, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
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

exports.updateOne = (query, value, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
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

exports.deleteOne = (query, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
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
