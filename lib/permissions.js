'use strict';

const UrlPattern = require('url-pattern');

class Permissions {

    constructor(permissions) {
        this.publicUrls = [];
        this.permissions = [];
        permissions.forEach(permission => {
            let url = new UrlPattern(permission[0]);
            let method = permission[1].toUpperCase();
            let resource = permission[2];
            let scope = permission[3];
            this.permissions.push({
                url: url,
                method: method,
                resource: resource,
                scope: scope
            });
        });
    }

    notProtect(...publicUrls) {
        publicUrls.forEach(url => this.publicUrls.push(new UrlPattern(url)));
        return this;
    }

    findPermission(request) {
        return this.permissions.find(
            p => request.method.toUpperCase() === p.method && p.url.match(request.originalUrl)
        );
    }

    isNotProtectedUrl(request) {
        let url = request.originalUrl;
        let result = this.publicUrls.find(u => u.match(url));
        return result !== undefined;
    }
}

module.exports = Permissions;
