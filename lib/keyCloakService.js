'use strict';

const request = require('request-promise-native');
const Keycloak = require('keycloak-connect');
const jwt = require('jsonwebtoken');
const KeyCloakCookieStore = require('../lib/keyCloakCookieStore');

class KeyCloakService {

    /**
     *
     * @param permissions
     * @param config can be:
     *      undefined (not specified) - the configuration will be loaded from 'keycloak.json'
     *      string - config will be loaded from a file
     *      object - parameters from this object
     */
    constructor(permissions, config) {
        this.permissions = permissions;
        this.keyCloak = KeyCloakService.initKeyCloak(config);
        this.keyCloakProtect = this.keyCloak.protect();
        this.entitlementUrl = KeyCloakService.createEntitlementUrl(this.keyCloak);
    }

    static initKeyCloak(config) {
        let result = new Keycloak(
            {
                cookies: true
            },
            KeyCloakService.createKeyCloakConfig(config)
        );

        // replace CookieStore from keycloak-connect
        result.stores[1] = KeyCloakCookieStore;

        // disable redirection to Keycloak login page
        result.redirectToLogin = () => false;

        // TODO It is not necessary, this function returns 403 by default. Just to having redirect to a page.
        // This function is used in other KeyCloakService methods
        result.accessDenied = (request, response) => response.redirect('/accessDenied.html');
        return result;
    }

    static createKeyCloakConfig(config) {
        if (!config || typeof config === 'string') {
            return null;
        }

        const authServerUrl = `${config.serverUrl}/auth`;
        return {
            realm: config.realm,
            authServerUrl: authServerUrl,
            resource: config.resource,
            credentials: {
                secret: config.secret
            }
        };
    }

    static createEntitlementUrl(keycloak) {
        return `${keycloak.config.realmUrl}/authz/entitlement/${keycloak.config.clientId}`;
    }

    accessDenied(request, response) {
        this.keyCloak.accessDenied(request, response);
    }

    middleware(logoutUrl) {
        // Return the Keycloak middleware.
        //
        // Specifies that the user-accessible application URL to
        // logout should be mounted at /logout
        //
        // Specifies that Keycloak console callbacks should target the
        // root URL.  Various permutations, such as /k_logout will ultimately
        // be appended to the admin URL.
        let result = this.keyCloak.middleware({
            logout: logoutUrl,
            admin: '/'
        });
        result.push(this.createSecurityMiddleware());
        return result;
    }

    loginUser(login, password, request, response) {
        return this.keyCloak.grantManager.obtainDirectly(login, password).then(grant => {
            this.keyCloak.storeGrant(grant, request, response);
            return grant;
        });
    }

    getUserName(request) {
        return this.getAccessToken(request)
            .then(token => Promise.resolve(jwt.decode(token).preferred_username));
    }

    getAllPermissions(request) {
        return this.getAccessToken(request)
            .then(this.getEntitlementsRequest.bind(this))
            .then(KeyCloakService.decodeRptToken);
    }

    static decodeRptToken(rptTokenResponse) {
        const rptToken = JSON.parse(rptTokenResponse).rpt;
        const rpt = jwt.decode(rptToken);
        let permissions = [];
        (rpt.authorization.permissions || []).forEach(p => permissions.push({
            scopes: p.scopes,
            resource: p.resource_set_name
        }));
        return {
            userName: rpt.preferred_username,
            roles: rpt.realm_access.roles,
            permissions: permissions
        };
    }

    /**
     * Protect with checking authentication only.
     *
     * @returns protect middleware
     */
    justProtect() {
        return this.keyCloak.protect();
    }

    protect(resource, scope) {
        return (request, response, next) =>
            this.protectAndCheckPermission(request, response, next, resource, scope);
    }

    checkPermission(request, resource, scope) {
        let scopes = [scope];
        return this.getAccessToken(request)
            .then(accessToken => this.checkEntitlementRequest(resource, scopes, accessToken));
    }

    createSecurityMiddleware() {
        return (req, res, next) => {
            if (this.permissions.isNotProtectedUrl(req)) {
                return next();
            }

            const permission = this.permissions.findPermission(req);
            if (!permission) {
                console.log('Can not find a permission for: %s %s', req.method, req.originalUrl);
                return this.keyCloak.accessDenied(req, res);
            }

            this.protectAndCheckPermission(req, res, next, permission.resource, permission.scope);
        };
    }

    protectAndCheckPermission(request, response, next, resource, scope) {
        this.keyCloakProtect(request, response, () => this.checkPermission(request, resource, scope)
            .then(() => next()).catch(error => {
                console.error('access denied: ' + error.message);
                this.keyCloak.accessDenied(request, response);
            }));
    }

    getEntitlementsRequest(accessToken) {
        let options = {
            url: this.entitlementUrl,
            headers: {
                Accept: 'application/json'
            },
            auth: {
                bearer: accessToken
            },
            method: 'GET'
        };

        return request(options);
    }

    checkEntitlementRequest(resource, scopes, accessToken) {
        let permission = {
            resource_set_name: resource,
            scopes: scopes
        };
        let jsonRequest = {
            permissions: [permission]
        };
        let options = {
            url: this.entitlementUrl,
            headers: {
                Accept: 'application/json'
            },
            auth: {
                bearer: accessToken
            },
            body: jsonRequest,
            method: 'POST',
            json: true
        };

        return request(options);
    }

    getAccessToken(request) {
        let tokens = this.keyCloak.stores[1].get(request);
        let result = tokens && tokens.access_token;
        return result ? Promise.resolve(result) : Promise.reject('There is not token.');
    }

}

module.exports = KeyCloakService;
