'use strict';

class KeyCloakCookieStore {

    static get(request) {
        let value = request.cookies[KeyCloakCookieStore.TOKEN_KEY];
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch (err) {
                // ignore
            }
        }
    }

    static wrap(grant) {
        grant.store = KeyCloakCookieStore.store(grant);
        grant.unstore = KeyCloakCookieStore.unstore;
    }

}

KeyCloakCookieStore.TOKEN_KEY = 'keycloak-token';

KeyCloakCookieStore.store = grant => (request, response) => {
        const maxAgeMilliseconds = 900000;
        response.cookie(KeyCloakCookieStore.TOKEN_KEY, grant.__raw, {
            maxAge: maxAgeMilliseconds,
            httpOnly: true
        });
};

KeyCloakCookieStore.unstore = (request, response) => {
    response.clearCookie(KeyCloakCookieStore.TOKEN_KEY);
};

module.exports = KeyCloakCookieStore;
