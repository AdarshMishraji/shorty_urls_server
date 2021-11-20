const express = require("express");
const dotEnv = require("dotenv");
const { VerifyAndDecodeJWT } = require("../helpers");
const {
    generateShortURL,
    changeAlias,
    deleteURL,
    updateURLStatus,
    setExpirationTime,
    updatePassword,
    removePassword,
} = require("../utils/manageShortURL");

dotEnv.config();

const app = express.Router();

app.post("/generate_short_url", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { url } = req.body;
        if (accesstoken) {
            if (url.includes(process.env.OWN_URL_DEFAULT)) {
                return res.status(405).json({ error: "It's already shortened." });
            } else {
                const user = VerifyAndDecodeJWT(accesstoken);
                if (url) {
                    if (user) {
                        generateShortURL(user, url, req.app.locals.db)
                            .then(({ code, data }) => res.status(code).json(data))
                            .catch(({ code, error }) => res.status(code).json({ error }));
                    } else {
                        return res.status(400).json({ error: "Invalid User." });
                    }
                } else {
                    return res.status(422).json({ error: "Not accepted empty url." });
                }
            }
        } else {
            return res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        return res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/change_alias", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, alias } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    changeAlias(user, urlID, alias, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.delete("/delete_url", async (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    deleteURL(user, urlID, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/update_url_status", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, status } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    updateURLStatus(user, urlID, status, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/set_expiration_time", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, expired_at } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    setExpirationTime(user, urlID, expired_at, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.patch("/update_password", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID, password } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID && password) {
                if (user) {
                    updatePassword(user, urlID, password, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

app.delete("/remove_password", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.body;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (urlID) {
                if (user) {
                    removePassword(user, urlID, req.app.locals.db)
                        .then(({ code, message }) => res.status(code).json({ message }))
                        .catch(({ code, error }) => res.status(code).json({ error }));
                } else {
                    res.status(400).json({ error: "Invalid User." });
                }
            } else {
                res.status(422).json({ error: "Invalid Data." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
