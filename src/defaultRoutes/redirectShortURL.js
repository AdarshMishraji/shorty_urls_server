const path = require("path");
const express = require("express");
const dotEnv = require("dotenv");

const connectToMongoDBServer = require("../mongoDBConfig");
const { aesEncryptData, updateClick } = require("../helpers");

dotEnv.config();
const app = express.Router();

app.use(express.static(path.join(__dirname, "../../public/")));

app.get("/:url", (req, res) => {
    const { url } = req.params;
    connectToMongoDBServer("shorty_urls", (error, client) => {
        if (client) {
            client
                .collection("shorten_urls")
                .findOne({ short_url: process.env.OWN_URL_DEFAULT + url })
                .then((value) => {
                    if (value) {
                        if (value?.is_active) {
                            if (!value.expired_at || value?.expired_at > Date.now()) {
                                //for 24 hours -> Date.now() + (24*60*60*1000)
                                if (value?.protection?.password) {
                                    aesEncryptData(
                                        JSON.stringify({
                                            url: process.env.OWN_URL_DEFAULT + url,
                                            auth: process.env.AUTHORIZATION,
                                            actual_password: value.protection.password,
                                        })
                                    )
                                        .then((key) => {
                                            return res.render("passwordEntry", {
                                                key,
                                                created_at: Date.now(),
                                                url: value.url,
                                                short_url: process.env.OWN_URL_DEFAULT + url,
                                            });
                                        })
                                        .catch((e) => {
                                            console.log(e);
                                            return res.render("InternalError");
                                        });
                                } else {
                                    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                                    updateClick(client, ip, value.short_url, req.header("user-agent"))
                                        .then(() => res.status(200).redirect(`${value.url}`))
                                        .catch((e) => {
                                            console.log(e);
                                            res.render("InternalError");
                                        });
                                }
                            } else {
                                return res.render("LinkExpired", { message: "Link has been Expired!" });
                            }
                        } else {
                            console.log("URL Inactive.");
                            return res.render("LinkExpired", { message: "Link has been deactivated by the creator." });
                        }
                    } else {
                        console.log("No url found.");
                        return res.render("404");
                    }
                })
                .catch((e) => {
                    console.log("Error while fetching url.", e);
                    return res.render("InternalError");
                });
            if (error) {
                console.log("Error in connecting DB.", error);
                return res.render("InternalError");
            }
        }
    });
});

module.exports = app;
