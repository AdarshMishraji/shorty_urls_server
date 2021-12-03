const dotEnv = require("dotenv");

const { aesDecryptData } = require("../helpers");

dotEnv.config();

exports.details = (user, db) => {
    return new Promise(async (resolve, reject) => {
        findOne({ email_hash: user.email_hash }, db, "users").then(async (value) => {
            if (value) {
                const data = {
                    ...value,
                    name: (await aesDecryptData(user?.name)).value,
                    email: (await aesDecryptData(user?.email)).value,
                    profile_img: (await aesDecryptData(user?.profile_img)).value,
                };
                delete data?.email_hash;
                return resolve({ code: 200, user: data });
            } else {
                return reject({ code: 404, error: "User not found." });
            }
        });
    });
};
