`use strict`;

let adminClient = require('keycloak-admin-client');

let settings = {
    baseUrl: 'http://127.0.0.1:8080/auth',
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli'
};


let exampleSettings = {
    realmName: 'CAMPAIGN_REALM'
};

exports.realmsList = function (callback) {
    adminClient(settings)
        .then((client) => {
            console.log('client', client);
            client.realms.find()
                .then(callback, error(callback));
        })
        .catch(error(callback));
};

exports.usersList = function (callback) {
    adminClient(settings)
        .then((client) => {
            client.users.find(exampleSettings.realmName)
                .then(callback, error(callback));
        })
        .catch(error(callback));
};

exports.createTestUser = function (callback) {
    adminClient(settings)
        .then((client) => {
            client.users.create(exampleSettings.realmName, {
                username: 'test_user',
                enabled: true,
                credentials: [{type: 'password', value: 'password'}]
            }).then(callback, error(callback));
        })
        .catch(error(callback));
};

exports.findTestUser = function (callback) {
    adminClient(settings)
        .then((client) => {
            client.users.find(exampleSettings.realmName, {username: 'test_user'}).then(callback, error(callback));
        })
        .catch(error(callback));
};

exports.deleteTestUser = function (callback) {
    adminClient(settings)
        .then((client) => {

            exports.findTestUser(users => {
                    if (users && users[0] && users[0].id) {
                        client.users.remove(exampleSettings.realmName, users[0].id)
                            .then(callback.bind(null, "deleted"), error(callback));
                    } else {
                        callback("not found");
                    }
                }, error(callback)
            );

        })
        .catch(error(callback));
};

exports.deleteUserById = function (userId, callback) {
    adminClient(settings)
        .then((client) => {
            client.users.remove(exampleSettings.realmName, userId).then(callback, error(callback));
        }).catch(error(callback));
};

function error(callback) {
    return function (errorObject) {
        callback('Error: ' + JSON.stringify(errorObject, null, 4));
    };
}