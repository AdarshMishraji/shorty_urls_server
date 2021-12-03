const http = require("http");

exports.fetchGeoData = (ip, callback) => {
    http.get(
        {
            host: "ip-api.com",
            path: `/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
        },
        (res) => {
            res.on("data", (data) => {
                if (data) {
                    const geo_data = JSON.parse(data.toString());
                    if (geo_data.status === "success") return callback(geo_data);
                    else return callback(null);
                }
                return callback();
            });
        }
    );
};

/**
 * `{
       ` status: 'success',
       ` continent: 'North America',
       ` continentCode: 'NA',
       ` country: 'United States',
       ` countryCode: 'US',
       ` region: 'VA',
       ` regionName: 'Virginia',
       ` city: 'Ashburn',
       ` zip: '20149',
       ` lat: 39.03,
       ` lon: -77.5,
       ` timezone: 'America/New_York',
       ` offset: -18000,
       ` currency: 'USD',
       ` isp: 'Google LLC',
       ` org: 'Google Public DNS',
       ` as: 'AS15169 Google LLC',
       ` asname: 'GOOGLE',
       ` reverse: 'dns.google',
       ` mobile: false,
       ` proxy: false,
       ` hosting: true,
        query: '8.8.8.8'
    }
 */
