const express = require("express");
const dotEnv = require("dotenv");
const bcrypt = require("bcrypt");

const { aesDecryptData } = require("../../helpers");
const { updateClick } = require("../../controllers");

dotEnv.config();

const app = express.Router();

app.post("/", (req, res) => {
    const { key, requested_at, password } = req.body;
    if (Date.now() - requested_at <= 120000) {
        aesDecryptData(key).then(({ value }) => {
            try {
                const { url, auth, actual_password } = JSON.parse(value);
                if (auth === process.env.AUTHORIZATION) {
                    if (bcrypt.compareSync(password, actual_password)) {
                        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                        updateClick(ip, url, req.header("user-agent"), req.app.locals.db)
                            .then(({ code, message }) => res.status(code).json({ message }))
                            .catch(({ code, error }) => res.status(code).json({ error }));
                    } else {
                        return res.status(401).json({ error: "Wrong Password" });
                    }
                } else {
                    return res.status(400).json({ error: "Invalid Access." });
                }
            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Internal Error." });
            }
        });
    } else {
        return res.status(400).json({ error: "Request Expired." });
    }
});

exports.passwordProtection = app;
