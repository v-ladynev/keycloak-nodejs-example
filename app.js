'use strict';

var Keycloak = require('keycloak-connect');

let adminClient = require('./adminClient');

var jwt = require('jsonwebtoken');
const URL = require('url');
const http = require('http');
const https = require('https');

var hogan = require('hogan-express');

var express = require('express');
var morgan = require('morgan');

var session = require('express-session');

var app = express();

// Register '.mustache' extension with The Mustache Express
app.set('view engine', 'html');
app.set('views', require('path').join(__dirname, '/view'));
app.engine('html', hogan);

// for js
app.use(express.static('view'));

app.use(morgan('combined'));


// A normal un-protected public URL.

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/adminClient', function (req, res) {
    res.render('adminClient');
});

app.get('/adminApi', (req, res) => {
    adminClient[req.query.api](result => {
        res.render('adminClient', {
            result: JSON.stringify(result, null, 4)
        });
    });
});

// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.

var memoryStore = new session.MemoryStore();

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

var keycloak = new Keycloak({
    store: memoryStore
});

// Install the Keycloak middleware.
//
// Specifies that the user-accessible application URL to
// logout should be mounted at /logout
//
// Specifies that Keycloak console callbacks should target the
// root URL.  Various permutations, such as /k_logout will ultimately
// be appended to the admin URL.

app.use(keycloak.middleware({
    logout: '/logout',
    admin: '/'
}));

app.get('/login', keycloak.protect(), function (req, res) {
    renderIndex(req, res, 'Go to "Create a customer" link');
});

// TODO better to combine protect() and createPermission() in one middleware
app.get('/createCustomer', keycloak.protect(), createPermission("scopes:customer:create"));
app.get('/createCampaign', keycloak.protect(), createPermission("scopes:campaign:create"));
app.get('/showReport', keycloak.protect(), createPermission("scopes:report:show"));

function createPermission(permissionScope) {
    return function (req, res) {
        var tokens = JSON.parse(req.session['keycloak-token']);

        var permission = {
            scopes: [permissionScope]
        };

        getRptTokenForPermission(tokens, permission, function (rptTokenResult) {
            renderIndex(req, res, rptTokenResult);
        });
    };
}

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});

function renderIndex(req, res, rptToken) {
    var tokens = JSON.parse(req.session['keycloak-token']);
    res.render('index', {
        rptToken: rptToken,
        result: JSON.stringify(tokens, null, 4),
        decodedTokens: decodeTokens(tokens)
    });
}


// TODO this is just an example, probably need to verify a sign of RPT
// TODO or we don't need this, because of connection is performed on the server
function getRptTokenForPermission(tokens, permission, callback) {
    var jsonRequest = {
        permissions: [permission]
    };

    getEntitlement(tokens.access_token, jsonRequest,
        function (rptToken) {
            callback(decodeTokenToStr(rptToken));
        },

        function () {
            callback('access denied');
        },

        function (errorMessage) {
            callback('error: ' + errorMessage);
        }
    );
}

function decodeTokens(tokens) {
    return 'access_token: ' + decodeTokenToStr(tokens.access_token) +
        'id_token: ' + decodeTokenToStr(tokens.id_token);
}

function decodeTokenToStr(token) {
    // TODO jwt.decode() doesn't verify whether the signature is valid
    return JSON.stringify(jwt.decode(token), null, 4);
}

function getEntitlement(accessToken, jsonRequest, onGrant, onDeny, onError) {
    const url = keycloak.config.authServerUrl + '/realms/' + keycloak.config.realm + '/authz/entitlement/' + keycloak.config.clientId;
    const options = URL.parse(url);

    options.headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json'
    };

    if (jsonRequest) {
        options.method = 'POST';
        options.headers['Content-type'] = 'application/json';
    } else {
        options.method = 'GET';
    }


    const req = getProtocol(options).request(options, function (response) {
        if (response.statusCode < 200 || response.statusCode >= 300) {
            if (response.statusCode == 403) {
                return onDeny();
            }

            return onError('Error statusCode:' + response.statusCode);
        }

        let json = '';

        response.on('data', function (d) {
            json += d.toString();
        });

        response.on('end', function () {
            const data = JSON.parse(json);
            onGrant(data.rpt);
        });
    });

    req.on('error', onError);

    if (jsonRequest) {
        req.write(JSON.stringify(jsonRequest))
    }

    req.end();
}

function getProtocol(opts) {
    return opts.protocol === 'https:' ? https : http;
}