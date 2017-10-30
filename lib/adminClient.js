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
        .then(
            client => client.realms.find()
        );
};

exports.usersList = function (callback) {
    return adminClient(settings)
        .then(
            client => client.users.find(exampleSettings.realmName)
        );
};

exports.createTestUser = function () {
    return adminClient(settings)
        .then(
            client => createTestUser(client)
                .then(
                    newUser => resetUserPassword(client, newUser)
                        .then(
                            () => newUser
                        )
                )
        );
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
        .then(
            client => exports.findTestUser()
                .then(
                    user => {
                        user.firstName = 'user first name updated';
                        return client.users.update(exampleSettings.realmName, user)
                            .then(
                                () => "user updated"
                            );
                    }
                )
        );
};

exports.setTestUserCustomerId = function () {
    return adminClient(settings)
        .then(
            client => exports.findTestUser()
                .then(
                    user => {
                        user.attributes = user.attributes || {};
                        user.attributes.customerId = 123;
                        return client.users.update(exampleSettings.realmName, user)
                            .then(
                                () => "customerId added"
                            );
                    }
                )
        );
};

exports.removeTestUserCustomerId = function () {
    return adminClient(settings)
        .then(
            client => exports.findTestUser()
                .then(
                    user => {
                        user.attributes = user.attributes || {};
                        user.attributes.customerId = undefined;
                        return client.users.update(exampleSettings.realmName, user).then(() => "customerId removed");
                    }
                )
        );
};

// this is an example how to get user by id
exports.getUserById = function () {
    return adminClient(settings)
        .then(
            client => exports.findTestUser()
                .then(
                    user => client.users.find(exampleSettings.realmName, {userId: user.id})
                )
        );
};

exports.findTestUser = function () {
    return adminClient(settings)
        .then(
            client => client.users.find(exampleSettings.realmName, {username: 'test_user'})
        )
        .then(
            users => {
                let user = users && users[0];
                return user && user.id ? Promise.resolve(user) : Promise.reject("user not found");
            }
        );
};

exports.deleteTestUser = function () {
    return adminClient(settings)
        .then(
            client => exports.findTestUser()
        )
        .then(
            user => exports.deleteUserById(user.id)
        );
};

exports.deleteUserById = function (userId) {
    return adminClient(settings)
        .then(
            client => client.users.remove(exampleSettings.realmName, userId)
        ).then(
            () => "user deleted"
        );
};

// admin client doesn't have these methods

exports.createRole = function () {
    return authenticate()
        .then(
            token => createRole('TEST_ROLE', token)
        )
        .then(
            () => 'role created'
        );
};

function createRole(roleName, token) {
    return keyCloakRequest('POST', `/admin/realms/${exampleSettings.realmName}/roles`, token, {name: roleName});
}

exports.deleteRole = function () {
    return authenticate()
        .then(
            token => deleteRole('TEST_ROLE', token)
        )
        .then(
            () => 'TEST_ROLE role is deleted'
        );
};

function deleteRole(roleName, token) {
    return keyCloakRequest('DELETE', `/admin/realms/${exampleSettings.realmName}/roles/${roleName}`, token);
}

exports.addTestRoleToTestUser = function () {
    return exports.findTestUser()
        .then(
            user => authenticate()
                .then(
                    token => exports.getRoleByName('TEST_ROLE')
                        .then(
                            role => addRole(user.id, role, token)
                        )
                ).then(
                    () => 'TEST_ROLE role is added to the user login=test_user'
                )
        );
};

function addRole(userId, role, token) {
    return keyCloakRequest('POST',
        `/admin/realms/${exampleSettings.realmName}/users/${userId}/role-mappings/realm`,
        token, [role]);
}

exports.removeTestRoleFromTestUser = function () {
    return exports.findTestUser()
        .then(
            user => authenticate()
                .then(
                    token => exports.getRoleByName('TEST_ROLE')

                        .then(
                            role => removeRoleFromUser(user.id, role, token)
                        )
                )
                .then(
                    () => 'TEST_ROLE role is removed from user'
                )
        );
};

function removeRoleFromUser(userId, role, token) {
    return keyCloakRequest('DELETE',
        `/admin/realms/${exampleSettings.realmName}/users/${userId}/role-mappings/realm`,
        token, [role]);
}

exports.getRoleByName = function (roleName) {
    return authenticate()
        .then(
            token => keyCloakRequest('GET', `/admin/realms/${exampleSettings.realmName}/roles/${roleName}`, token, null)
        )
        .then(
            role => role ? Promise.resolve(role) : Promise.reject('role not found')
        );
};

function authenticate() {
    return getToken(settings.baseUrl, settings);
}

function keyCloakRequest(method, url, accessToken, jsonBody) {
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

    return request(options).catch(error => Promise.reject(error.message ? error.message : error));
}