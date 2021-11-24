const path = require("path");
const express = require("express");
const dotEnv = require("dotenv");

const { aesEncryptData } = require("../helpers");
const { updateClick } = require("../utils/redirect");
const { findOne } = require("../utils");

dotEnv.config();

const app = express.Router();

app.use(express.static(path.join(__dirname, "../../public/")));

app.get("/:url", (req, res) => {
    const { url } = req.params;
    findOne({ alias: url }, req.app.locals.db)
        .then((value) => {
            if (value) {
                if (value?.is_active) {
                    if (!value.expired_at || value?.expired_at > Date.now()) {
                        if (value?.protection?.password) {
                            aesEncryptData(
                                JSON.stringify({
                                    url,
                                    auth: process.env.AUTHORIZATION,
                                    actual_password: value.protection.password,
                                })
                            )
                                .then(({ key }) => {
                                    return res.status(200).render("passwordEntry", {
                                        key,
                                        created_at: Date.now(),
                                        url: value.url,
                                        short_url: process.env.OWN_URL_DEFAULT + url,
                                    });
                                })
                                .catch((e) => {
                                    console.log(e);
                                    return res.status(500).render("InternalError");
                                });
                        } else {
                            const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                            updateClick(ip, url, req.header("user-agent"), req.app.locals.db)
                                .then(({ code }) => res.status(code).redirect(`${value.url}`))
                                .catch(({ code, error }) => {
                                    console.log(error);
                                    return res.status(code).render("InternalError");
                                });
                        }
                    } else {
                        return res.status(400).render("LinkExpired", { message: "Link has been Expired!" });
                    }
                } else {
                    console.log("URL Inactive.");
                    return res.status(400).render("LinkExpired", { message: "Link has been deactivated by the creator." });
                }
            } else {
                console.log("No url found.");
                return res.status(404).render("404");
            }
        })
        .catch((e) => {
            console.log("Error while fetching url.", e);
            return res.status(500).render("InternalError");
        });
});

module.exports = app;
