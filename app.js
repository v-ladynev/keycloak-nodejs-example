"use strict";

const Express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
let Permissions = require("./lib/permissions");
const KeyCloakService = require("./lib/keyCloakService");

/**
 * URL patterns for permissions. URL patterns documentation https://github.com/snd/url-pattern.
 */

const PERMISSIONS = new Permissions([
    ['/customers', 'post', 'res:customer', 'scopes:create'],
    ['/customers(*)', 'get', 'res:customer', 'scopes:view'],
    ['/campaigns', 'post', 'res:campaign', 'scopes:create'],
    ['/campaigns(*)', 'get', 'res:campaign', 'scopes:view'],
    ['/reports', 'post', 'res:report', 'scopes:create'],
    ['/reports(*)', 'get', 'res:report', 'scopes:view']
]).notProtect('/favicon.ico', // TODO delete this
    '/login(*)', '/permissions', // TODO delete this, now it is protected because of we need an access token
    '/checkPermission', // TODO delete this, now it is protected because of we need an access token
    '/checkCampaignOwnership' // TODO delete
);


let app = Express();
let keyCloak = new KeyCloakService(PERMISSIONS);

configureMiddleware();
configureRoutes();

let server = app.listen(3000, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});

function configureMiddleware() {
    app.use(Express.static(path.join(__dirname, 'static')));

    // for a Keycloak token
    app.use(cookieParser());

    app.use(keyCloak.middleware('/logout'));
}

function configureRoutes() {
    let router = Express.Router();
    app.use('/', router);
    app.use('/api/campaigns', showUrl);
    app.use('/api/customers', showUrl);
    app.use('/api/upload', showUrl);
    app.use('/api/optimizer', showUrl);
    app.use('/api/reports', showUrl);
    app.use('/api/targets', showUrl);

    exampleRoutes();

    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '/static/index.html')));
}

function exampleRoutes() {
    app.use('/login', login);

    //get all permissions
    app.get('/permissions', (req, res) => {
        keyCloak.getAllPermissions(req).then(json => res.json(json)).catch(error => res.end('error ' + error));
    });

    // check a specified permission
    app.get('/checkPermission', (req, res) => {
        tkeyCloak.checkPermission(req, 'res:customer', 'scopes:create')
            .then(() => res.end('permission granted'))
            .catch(error => res.end('error ' + error));
    });
}

function login(req, res) {
    keyCloak.loginUser(req.query.login, req.query.password, req, res).then(grant => {
        // TODO we don't need "grant" here, it can be used to debug
        // console.log(grant.__raw);
        // TODO return status code
        res.redirect('/loginSuccess.html');
    }).catch(error => {
        // TODO put login failed code here (we can return 401 code)
        console.error(error);
        res.end('Login error: ' + error);
    });
}

function showUrl(req, res) {
    res.end('Access ' + req.originalUrl);
}

