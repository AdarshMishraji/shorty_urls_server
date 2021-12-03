const moment = require("moment-timezone");

const { aesDecryptData } = require("./generalHelpers");

exports.getMetaData = async (data, timezone) => {
    if (data.length) {
        let count = 0;
        const res1 = {};
        const res2 = {};
        for (let i = 0; i < data.length; i++) {
            let date = timezone ? moment(data[i].created_at).tz(timezone).format("YYYY-MMMM-DD") : moment(data[i].created_at).format("YYYY-MMMM-DD");
            const [year, month] = date.split("-");
            count += data[i].num_of_visits;
            if (res2[year]) {
                res2[year].count += 1;
                if (res2[year][month]) {
                    res2[year][month].count += 1;
                } else {
                    res2[year][month] = { count: 1 };
                }
            } else {
                res2[year] = { count: 1, [month]: { count: 1 } };
            }
            if (data[i].from_visited) {
                for (let j = 0; j < data[i].from_visited.length; j++) {
                    let curr_date = timezone
                        ? moment(data[i].from_visited[j].requested_at)
                              .tz(timezone || null)
                              .format("YYYY-MMMM-DD")
                        : moment(data[i].from_visited[j].requested_at).format("YYYY-MMMM-DD");

                    const [currYear, currMonth, currDay] = curr_date.split("-");
                    if (res1[currYear] && res1[currYear][currMonth]) {
                        res1[currYear].count += 1;
                        res1[currYear][currMonth].count += 1;
                        if (res1[currYear][currMonth][currDay]) {
                            res1[currYear][currMonth][currDay] += 1;
                        } else {
                            res1[currYear][currMonth] = { ...res1[currYear][currMonth], [currDay]: 1 };
                        }
                    } else {
                        res1[currYear] = { count: 1, [currMonth]: { count: 1, [currDay]: 1 } };
                    }
                    prevMonth = currMonth;
                }
            }
        }
        return {
            count,
            clicks: res1,
            links_added: res2,
            top_three: [
                {
                    url: data?.[0]?.url && (await aesDecryptData(data?.[0]?.url))?.value,
                    short_url: data?.[0]?.alias && process.env.OWN_URL_DEFAULT + (await aesDecryptData(data?.[0]?.alias))?.value,
                    title: data[0]?.meta_data && JSON.parse((await aesDecryptData(data?.[0]?.meta_data))?.value)?.title,
                },
                {
                    url: data?.[1]?.url && (await aesDecryptData(data?.[1]?.url))?.value,
                    short_url: data?.[1]?.alias && process.env.OWN_URL_DEFAULT + (await aesDecryptData(data?.[1]?.alias))?.value,
                    title: data[1]?.meta_data && JSON.parse((await aesDecryptData(data?.[1]?.meta_data))?.value)?.title,
                },
                {
                    url: data?.[2]?.url && (await aesDecryptData(data?.[2]?.url))?.value,
                    short_url: data?.[2]?.alias && process.env.OWN_URL_DEFAULT + (await aesDecryptData(data?.[2]?.alias))?.value,
                    title: data[2]?.meta_data && JSON.parse((await aesDecryptData(data?.[2]?.meta_data))?.value)?.title,
                },
            ],
        };
    } else {
        return {
            count: 0,
            clicks: {},
            links_added: {},
            top_three: [],
        };
    }
};

exports.getMetaDataOfAURL = async (data, timezone) => {
    if (data) {
        const year_month_day_click = {};
        const browser_clicks = {};
        const os_clicks = {};
        const device_clicks = {};
        const country_clicks = {};
        const decrypted_from_visited = [];
        try {
            for (let j = 0; j < data.length; j++) {
                const client_info = data[j]?.client_info && JSON.parse((await aesDecryptData(data[j]?.client_info))?.value);
                const location = data[j]?.location && JSON.parse((await aesDecryptData(data[j]?.location))?.value);
                decrypted_from_visited.push({ ...data[j], client_info, location, ip: (await aesDecryptData(data[j]?.ip))?.value });

                let date = timezone
                    ? moment(data[j].requested_at)
                          .tz(timezone || null)
                          .format("YYYY-MMMM-DD")
                    : moment(data[j].requested_at).format("YYYY-MMMM-DD");
                const [currYear, currMonth, currDay] = date.split("-");
                let client_name = client_info?.client_name;
                let client_OS = client_info?.OS;
                let device_type = client_info?.device_type;
                let country = location?.country;
                let city = location?.city;

                if (year_month_day_click[currYear] && year_month_day_click[currYear][currMonth]) {
                    year_month_day_click[currYear].count += 1;
                    year_month_day_click[currYear][currMonth].count += 1;
                    if (year_month_day_click[currYear][currMonth][currDay]) {
                        year_month_day_click[currYear][currMonth][currDay] += 1;
                    } else {
                        year_month_day_click[currYear][currMonth] = {
                            ...year_month_day_click[currYear][currMonth],
                            [currDay]: 1,
                        };
                    }
                } else {
                    year_month_day_click[currYear] = { count: 1, [currMonth]: { count: 1, [currDay]: 1 } };
                }

                if (client_name) {
                    if (browser_clicks[client_name]) {
                        browser_clicks[client_name].count += 1;
                    } else {
                        browser_clicks[client_name] = { count: 1 };
                    }
                }

                if (client_OS) {
                    if (os_clicks[client_OS]) {
                        os_clicks[client_OS].count += 1;
                    } else {
                        os_clicks[client_OS] = { count: 1 };
                    }
                }

                if (device_type) {
                    if (device_clicks[device_type]) {
                        device_clicks[device_type].count += 1;
                    } else {
                        device_clicks[device_type] = { count: 1 };
                    }
                }

                if (country && city) {
                    if (country_clicks[country] && country_clicks[country][city]) {
                        country_clicks[country].count += 1;
                        country_clicks[country][city].count += 1;
                    } else {
                        country_clicks[country] = { count: 1, [city]: { count: 1 } };
                    }
                }
            }
            return {
                meta: {
                    year_month_day_click,
                    device_clicks,
                    browser_clicks,
                    os_clicks,
                    country_clicks,
                },
                decrypted_from_visited,
            };
        } catch (e) {
            console.log(e);
            return {};
        }
    }
    return {};
};
