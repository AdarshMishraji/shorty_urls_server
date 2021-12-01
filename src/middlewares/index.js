const dotenv = require("dotenv");

const { verifyAndDecodeJWT } = require("../helpers");

dotenv.config();

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
