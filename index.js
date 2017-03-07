/*
var Keycloak = require('keycloak-connect');

var keycloak = new Keycloak({});
 */


var Keycloak = require('keycloak-connect');
var hogan = require('hogan-express');

var express = require('express');
var morgan = require('morgan');

var session = require('express-session');
var atob = require('atob');

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
    renderIndex(req, res);
});

app.get('/createCustomer/', keycloak.protect(), function (req, res) {
    renderIndex(req, res);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});

function renderIndex(req, res) {
    var tokens = JSON.parse(req.session['keycloak-token']);
    res.render('index', {
        result: JSON.stringify(tokens, null, 4),
        event: '1. Authentication\n2. Login',
        decodedTokens: decodeTokens(tokens)
    });
}

function decodeTokens(tokens) {
    var result = "access_token: " + decodeTokenToStr(tokens.access_token) +
        "id_token: " + decodeTokenToStr(tokens.id_token);
    return result;
}

function decodeTokenToStr(token) {
    return JSON.stringify(decodeToken(token), null, 4);
}

function decodeToken(str) {
    str = str.split('.')[1];

    str = str.replace('/-/g', '+');
    str = str.replace('/_/g', '/');
    switch (str.length % 4) {
        case 0:
            break;
        case 2:
            str += '==';
            break;
        case 3:
            str += '=';
            break;
        default:
            throw 'Invalid token';
    }

    str = (str + '===').slice(0, str.length + (str.length % 4));
    str = str.replace(/-/g, '+').replace(/_/g, '/');

    str = decodeURIComponent(escape(atob(str)));

    str = JSON.parse(str);
    return str;
}
