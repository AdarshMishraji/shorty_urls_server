const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
dotEnv.config();

exports.VerifyAndDecodeJWT = (token) => {
    if (token) return jwt.verify(token, process.env.SECRET);
    return null;
};

exports.decodeJWT = (token) => {
    if (token) return jwt.decode(token);
    return null;
};
