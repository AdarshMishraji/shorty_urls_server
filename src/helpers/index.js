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

exports.getDeviceType = (device) => {
    if (device.includes("Android", 12) || device.includes("iPhone", 12)) return { type: "Mobile", possibility: ["Android", "iPhone"] };
    else return { type: "Desktop", possibility: ["Windows", "Macintosh", "Linux"] };
};

exports.getUserData = (client, uid) => {
    return client.collection("users").findOne({ uid: uid });
};
