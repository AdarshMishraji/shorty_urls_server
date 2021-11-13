const express = require("express");
const dotEnv = require("dotenv");
const bcrypt = require("bcrypt");
const { aesDecryptData, updateClick } = require("../helpers");

dotEnv.config();

const app = express.Router();

app.post("/password_for_protected_site", (req, res) => {
    const { key, requested_at, password } = req.body;
    console.log(key, requested_at, password);
    if (Date.now() - requested_at <= 120000) {
        aesDecryptData(key).then((value) => {
            try {
                const { url, auth, actual_password } = JSON.parse(value);
                console.log(url, auth, actual_password);
                if (auth === process.env.AUTHORIZATION) {
                    if (bcrypt.compareSync(password, actual_password)) {
                        updateClick(client, ip, value.short_url, req.header("user-agent"))
                            .then(() => es.status(200).send("OK"))
                            .catch((e) => {
                                res.status(500).send("Internal Error");
                            });
                    } else {
                        return res.status(401).send({ error: "Wrong Password" });
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
        console.log("expired");
        return res.status(400).json({ error: "Request Expired." });
    }
});

module.exports = app;
