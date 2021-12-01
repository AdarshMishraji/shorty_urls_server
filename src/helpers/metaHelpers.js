const { aesDecryptData } = require("./generalHelpers");

const noMonths = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
};
exports.getMetaData = async (data) => {
    if (data.length) {
        let count = 0;
        const res1 = {};
        const res2 = {};
        for (let i = 0; i < data.length; i++) {
            const month = data[i].created_at.substr(5, 2);
            const year = data[i].created_at.substr(0, 4);
            count += data[i].num_of_visits;
            if (res2[year]) {
                res2[year].count += 1;
                if (res2[year][noMonths[month]]) {
                    res2[year][noMonths[month]].count += 1;
                } else {
                    res2[year][noMonths[month]] = { count: 1 };
                }
            } else {
                res2[year] = { count: 1, [noMonths[month]]: { count: 1 } };
            }
            if (data[i].from_visited) {
                for (let j = 0; j < data[i].from_visited.length; j++) {
                    const currMonth = data[i].from_visited[j].requested_at.substr(5, 2);
                    const currYear = data[i].from_visited[j].requested_at.substr(0, 4);
                    const currDate = data[i].from_visited[j].requested_at.substr(8, 2);
                    if (res1[currYear] && res1[currYear][noMonths[currMonth]]) {
                        res1[currYear].count += 1;
                        res1[currYear][noMonths[currMonth]].count += 1;
                        if (res1[currYear][noMonths[currMonth]][currDate]) {
                            res1[currYear][noMonths[currMonth]][currDate] += 1;
                        } else {
                            res1[currYear][noMonths[currMonth]] = { ...res1[currYear][noMonths[currMonth]], [currDate]: 1 };
                        }
                    } else {
                        res1[currYear] = { count: 1, [noMonths[currMonth]]: { count: 1, [currDate]: 1 } };
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

exports.getMetaDataOfAURL = async (data) => {
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
                let currMonth = data[j].requested_at.substr(5, 2);
                let currYear = data[j].requested_at.substr(0, 4);
                let currDate = data[j].requested_at.substr(8, 2);
                let client_name = client_info?.client_name;
                let client_OS = client_info?.OS;
                let device_type = client_info?.device_type;
                let country = location?.country;
                let city = location?.city;

                if (year_month_day_click[currYear] && year_month_day_click[currYear][noMonths[currMonth]]) {
                    year_month_day_click[currYear].count += 1;
                    year_month_day_click[currYear][noMonths[currMonth]].count += 1;
                    if (year_month_day_click[currYear][noMonths[currMonth]][currDate]) {
                        year_month_day_click[currYear][noMonths[currMonth]][currDate] += 1;
                    } else {
                        year_month_day_click[currYear][noMonths[currMonth]] = {
                            ...year_month_day_click[currYear][noMonths[currMonth]],
                            [currDate]: 1,
                        };
                    }
                } else {
                    year_month_day_click[currYear] = { count: 1, [noMonths[currMonth]]: { count: 1, [currDate]: 1 } };
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
