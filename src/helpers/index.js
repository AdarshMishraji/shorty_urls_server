const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const crypto = require("crypto");
const DeviceDetector = require("device-detector-js");

dotEnv.config();

exports.VerifyAndDecodeJWT = (token) => {
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
        const aesIV = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", process.env.AUTHORIZATION, aesIV);
        resolve({ key: Buffer.concat([aesIV, Buffer.concat([cipher.update(string), cipher.final()]), cipher.getAuthTag()]).toString("base64") });
    });
};

exports.aesDecryptData = (encrypted_string) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(encrypted_string, "base64");
        const cipher = crypto.createDecipheriv("aes-256-gcm", process.env.AUTHORIZATION, buffer.slice(0, 12));
        cipher.setAuthTag(buffer.slice(-16));
        resolve({ value: cipher.update(buffer.slice(12, -16)) + cipher.final() });
    });
};
