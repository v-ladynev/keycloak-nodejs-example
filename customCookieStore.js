'use strict';

let CustomCookieStore = {};

CustomCookieStore.TOKEN_KEY = 'keycloak-token';

CustomCookieStore.get = (request) => {

    console.log("getCookie: ");

    let value = request.cookies[CustomCookieStore.TOKEN_KEY];
    if (value) {
        try {
            return JSON.parse(value);
        } catch (err) {
            // ignore
        }
    }
};

let store = (grant) => {
    return (request, response) => {

        console.log("storeCookie: ");
        //request.session[CustomCookieStore.TOKEN_KEY] = grant.__raw;

        let maxAgeMilliseconds = 900000;
        response.cookie(CustomCookieStore.TOKEN_KEY, grant.__raw, {maxAge: maxAgeMilliseconds, httpOnly: true});
    };
};

let unstore = (request, response) => {

    console.log("unstoreCookie: ");

    response.clearCookie(CustomCookieStore.TOKEN_KEY);
};

CustomCookieStore.wrap = (grant) => {
    grant.store = store(grant);
    grant.unstore = unstore;
};

module.exports = CustomCookieStore;
