const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");

const { verifyAndDecodeJWT } = require("../helpers");

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.validateUser = (req, res, next) => {
    try {
        const { access_token } = req.headers;
        const decoded_user = verifyAndDecodeJWT(access_token);
        if (decoded_user) {
            if (Math.floor(Date.now() / 1000) >= decoded_user.exp) {
                return res.status(401).json({ error: "Unauthorized User.", reason: "Token Expired." });
            }
            res.locals.user = decoded_user;
            next();
        } else {
            return res.status(400).json({ error: "Invalid User." });
        }
    } catch (e) {
        return res.status(400).json({ error: "Invalid Access.", reason: JSON.stringify(e) });
    }
};

exports.validateAccess = (req, res, next) => {
    const { authorization } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        next();
    } else {
        return res.status(401).json({ error: "Authorization Failed." });
    }
};

exports.validateAuthToken = (req, res, next) => {
    const { token } = req.body;
    if (token) {
        client
            .verifyIdToken({ idToken: token })
            .then((response) => {
                const user = response.getPayload();
                res.locals.user = user;
                next();
            })
            .catch((e) => {
                console.log(e);
                return res.status(400).json({ error: "Invalid User." });
            });
    } else return res.status(400).json({ error: "Invalid User.", reason: "Token not exits" });
};

exports.logRoute = (req, res, next) => {
    console.log("route->>>>>>", req.path);
    next();
};
