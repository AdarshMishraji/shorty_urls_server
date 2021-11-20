const dotEnv = require("dotenv");
var ObjectID = require("mongodb").ObjectID;

const { getMetaData, getMetaDataOfAURL, findOne } = require("../helpers");

dotEnv.config();

exports.getURLs = (user, limit, skip, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .find({ uid: user.uid })
                .skip(skip ? parseInt(skip) : 0)
                .limit(limit ? parseInt(limit) : Number.MAX_SAFE_INTEGER)
                .toArray()
                .then((value) => {
                    return resolve({
                        code: 200,
                        data: {
                            urls: value.map((val) => {
                                return { ...val, short_url: process.env.OWN_URL_DEFAULT + val.alias };
                            }),
                        },
                    });
                })
                .catch((e) => {
                    console.log("Error while fetching history", e);
                    return reject({ code: 500, error: "Error while fetching history." });
                });
        } else {
            return reject({ code: 500, error: "Unable to connect to DB." });
        }
    });
};

exports.urlData = (user, urlID, db) => {
    return new Promise((resolve, reject) => {
        findOne({ uid: user.uid, _id: ObjectID(urlID) }, db)
            .then((value) => {
                const meta = getMetaDataOfAURL(value?.from_visited);
                return resolve({ code: 200, data: { info: { ...value, short_url: process.env.OWN_URL_DEFAULT + value.alias }, meta } });
            })
            .catch(({ error }) => {
                return reject({ code: 500, error });
            });
    });
};

exports.getMeta = (withoutAuth, user, db) => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .find(withoutAuth === "true" ? null : { uid: user.uid })
                .sort({ num_of_visits: -1 })
                .toArray()
                .then((result) => {
                    const metaData = getMetaData(result);
                    return resolve({
                        code: 200,
                        data: {
                            all_links: result.length,
                            all_clicks: metaData?.count,
                            clicks: metaData?.clicks,
                            links_added: metaData?.links_added,
                            top_three: withoutAuth === "true" ? null : metaData?.top_three,
                        },
                    });
                })
                .catch((e) => {
                    console.log(e);
                    return reject({ code: 500, error: "Unable to fetch meta data." });
                });
        } else {
            return reject({ code: 500, error: "Unable to connect to DB." });
        }
    });
};
