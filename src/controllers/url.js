const dotEnv = require("dotenv");
var ObjectID = require("mongodb").ObjectID;

const { aesDecryptData, getMetaData, getMetaDataOfAURL, findOne } = require("../helpers");

dotEnv.config();

exports.getURLs = (user, limit, skip, query, db) => {
    return new Promise(async (resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .find({ uid: user.uid })
                .skip(skip ? parseInt(skip) : 0)
                .limit(limit ? parseInt(limit) : Number.MAX_SAFE_INTEGER)
                .toArray()
                .then(async (value) => {
                    return resolve({
                        code: 200,
                        data: {
                            urls: await Promise.all(
                                value.map(async (val) => {
                                    let x = {
                                        ...val,
                                        url: val?.url && (await aesDecryptData(val?.url)).value,
                                        meta_data: val?.meta_data && JSON.parse((await aesDecryptData(val?.meta_data)).value),
                                        from_visited:
                                            val?.from_visited &&
                                            (await Promise.all(
                                                val?.from_visited?.map(async (ele, index) => {
                                                    return {
                                                        ...ele,
                                                        ip: ele?.ip && (await aesDecryptData(ele?.ip)).value,
                                                        client_info: ele?.client_info && JSON.parse((await aesDecryptData(ele?.client_info))?.value),
                                                        location: ele?.location && JSON.parse((await aesDecryptData(ele?.location))?.value),
                                                    };
                                                })
                                            )),
                                        is_password_protected: Boolean(val?.protection?.password),
                                        short_url: val?.alias && process.env.OWN_URL_DEFAULT + (await aesDecryptData(val?.alias)).value,
                                    };
                                    delete x?.hashed_url;
                                    delete x?.hashed_alias;
                                    delete x?.protection;
                                    delete x?.alias;
                                    return x;
                                })
                            ),
                        },
                    });
                })
                .catch((e) => {
                    return reject({ code: 500, error: "Error while fetching history.", reason: e });
                });
        } else {
            return reject({ code: 500, error: "Unable to connect to DB." });
        }
    });
};

exports.urlData = (user, geo_data, urlID, db) => {
    return new Promise(async (resolve, reject) => {
        findOne({ uid: user.uid, _id: ObjectID(urlID) }, db)
            .then(async (value) => {
                if (value) {
                    const { meta, decrypted_from_visited } = await getMetaDataOfAURL(value?.from_visited, geo_data?.timezone);
                    const data = {
                        info: {
                            ...value,
                            url: value?.url && (await aesDecryptData(value?.url)).value,
                            meta_data: value?.meta_data && JSON.parse((await aesDecryptData(value?.meta_data)).value),
                            from_visited: decrypted_from_visited,
                            is_password_protected: Boolean(value?.protection?.password),
                            short_url: value?.alias && process.env.OWN_URL_DEFAULT + (await aesDecryptData(value?.alias)).value,
                        },
                        meta,
                    };
                    delete data?.info?.hashed_url;
                    delete data?.info?.hashed_alias;
                    delete data?.info?.alias;
                    delete data?.info?.protection;

                    return resolve({
                        code: 200,
                        data,
                    });
                } else {
                    return resolve({ code: 404, error: "URL not found." });
                }
            })
            .catch(({ error }) => {
                return reject({ code: 500, error: "Internal Error", reason: error });
            });
    });
};

exports.getMeta = (withoutAuth, geo_data, user, db) => {
    return new Promise(async (resolve, reject) => {
        if (db) {
            db.collection("shorten_urls")
                .find(withoutAuth === "true" ? null : { uid: user.uid })
                .sort({ num_of_visits: -1 })
                .toArray()
                .then(async (result) => {
                    const metaData = await getMetaData(result, geo_data?.timezone);
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
                    return reject({ code: 500, error: "Unable to fetch meta data.", reason: e });
                });
        } else {
            return reject({ code: 500, error: "Unable to connect to DB." });
        }
    });
};
