# keycloak-nodejs-example

This is a simply Node.js REST application with checking permissions. The code with permissions check: https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/app.js

This applications has REST API to work with _customers_, _campaigns_ and _reports_. We will protect all endpoints
based on permissions are configured using Keycloak.

| URL        | Method |    Permission   |   Resource   |     Scope     |                     Roles                    |
|:----------:|:------:|:---------------:|:------------:|:-------------:|:--------------------------------------------:|
| /customers | POST   | customer-create | res:customer | scopes:create | admin                                        |
| /customers | GET    | customer-view   | res:customer | scopes:view   | admin, customer-advertiser, customer-analyst |
| /campaigns | POST   | campaign-create | res:campaign | scopes:create | admin, customer-advertiser                   |
| /campaigns | GET    | campaign-view   | res:campaign | scopes:view   | admin, customer-advertiser, customer-analyst |
| /reports   | POST   | report-create   | res:report   | scopes:create | customer-analyst                             |
| /reports   | GET    | report-view     | res:report   | scopes:view   | admin, customer-advertiser, customer-analyst |

The application will use a combination of _(resource, scope)_ to check a permission. 
We will configure Keycloak to use polices are based on roles. 
But for the application a combination of _(resource, scope)_ is important only.
We can configure Keycloak using something other than roles, without changing the application.

## The Most Useful Features

* Custom login without using Keycloak login page.
* Stateless Node.js server without using a session. Keycloak token is stored using cookies.
* A centralized middleware to check permissions. Routes are not described explicity can't be accessed.
* Configuration without `keycloak.json`. It can be used to having configuration for multiple envirements. For exampe — DEV, QA.
* Examples of using Keycloak REST API to create users, roles and custom attributes. It can be used to work with users list from application UI.

## Keycloak Configuration

### Download Keycloak

Download the last version of Keycloak (this example uses 3.2.1.Final)
http://www.keycloak.org/downloads.html

### Configure Keycloak to use MySQL

Perform this steps to get MySQL configured for Keycloak:
http://www.keycloak.org/docs/latest/server_installation/topics/database/checklist.html

**Important:** There is an error in the documentation — driver should be in the
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
You will need to create a `keycloak` schema in the MySQL database for this example. Also don't forget to remove existing `java:jboss/datasources/KeycloakDS` datasource.
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

### Import Realm, Client and Polices
Realm, Client and Polices configuration can be imported using this file:
[CAMPAIGN_REALM-realm.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-realm.json)

You will need only create users and assign them roles (Basic configuration — item 5, 6)

#### Import via Keycloak UI
You will need to select file to import on the `Add Realm` page.
http://www.keycloak.org/docs/latest/getting_started/topics/first-realm/realm.html

#### Import at server boot time
Export and import is triggered at server boot time and its parameters are passed in via Java system properties. 
http://www.keycloak.org/docs/latest/server_admin/topics/export-import.html

### Basic configuration

1. Run server using standalone.sh (standalone.bat)

2. You should now have the Keycloak server up and running. 
To check that it's working open [http://localhost:8080](http://localhost:8080). 
You will need to create a Keycloak admin user.
Then click on `Admin Console` http://www.keycloak.org/docs/latest/server_admin/topics/admin-console.html

When you define your initial admin account, you are creating an account in the master realm. 
Your initial login to the admin console will also be through the master realm.
http://www.keycloak.org/docs/latest/server_admin/topics/realms/master.html

3. Create a `CAMPAIGN_REALM` realm http://www.keycloak.org/docs/latest/server_admin/topics/realms/create.html

4. Create realm roles: `admin`, `customer-advertiser`, `customer-analyst`
http://www.keycloak.org/docs/latest/server_admin/topics/roles/realm-roles.html<br><br>
*Noitice*: Each client can has their own "client roles", scoped only to the client
http://www.keycloak.org/docs/latest/server_admin/topics/roles/client-roles.html

5. Create users (don't forget to disable `Temporary` password)
http://www.keycloak.org/docs/latest/server_admin/topics/users/create-user.html
  * login: `admin_user`, password: `admin_user`
  * login: `advertiser_user`, password: `advertiser_user`
  * login: `analyst_user`, password: `analyst_user` 

6. Add roles to users: 
* `admin_user` — `admin`
* `advertiser_user` — `customer-advertiser`
* `analyst_user` — `customer-analyst`
http://www.keycloak.org/docs/latest/server_admin/topics/roles/user-role-mappings.html

7. Create a `CAMPAIGN_CLIENT`
http://www.keycloak.org/docs/latest/server_admin/topics/clients/client-oidc.html

  * Client ID:  `CAMPAIGN_CLIENT`
  * Client Protocol: `openid-connect`
  * Access Type:  `Confidential`
  * Standard Flow Enabled: `ON`
  * Implicit Flow Enabled: `OFF`
  * Direct Access Grants Enabled: `ON` **Important**: it should be `ON` for the custom login (to provide login/password via an application login page) 
  * Service Accounts Enabled: `ON` 
  * Authorization Enabled: `ON` **Important**: to add polices
  * Valid Redirect URIs: `http://localhost:3000/*`. Keycloak will use this value to check redirect URL at least for logout.
  It can be just a wildcard `*`.
  * Web Origins: `*`

### Configure permissions

#### Add polices

Using `Authorization -> Policies` add role based polices
http://www.keycloak.org/docs/latest/authorization_services/topics/policy/role-policy.html

| Policy                         | Role                |
|--------------------------------|---------------------|
| Admin                          | admin               |
| Advertiser                     | customer-advertiser |
| Analyst                        | customer-analyst    |
| Admin or Advertiser or Analyst | Aggregated Policy*  |  

Aggregated Policy*
This policy consist of an aggregation of other polices
http://www.keycloak.org/docs/latest/authorization_services/topics/policy/aggregated-policy.html  
  
* Polycy name: `Admin or Advertiser or Analyst`
* Apply Policy: `Admin`, `Advertiser`, `Analyst`
* Decision Strategy: `Affirmative`
 
 #### Add scopes
 
Using `Authorization -> Authorization Scopes` add scopes
  * scopes:create
  * scopes:view  

#### Add resources

Using `Authorization -> Resources` add resourcess. Scopes should be entered in the `Scopes` field for every resource.

| Resource Name | Scopes                     |
|---------------|----------------------------|
| res:campaign  | scopes:create, scopes:view |
| res:customer  | scopes:create, scopes:view |
| res:report    | scopes:create, scopes:view |

#### Add scope-based permissions

Using `Authorization -> Permissions` add scope-based permissions
http://www.keycloak.org/docs/latest/authorization_services/topics/permission/create-scope.html

Set *decision strategy* for every permission 
* Decision Strategy: `Affirmative`

|    Permission   |   Resource   |     Scope     |                     Polices                  |
|:---------------:|:------------:|:-------------:|:--------------------------------------------:|
| customer-create | res:customer | scopes:create | Admin                                        |
| customer-view   | res:customer | scopes:view   | Admin or Advertiser or Analyst               |
| campaign-create | res:campaign | scopes:create | Admin, Advertiser                            |
| campaign-view   | res:campaign | scopes:view   | Admin or Advertiser or Analyst               |
| report-create   | res:report   | scopes:create | Analyst                                      |
| report-view     | res:report   | scopes:view   | Admin or Advertiser or Analyst               |

10. Download `keycloak.json` using `CAMPAIGN_CLIENT -> Installation` :
http://www.keycloak.org/docs/latest/securing_apps/topics/oidc/nodejs-adapter.html

### Download and run application

1. Clone this project https://github.com/v-ladynev/keycloak-nodejs-example.git

2. Replace `keycloak.json` in the [root of this project](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/keycloak.json)
with downloaded `keycloak.json`.

3. Run `npm install` in the project directory to install Node.js libraries

4. `npm start` to run node.js application

5. Login to the application using this URL http://localhost:3000/

## Add custom attribute

1. Add a user attribute `customerId` to the `advanced_user`<br>
http://www.keycloak.org/docs/latest/server_admin/topics/users/attributes.html

2. Create a mapper and add `customerId` to `ID token`<br> 
http://stackoverflow.com/a/32890003/3405171

3. `customerId` value will be in the decoded `ID token`

## Keycloak docker image

### Using official jboss/keycloak-mysql with MySQL on localhost 

Creates a Keycloak `admin` user with password `admin`. 

```shell
sudo docker run --name keycloak_dev \
--network="host" \
-e MYSQL_PORT_3306_TCP_ADDR=localhost -e MYSQL_PORT_3306_TCP_PORT=3306 \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=root -e MYSQL_PASSWORD=root \ 
-e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
jboss/keycloak-mysql 
```

Keycloak will run on `localhost:8080`

### Using ladynev/keycloak-mysql-realm-users with MySQL on localhost

Creates a Keycloak `admin` user with password `admin`. 

```shell
sudo docker run --name keycloak_dev \
--network="host" \
-e MYSQL_PORT_3306_TCP_ADDR=localhost -e MYSQL_PORT_3306_TCP_PORT=3306 \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=root -e MYSQL_PASSWORD=root \
-e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
ladynev/keycloak-mysql-realm-users
```

Keycloak will run on `localhost:8080`

### Using ladynev/keycloak-mysql-realm-users with MySQL docker image 

Creates a Keycloak `admin` user with password `admin`.


 1.  First start a MySQL instance using the MySQL docker image:
 
     ```shell
     sudo docker run --name mysql \
     -e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USER=keycloak -e MYSQL_PASSWORD=keycloak \
     -e MYSQL_ROOT_PASSWORD=root_password \
     -d mysql
     ```
 
 2. Start a Keycloak instance and connect to the MySQL instance:
    
    ```shell
    sudo docker run --name keycloak_dev \
    --link mysql:mysql \
    -p 8080:8080 \
    -e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=keycloak -e MYSQL_PASSWORD=keycloak \
    -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
    ladynev/keycloak-mysql-realm-users
    ```
 
 3. Get IP address of `ladynev/keycloak-mysql-realm-users` container
    
    ```shell
    sudo docker network inspect bridge
    ```
  
 4. Keycloak will run on `ip_address:8080`. For example: http://172.17.0.3:8080
 
 5. To run `keycloak-nodejs-example`, it is need to fix `keycloak.json` with server IP-address.
    Other option is generate`keycloak.json` with Keycloak UI `CAMPAIGN_CLIENT -> Installation`. 


### Build docker image from the root of the project

```shell
sudo docker build -t keycloak-mysql-realm-users ./docker/import_realm_users
```

## Examples of using Admin REST API and Custom Login

### Example of custom login 

Keycloak, by default, uses an own page to login a user. There is an example, how to use an application login page.
`Direct Access Grants` should be enabled in that case (https://github.com/v-ladynev/keycloak-nodejs-example#basic-configuration)
The file [app.js](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/app.js)
 
```javascript 
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

#### What happens with custom login

To perform custom login we need to obtain tokens from Keycloak. We can do this by HTTP request:
```shell
curl -X POST \
  http://localhost:8080/auth/realms/CAMPAIGN_REALM/protocol/openid-connect/token \
  -H 'authorization: Basic Q0FNUEFJR05fQ0xJRU5UOjkzMzc2ZmU4LTBmMWQtNGRiOC04OTk5LTA3ZWU5ODk2Y2YzNQ==' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'client_id=CAMPAIGN_CLIENT&username=admin_user&password=admin_user&grant_type=password'
```

`authorization: Basic Q0FNUEFJR05fQ0xJRU5UOjkzMzc2ZmU4LTBmMWQtNGRiOC04OTk5LTA3ZWU5ODk2Y2YzNQ==`
is computed as
```javascript
'Basic ' + new Buffer(clientId + ':' + secret).toString('base64');
```
where (they can be obtained from `keycloak.json`) 
```
client_id = CAMPAIGN_CLIENT
secret = 93376fe8-0f1d-4db8-8999-07ee9896cf35
```
This is just an example, the secret can be different.

We will have, as a result, a response with `access_token`, `refresh_token` and `id_token` (The response has 3526 bytes length)
```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGQmZaenJUc3pYT1JtNlRuVkIwNVJXblY2T3BuWlliMmFYOGtKRnJfWnBNIn0.eyJqdGkiOiIxYTExZTI0Zi05MDc1LTQyMzQtODEzNi1kM2UwOTY0Njk5ZDkiLCJleHAiOjE1MDY5NDUxNjEsIm5iZiI6MCwiaWF0IjoxNTA2OTQ0ODYxLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvQ0FNUEFJR05fUkVBTE0iLCJhdWQiOiJDQU1QQUlHTl9DTElFTlQiLCJzdWIiOiJiOTQ1ZjhiYi03NGFjLTRiNWQtYTNkOC1iZDE3NmExM2U2ZjEiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJDQU1QQUlHTl9DTElFTlQiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI1ZDYyNzJhZi1mOTJiLTQwNmQtYTkwYi03OTAzMzMyOGU5ZDUiLCJhY3IiOiIxIiwiY2xpZW50X3Nlc3Npb24iOiIxNTk4MGE5ZC01NjkzLTQ3ZWQtYWM1MC1kZGUyYzM0ZmI2OWEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiQURNSU5fUk9MRSIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsInZpZXctcHJvZmlsZSJdfX0sIm5hbWUiOiIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbl91c2VyIn0.nedmYkpnkV2T_sTjqwENYqByoLGmlMEZ_6IVvczjRQJetdbamwBwEAr9Q9NkCUCqbzfnhfGsk_Q8Vplqp6j2hlDrReDDpp2KWeQCH0cLeNvfJE4ofDizq7EQAGe1qSGplc9Vd_XPUdjYr5lDBxLlEuk33JRduGeRUlamPIAEkwqwr_3eJphlbjwKp2oFzCtWGwcg0GSZ9Y1ZDcUr2AM3fFde-XZzssCPp8oIPcd6UpWOGK9AaeWTxRtM6pCnU1r0P3q_YIhplA3phTZNz9lmW01_ukgQezOXXPa58-Co5LdQbd1RHGgy6CUgHVrKPrJ-UzRzgyESdTWTc0K_Bmc9fw",
    "expires_in": 300,
    "refresh_expires_in": 1800,
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGQmZaenJUc3pYT1JtNlRuVkIwNVJXblY2T3BuWlliMmFYOGtKRnJfWnBNIn0.eyJqdGkiOiI5Zjk3MjlmOC0wZDJhLTQ2NGItOWQxMC0wMjQ4ZjBmYjg5MzAiLCJleHAiOjE1MDY5NDY2NjEsIm5iZiI6MCwiaWF0IjoxNTA2OTQ0ODYxLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvQ0FNUEFJR05fUkVBTE0iLCJhdWQiOiJDQU1QQUlHTl9DTElFTlQiLCJzdWIiOiJiOTQ1ZjhiYi03NGFjLTRiNWQtYTNkOC1iZDE3NmExM2U2ZjEiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoiQ0FNUEFJR05fQ0xJRU5UIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiNWQ2MjcyYWYtZjkyYi00MDZkLWE5MGItNzkwMzMzMjhlOWQ1IiwiY2xpZW50X3Nlc3Npb24iOiIxNTk4MGE5ZC01NjkzLTQ3ZWQtYWM1MC1kZGUyYzM0ZmI2OWEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiQURNSU5fUk9MRSIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsInZpZXctcHJvZmlsZSJdfX19.qft22KHgeE2V8nU5ITmoNnkwOqptK3sUatrnafo29zqBeYGg9CcC7nQ7JAT81Uy8ZEDTPrVc83-2XiLESzlCNyxIpPpQJNu2ulgjzNMQMRcgfJ2xD-GXLHMd0GYAi-b_qCsoOxsXHgJXJ-VtwbRAnZKmYxiMEroVG7VTcHSEJ2fIhsp5CtWnaZ4NS-9snT2lVVsWuvljoHoy16rNTG-Mg3cCDv3Kud1l5qIu-SXLKfrBm_rM0RUOf790UAtrxDvojqgtKefaDuMbaTpKG9T-v8jDlR4NQFVNkvzdKQDQ-97zVPvdzF6pZM_2kyqnBtU9EwXXzr8-DIygJg9hPzATng",
    "token_type": "bearer",
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGQmZaenJUc3pYT1JtNlRuVkIwNVJXblY2T3BuWlliMmFYOGtKRnJfWnBNIn0.eyJqdGkiOiI4NjVmNjliZC1jMTBlLTRkMjUtOTgzYS0zNDkzNjQ5NGU3NmEiLCJleHAiOjE1MDY5NDUxNjEsIm5iZiI6MCwiaWF0IjoxNTA2OTQ0ODYxLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvQ0FNUEFJR05fUkVBTE0iLCJhdWQiOiJDQU1QQUlHTl9DTElFTlQiLCJzdWIiOiJiOTQ1ZjhiYi03NGFjLTRiNWQtYTNkOC1iZDE3NmExM2U2ZjEiLCJ0eXAiOiJJRCIsImF6cCI6IkNBTVBBSUdOX0NMSUVOVCIsImF1dGhfdGltZSI6MCwic2Vzc2lvbl9zdGF0ZSI6IjVkNjI3MmFmLWY5MmItNDA2ZC1hOTBiLTc5MDMzMzI4ZTlkNSIsImFjciI6IjEiLCJuYW1lIjoiIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW5fdXNlciJ9.if4EfoYgHSKlixVJP7Xqd_Hh7u5v-kexNuB9ya8QcPx9AKVZSvmIvdspLFN4Ka5BXz7leR77YAWanBbMhE9zmD1PSSYXlT0xmUwCyse-jIQbUbIkn2xonTddkge0mRBIqEvnXFkDnhBPzRvOfmTlK35IR-6EKMsFubT227tJUasK7-annv9vDYSEhJ9sztbu2oP5p5mMOhp_W-vrAFt1CbbhJ3XvfDuTH4yrRtjSYftCOIb_FqU_erEs49zXiXGyXdd3JHrBiWyLELfmKUqE9USf1r9omhW6-NVK-Yrd01xUTf7zfYk9qE0qSm3CwedqgohAyaT1o4ru8PWHUPHB-A",
    "not-before-policy": 0,
    "session_state": "5d6272af-f92b-406d-a90b-79033328e9d5"
}
```
if we decode `access_token` (using https://jwt.io/), we will have (there are roles in the token)

```json
{
  "jti": "1a11e24f-9075-4234-8136-d3e0964699d9",
  "exp": 1506945161,
  "nbf": 0,
  "iat": 1506944861,
  "iss": "http://localhost:8080/auth/realms/CAMPAIGN_REALM",
  "aud": "CAMPAIGN_CLIENT",
  "sub": "b945f8bb-74ac-4b5d-a3d8-bd176a13e6f1",
  "typ": "Bearer",
  "azp": "CAMPAIGN_CLIENT",
  "auth_time": 0,
  "session_state": "5d6272af-f92b-406d-a90b-79033328e9d5",
  "acr": "1",
  "client_session": "15980a9d-5693-47ed-ac50-dde2c34fb69a",
  "allowed-origins": [
    "*"
  ],
  "realm_access": {
    "roles": [
      "ADMIN_ROLE",
      "uma_authorization"
    ]
  },
  "resource_access": {
    "account": {
      "roles": [
        "manage-account",
        "view-profile"
      ]
    }
  },
  "name": "",
  "preferred_username": "admin_user"
}
```
### Examples of Admin REST API 
The file [adminClient.js](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/lib/adminClient.js)

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

[Requesting Entitlements](http://www.keycloak.org/docs/latest/authorization_services/topics/service/entitlement/entitlement-api-aapi.html)

https://stackoverflow.com/questions/42186537/resources-scopes-permissions-and-policies-in-keycloak

## Secure URL

https://stackoverflow.com/questions/12276046/nodejs-express-how-to-secure-a-url

## Links

[Keycloak Admin REST API](http://www.keycloak.org/docs-api/2.5/rest-api/index.html)<br>
[Change Keycloak login page, get security tokens using REST](http://stackoverflow.com/questions/39356300/avoid-keycloak-default-login-page-and-use-project-login-page)<br>
[Obtain access token for user](http://www.keycloak.org/docs/latest/server_development/topics/admin-rest-api.html)

Keycloak uses _JSON web token (JWT)_ as a barier token format. To decode such tokens: https://jwt.io/

