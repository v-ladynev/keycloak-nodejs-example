`use strict`;

const adminClient = require('keycloak-admin-client');
const getToken = require('keycloak-request-token');
const request = require('request-promise-native');

// TODO get settings
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
    return adminClient(settings)
        .then(client => client.realms.find());
};

exports.usersList = function (callback) {
    return adminClient(settings)
        .then(client => client.users.find(exampleSettings.realmName));
};

exports.createTestUser = function () {
    return adminClient(settings).then(client => {
        return createTestUser(client)
            .then(newUser => resetUserPassword(client, newUser).then(() => newUser));
    });
};

function createTestUser(client) {
    return client.users.create(exampleSettings.realmName, {
        username: 'test_user',
        firstName: 'user first name',
        enabled: true
    });
}

function resetUserPassword(client, user) {
    // set password "test_user" for a user
    return client.users.resetPassword(
        exampleSettings.realmName, user.id,
        {
            type: 'password',
            value: 'test_user'
        }
    );
}

exports.updateTestUser = function () {
    return adminClient(settings)
        .then(client => {
            return exports.findTestUser().then(users => {
                    let user = users && users[0];
                    if (user) {
                        user.firstName = 'user first name updated';
                        return client.users.update(exampleSettings.realmName, user)
                            .then(() => "updated");
                    } else {
                        return "not found";
                    }
                }
            );

        });
};

exports.setTestUserCustomerId = function () {
    return adminClient(settings)
        .then(client => {
            return exports.findTestUser(users => {
                    let user = users && users[0];
                    if (user) {
                        user.attributes = user.attributes || {};
                        user.attributes.customerId = 123;
                        return client.users.update(exampleSettings.realmName, user)
                            .then(() => "updated");
                    } else {
                        return "not found";
                    }
                }
            );

        });
};

exports.removeTestUserCustomerId = function () {
    return adminClient(settings)
        .then(client => {
            return exports.findTestUser(users => {
                    let user = users && users[0];
                    if (user) {
                        user.attributes = user.attributes || {};
                        user.attributes.customerId = undefined;
                        return client.users.update(exampleSettings.realmName, user)
                            .then(callback.bind(null, "updated"), error(callback));
                    } else {
                        return "not found";
                    }
                }
            );

        });
};

// this is an example how to get user by id
exports.getTestUser = function () {
    return adminClient(settings)
        .then(client => exports.findTestUser()
            .then(user => client.users.find(exampleSettings.realmName, {userId: user.id}))
        );
};

exports.findTestUser = function () {
    return adminClient(settings)
        .then(client => client.users.find(exampleSettings.realmName, {username: 'test_user'}))
        .then(users => {
            let user = users && users[0];
            return user && user.id ? Promise.resolve(user) : Promise.reject("not found");
        });
};

exports.deleteTestUser = function () {
    return adminClient(settings)
        .then(client => {
            return exports.findTestUser().then(users => {
                    if (users && users[0] && users[0].id) {
                        return client.users.remove(exampleSettings.realmName, users[0].id)
                            .then(() => "deleted");
                    } else {
                        return "not found";
                    }
                }
            );
        });
};

exports.deleteUserById = function (userId) {
    return adminClient(settings)
        .then(client => client.users.remove(exampleSettings.realmName, userId));
};

// admin client doesn't have these methods

exports.createRole = function (callback) {
    authenticate(token => {
        keyCloakRequest('POST', `/admin/realms/${exampleSettings.realmName}/roles`, token, {name: 'TEST_ROLE'})
            .then(callback.bind(null, 'created'), error(callback))
            .catch(error(callback));
    });
};

exports.addTestRoleToTestUser = function (callback) {
    exports.findTestUser(users => {
            let user = users && users[0];
            if (user) {

                authenticate(token => {
                    exports.getRoleByName('TEST_ROLE', role => {

                        keyCloakRequest('POST',
                            `/admin/realms/${exampleSettings.realmName}/users/${user.id}/role-mappings/realm`,
                            token, [role])
                            .then(callback.bind(null, 'added'), error(callback))
                            .catch(error(callback));
                    });

                });

            } else {
                callback("not found");
            }
        }, error(callback)
    );
};

exports.removeTestRoleFromTestUser = function (callback) {
    exports.findTestUser(users => {
            let user = users && users[0];
            if (user) {

                authenticate(token => {
                    exports.getRoleByName('TEST_ROLE', role => {

                        keyCloakRequest('DELETE',
                            `/admin/realms/${exampleSettings.realmName}/users/${user.id}/role-mappings/realm`,
                            token, [role])
                            .then(callback.bind(null, 'deleted'), error(callback))
                            .catch(error(callback));
                    });

                });

            } else {
                callback("not found");
            }
        }, error(callback)
    );
};

exports.getRoleByName = function (roleName, callback) {
    authenticate(token => {
        keyCloakRequest('GET',
            `/admin/realms/${exampleSettings.realmName}/roles/${roleName}`,
            token, null)
            .then(callback, error(callback))
            .catch(error(callback));
    });
};

function authenticate() {
    return getToken(settings.baseUrl, settings);
}

function keyCloakRequest(method, url, accessToken, jsonBody) {
    return new Promise((resolve, reject) => {
        let options = {
            url: settings.baseUrl + url,
            auth: {
                bearer: accessToken
            },
            method: method,
            json: true
        };

        if (jsonBody !== null) {
            options.body = jsonBody;
        }

        request(options).then(resolve).catch(error => {
            console.log("error: " + error.message);
            reject(error.message);
        });
    });
}

function error(callback) {
    return function (errorObject) {
        callback('Error: ' + JSON.stringify(errorObject, null, 4));
    };

}