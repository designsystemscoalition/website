const https = require("https");

var CREATOR_TOKEN = process.env.CREATOR_TOKEN;
var CAMPAIGN_ID = process.env.CAMPAIGN_ID;

function inline_relationships(response) {
    var members = [];
    for (let member of response.data) {
        for (let inc of response.included) {
            if (inc.type == member.relationships.user.data.type && inc.id == member.relationships.user.data.id) {
                members.push({
                    ...member.attributes,
                    ...inc.attributes
                });
                break;
            }
        }
    }
    return members;
}

async function fetch_members(cursor) {
    response = new Promise((resolve, reject) => {
        if (!CREATOR_TOKEN) {

            resolve({
                members: [
                    {full_name: "Test Patron", thumb_url: "/i/example-images/example-profile.jpg", social_connections: {twitter: null}},
                    {full_name: "Test Patron 2", thumb_url: "/i/example-images/example-profile.jpg", social_connections: {twitter: {url: "https://twitter.com/_designsystems"}}},
                ],
                cursor: null
            });

            return;
        }

        var url = new URL(`https://www.patreon.com/api/oauth2/v2/campaigns/${CAMPAIGN_ID}/members`);
        var params = new URLSearchParams();

        if (cursor) {
            params.set("page[cursor]", cursor);
        }

        params.set("page[count]", 100);

        params.set("include", "user");
        params.set("fields[member]", "full_name,patron_status");
        params.set("fields[user]", "social_connections,thumb_url");
        url.search = params;

        var options = {
            method: "GET",
            headers: {"Authorization": `Bearer ${CREATOR_TOKEN}`}
        };

        var raw = "";

        var req = https.request(
            url,
            options,
            (resp) => {
                resp.on("data", d => {
                    raw += d;
                });

                resp.on("end", () => {
                    var data = JSON.parse(raw);

                    var members = inline_relationships(data);

                    resolve({members: members, cursor: data.meta?.pagination?.cursors?.next});
                });

            }
        )

        req.on("error", e => {
            reject(e);
        });

        req.end();
    });

    return response;
}

module.exports = async function() {
    var members = [];
    var cursor;

    response = await fetch_members();
    members = members.concat(response.members);
    cursor = response.cursor;

    while (cursor) {
        response = fetch_members(response.cursor);
        members.concat(response.members);
        cursor = response.cursor;
    }

    return members;
};
