const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const crypto = require("crypto");
const DeviceDetector = require("device-detector-js");

dotEnv.config();

exports.verifyAndDecodeJWT = (token) => {
    if (token) return jwt.verify(token, process.env.SECRET);
    return null;
};

exports.decodeJWT = (token) => {
    if (token) return jwt.decode(token);
    return null;
};

exports.getClientData = (device) => {
    const deviceData = new DeviceDetector().parse(device);
    return {
        client_type: deviceData?.client?.type,
        client_name: deviceData?.client?.name,
        OS: deviceData?.os?.name,
        device_type: deviceData?.device?.type,
        device_brand: deviceData?.device?.brand,
        is_bot: deviceData?.bot,
    };
};

exports.aesEncryptData = (string) => {
    return new Promise((resolve, reject) => {
        if (string && string !== "") {
            const aesIV = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv("aes-256-gcm", process.env.ENCRYPT_KEY, aesIV);
            resolve({
                key: Buffer.concat([aesIV, Buffer.concat([cipher.update(string), cipher.final()]), cipher.getAuthTag()]).toString("base64url"),
            });
        } else {
            reject({ error: "Empty String not accepted" });
        }
    });
};

exports.aesDecryptData = (encrypted_string) => {
    return new Promise((resolve, reject) => {
        if (encrypted_string && encrypted_string !== "") {
            const buffer = Buffer.from(encrypted_string, "base64url");
            const cipher = crypto.createDecipheriv("aes-256-gcm", process.env.ENCRYPT_KEY, buffer.slice(0, 12));
            cipher.setAuthTag(buffer.slice(-16));
            resolve({ value: cipher.update(buffer.slice(12, -16)) + cipher.final() });
        } else {
            reject({ error: "Empty String not accepted" });
        }
    });
};

exports.hashData = (string) => {
    return new Promise((resolve, reject) => {
        if (string && string !== "") {
            const hashed_data = crypto.createHash("SHA256", process.env.HASH_KEY).update(string).digest("base64url");
            resolve({ hashed_data });
        } else {
            reject({ error: "Empty String not accepted" });
        }
    });
};
