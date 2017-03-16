# keycloak-nodejs-example

A simply step by step Keycloak, MySQL and Node.js integration tutorial.<br>
There is a simply Node.js application with checking permissions.<br>
The code with permissions check: https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/app.js#L75

There are three links are protected by scopes in this example. Each scope is connected to permision. 
Permissions are connected to role-based policies. So each link can be opened only by user with given roles.

| Link            | Scope                    | Roles                                                 |
|-----------------|--------------------------|-------------------------------------------------------|
| /createCustomer | `scopes:customer:create` | `ADMIN_ROLE`       |
| /createCampaign | `scopes:campaign:create` | `ADMIN_ROLE`, `ADVANCED_USER_ROLE`                                          |
| /showReport     | `scopes:report:show`     | `ADMIN_ROLE`, `ADVANCED_USER_ROLE`, `BASIC_USER_ROLE` |

## Download Keycloak

Download the last version of Keycloak (this example uses 2.5.4.Final)
http://www.keycloak.org/downloads.html

## Configure Keycloak to use MySQL

Perform this steps to get MySQL configured for Keycloak:
https://keycloak.gitbooks.io/server-installation-and-configuration/content/topics/database/checklist.html

There is an error in the documentation — driver should be in the
`modules/system/layers/base/com/mysql/driver/main` catalog. 

The last MySQL driver
https://mvnrepository.com/artifact/mysql/mysql-connector-java

##### `module.xml`
```XML
<module xmlns="urn:jboss:module:1.3" name="com.mysql.driver">
 <resources>
  <resource-root path="mysql-connector-java-6.0.5.jar" />
 </resources>
 <dependencies>
  <module name="javax.api"/>
  <module name="javax.transaction.api"/>
 </dependencies>
</module>
```

##### `part of  standalone.xml`
```XML
<datasources>
...
<datasource jndi-name="java:jboss/datasources/KeycloakDS" pool-name="KeycloakDS" enabled="true" use-java-context="true">
<connection-url>jdbc:mysql://localhost:3306/keycloak</connection-url>
    <driver>mysql</driver>
    <pool>
        <max-pool-size>20</max-pool-size>
    </pool>
    <security>
        <user-name>root</user-name>
        <password>root</password>
    </security>
</datasource>
...
</datasources>

<drivers>
...
<driver name="mysql" module="com.mysql.driver">
    <driver-class>com.mysql.jdbc.Driver</driver-class>
</driver>
...
</drivers>
```

To fix time zone error during startup, `connection-url` can be
`jdbc:mysql://localhost:3306/keycloak?serverTimezone=UTC`

Database schema creation takes a long time. 

## Import Realm, Client and Polices
Realm, Client and Polices configuration can be imported using this file:
[CAMPAIGN_REALM-realm.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-realm.json)

https://keycloak.gitbooks.io/getting-started-tutorials/content/topics/first-realm/realm.html

You will need only create users and assign them roles (Basic configuration — item 5, 6)

## Basic configuration

1. Run server using standalone.sh (standalone.bat)

2. You should now have the Keycloak server up and running. 
To check that it's working open [http://localhost:8080](http://localhost:8080). 
You will need to create a Keycloak admin user.
Then click on `Admin Console` https://keycloak.gitbooks.io/documentation/getting_started/topics/first-boot/admin-console.html.

3. Create a `CAMPAIGN_REALM` realm https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/realm.html

4. Create realm roles: `ADMIN_ROLE`, `ADVANCED_USER_ROLE`, `BASIC_USER_ROLE`
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/roles/realm-roles.html<br><br>
*Noitice*: Each client can has their own "client roles", scoped only to the client
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/roles/client-roles.html

5. Create users (don't forget to disable `Temporary` password)
https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/user.html
  * login: `admin_user`, password: `admin_user`
  * login: `advanced_user`, password: `advanced_user`
  * login: `basic_user`, password: `basic_user` 

6. Add roles to users: `admin_user` — `ADMIN`, `advanced_user` — `ADVANCED_USER`, `basic_user` — `BASIC_USER_ROLE`
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/roles/user-role-mappings.html

7. Create a `CAMPAIGN_CLIENT`
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/clients/client-oidc.html

  * Client ID:  `CAMPAIGN_CLIENT`
  * Client Protocol: `openid-connect`
  * Access Type:  `Confidential`
  * Standard Flow Enabled: `ON`
  * Implicit Flow Enabled: `OFF`
  * Direct Access Grants Enabled: `ON` **Important**: it should be `ON` for the custom login 
  * Service Accounts Enabled: `ON` 
  * Authorization Enabled: `ON` **Important**: to add polices
  * Valid Redirect URIs: `http://localhost:3000/*`
  * Web Origins: `*`

## Configure permissions

1. Using `Authorization -> Policies` add role based polices
https://keycloak.gitbooks.io/authorization-services-guide/topics/policy/role-policy.html
  * Any Admin Policy -> `ADMIN_ROLE`
  * Admin Or Advanced User Policy -> `ADMIN_ROLE`, `ADVANCED_USER_ROLE`
  * Admin Or Advanced User Or Basic User Policy -> `ADMIN_ROLE`, `ADVANCED_USER_ROLE`, `BASIC_USER_ROLE`
 
2. Using `Authorization -> Authorization Scopes` add scopes
  * scopes:campaign:create
  * scopes:customer:create
  * scopes:report:show

3. Using `Authorization -> Permissions` add scope-based permissions
https://keycloak.gitbooks.io/authorization-services-guide/topics/permission/create-scope.html
  * Create Campaign Permission -> Scopes: `scopes:campaign:create`, Apply Policy: `Admin Or Advanced User Policy`
  * Create Customer Permission -> Scopes: `scopes:customer:create`, Apply Policy: `Any Admin Policy`
  * Show Report Permission -> Scopes: `scopes:report:show`, Apply Policy: `Admin Or Advanced User Or Basic User Policy`

10. Download `keycloak.json` using `CAMPAIGN_CLIENT -> Installation` :
https://keycloak.gitbooks.io/securing-client-applications-guide/content/topics/oidc/nodejs-adapter.html

## Download and run application

1. Clone this project https://github.com/v-ladynev/keycloak-nodejs-example.git

2. Replace `keycloak.json` in the [root of this project](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/keycloak.json)
with downloaded JSON.

3. Run `npm install` in the project directory to install Node.js libraries

4. `npm start` to run node.js application

5. Login to the application using this URL http://localhost:3000/

## Add custom attribute

1. Add a user attribute `customerId` to the `advanced_user`<br>
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/users/attributes.html

2. Create a mapper and add `customerId` to `ID token`<br> 
http://stackoverflow.com/a/32890003/3405171

3. `customerId` value will be in the decoded `ID token`

## Examples of using Admin REST API and Custom Login

### Example of custom login 
The file [app.js](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/app.js)
 
```Java 
 app.get('/customLoginEnter', function (req, res) {
     let rptToken = null
     keycloak.grantManager.obtainDirectly(req.query.login, req.query.password).then(grant => {
         keycloak.storeGrant(grant, req, res);
         renderIndex(req, res, rptToken);
     }, error => {
         renderIndex(req, res, rptToken, "Error: " + error);
     });
 });
```
 
### Examples of Admin REST API 
The file [adminClient.js](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/adminClient.js)

  * Realms list
  * Users list for `CAMPAIGN_REALM`
  * Create user `test_user` (password: `test_user`)
  * Get user `test_user`
  * Delete user `test_user`
  * Update user `test_user` 
  * Set `test_user` `customerId=123`
  * Remove `test_user` `customerId`
  * Create Role `TEST_ROLE`
  * Add `TEST_ROLE` to `test_user`
  * Remove `TEST_ROLE` from `test_user` 

## Update custom attribute using REST API

Update the user<br>
http://www.keycloak.org/docs-api/2.5/rest-api/index.html#_update_the_user

Using `UserRepresentation`, `attributes` field<br>
http://www.keycloak.org/docs-api/2.5/rest-api/index.html#_userrepresentation

## Check permissions using REST API

[Requesting Entitlements](https://keycloak.gitbooks.io/authorization-services-guide/topics/service/entitlement/entitlement-api-aapi.html)

## Links

[Keycloak Admin REST API](http://www.keycloak.org/docs-api/2.5/rest-api/index.html)<br>
[Change Keycloak login page, get security tokens using REST](http://stackoverflow.com/questions/39356300/avoid-keycloak-default-login-page-and-use-project-login-page)<br>
[Obtain access token for user](https://keycloak.gitbooks.io/server-developer-guide/content/v/2.2/topics/admin-rest-api.html)

Keycloak uses _JSON web token (JWT)_ as a barier token format. To decode such tokens: https://jwt.io/

