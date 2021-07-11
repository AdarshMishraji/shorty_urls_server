const path = require("path");
const express = require("express");
const ipLocator = require("ip-locator");
const dotEnv = require("dotenv");

const connectToMongoDBServer = require("../mongoDBConfig");

dotEnv.config();
const app = express.Router();

app.use(express.static(path.join(__dirname, "../../public/")));

app.get("/:url", (req, res) => {
  const { url } = req.params;
  console.log(url, process.env.OWN_URL_V2 + url);
  connectToMongoDBServer("shorty_urls", (error, client) => {
    if (client) {
      client
        .collection("shorten_urls_v2")
        .findOne({ short_url: process.env.OWN_URL_V2 + url })
        .then((value) => {
          if (value) {
            console.log("URL found.", value);
            const ip =
              req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            ipLocator.getDomainOrIPDetails(ip, "json", (err, data) => {
              if (data == "The IP address is part of a reserved range" || err) {
                console.log("data error at ip locator", data, err);
                client.collection("url_visit_history_v2").updateOne(
                  { url: process.env.OWN_URL_V2 + url },
                  {
                    $inc: { num_of_visits: 1 },
                    $push: {
                      from: {
                        ip: "XXX.XXX.XXX.XXX",
                        requested_at: Date.now(),
                        location: null,
                      },
                    },
                  }
                );
              } else {
                console.log("else in iplocator");
                client
                  .collection("url_visit_history_v2")
                  .updateOne(
                    { url: process.env.OWN_URL_V2 + url },
                    {
                      $inc: { num_of_visits: 1 },
                      $push: {
                        from: {
                          ip: data.query,
                          requested_at: Date.now(),
                          location: {
                            country: data.country,
                            city: data.city,
                            zipCode: data.zip,
                            lat_long: {
                              latitude: data.lat,
                              longitude: data.lon,
                            },
                            timezone: data.timezone,
                          },
                        },
                      },
                    }
                  )
                  .then((val_insert) => {
                    console.log("Location inserted and updated.");
                  });
              }
              res.status(200).redirect(`${value.url}`);
            });
          } else {
            console.log("No url found.");
            res
              .status(404)
              .sendFile(path.join(__dirname, "../../public/404.html"));
            return;
          }
        })
        .catch((e) => {
          console.log("Error while fetching url.", e);
          res
            .status(500)
            .sendFile(path.join(__dirname, "../../public/InternalError.html"));
          return;
        });
      if (error) {
        console.log("Error in connecting DB.", error);
        res
          .status(500)
          .sendFile(path.join(__dirname, "../../public/InternalError.html"));
      }
    }
  });
});

module.exports = app;
