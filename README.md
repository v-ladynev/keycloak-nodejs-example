# keycloak-nodejs-example

This is a simply Node.js REST application with checking permissions. The code with permissions check: [keycloak-nodejs-example/app.js](app.js)
<br>
Just go to the [Quick Start Section](#quick-start), if you don't want to read.

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
For the application a combination of _(resource, scope)_ is important only.
We can configure Keycloak using something other than roles, without changing the application.

## The Most Useful Features

* Custom login without using Keycloak login page.
* Stateless Node.js server without using a session. Keycloak token is stored using cookies.
* A centralized middleware to check permissions. Routes are not described explicitly can't be accessed.
* Configuration without `keycloak.json`. It can be used to having configuration for multiple environments. For example — DEV, QA.
* Examples of using Keycloak REST API to create users, roles and custom attributes. It can be accessed from the application UI to work with users list.

# Quick Start

1. Docker has to be installed in the system
2. Type in the console in a root of the project directory to run already configured Keycloak (with users, roles and scopes). Keycloak will need time to initialize a database schema and start (about 1 minute).   
```bash
docker-compose up
```
3. Go to the Keycloak administration console [http://localhost:8080/auth/admin/](http://localhost:8080/auth/admin/)
4. Enter credentials (it was specified in the `docker-compose.yml`)
```
Username or email: admin 
Password: admin
```
5. After `Sign in`, `CAMPAIGN_REALM` has to be selected. Go to the `Clients` menu.
![realm](doc/quick_start_01.png)
6. Choose `CAMPAIGN_CLIENT` in the `Clients` list.
![client](doc/quick_start_02.png)
7. Press on the `Installation` tab.
8. Choose `Format Option: Keycloak OIDC JSON` and click `Download` to download `keycloak.json`
![installation](doc/quick_start_03.png)
10. Replace `keycloak-nodejs-example\keycloak.json` in the root of the project with the downloaded `keycloak.json`.
11. Run `npm install` in the project directory to install Node.js libraries
12. Run `npm start` to run node.js application

5. Login to the application using this URL [http://localhost:3000/](http://localhost:3000/)
   <br>
   with any of these credentials:
* login: admin_user, password: admin_user
* login: advertiser_user, password: advertiser_user
* login: analyst_user, password: analyst_user

# Not All information below is correct !!!

## Keycloak Configuration

### Download Keycloak

Download the last version of Keycloak (this example uses 3.2.1.Final)
http://www.keycloak.org/downloads.html

### Configure Keycloak to use MySQL

Perform this steps to get MySQL configured for Keycloak:
https://www.keycloak.org/docs/latest/server_installation/index.html#_rdbms-setup-checklist

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

### Import Users, Realm, Client and Polices
Realm, Client and Polices configuration can be imported using this file:
[CAMPAIGN_REALM-realm.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-realm.json)

Users can be imported from this file:
[CAMPAIGN_REALM-users-0.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-users-0.json)

#### Import via Keycloak UI

You will need to select a file on the `Add Realm` page to import a realm .
https://www.keycloak.org/docs/latest/server_admin/index.html#_create-realm

Users can be imported via `Manage -> Import`

#### Import at server boot time
Export and import is triggered at server boot time and its parameters are passed in via Java system properties. 
https://www.keycloak.org/docs/latest/server_admin/index.html#_export_import

### Basic configuration

1. Run server using standalone.sh (standalone.bat)

2. You should now have the Keycloak server up and running. 
To check that it's working open [http://localhost:8080](http://localhost:8080). 
You will need to create a Keycloak admin user:
click on `Administration Console` [http://localhost:8080/auth/admin/](http://localhost:8080/auth/admin/)

// TODO
When you boot Keycloak for the first time Keycloak creates a pre-defined realm for you. 
This initial realm is the master realm. 
It is the highest level in the hierarchy of realms. 
Admin accounts in this realm have permissions to view and manage any other realm created on the server instance. 
When you define your initial admin account, you create an account in the master realm. 
Your initial login to the admin console will also be via the master realm.
https://www.keycloak.org/docs/latest/server_admin/index.html#the-master-realm

3. Create a `CAMPAIGN_REALM` realm https://www.keycloak.org/docs/latest/server_admin/index.html#_create-realm

4. Create realm roles: `admin`, `customer-advertiser`, `customer-analyst`
https://www.keycloak.org/docs/latest/server_admin/index.html#realm-roles<br><br>
*Noitice*: Each client can have their own "client roles", scoped only to the client
https://www.keycloak.org/docs/latest/server_admin/index.html#client-roles

5. Create users
https://www.keycloak.org/docs/latest/server_admin/index.html#_create-new-user
<br>
 * Click `Add User` button, specify user's login and click `Save` button 
 * After that, to specify a user's password go to the Credentials tab (don't forget to disable `Temporary` password)

Add these users:
  * login: `admin_user`, password: `admin_user`
  * login: `advertiser_user`, password: `advertiser_user`
  * login: `analyst_user`, password: `analyst_user` 

6. Add roles to users: 
* `admin_user` — `admin`
* `advertiser_user` — `customer-advertiser`
* `analyst_user` — `customer-analyst`
<br>
https://www.keycloak.org/docs/latest/server_admin/index.html#user-role-mappings

7. Create an OIDC client `CAMPAIGN_CLIENT`
https://www.keycloak.org/docs/latest/server_admin/index.html#oidc-clients

  * Client ID:  `CAMPAIGN_CLIENT`
  * Client Protocol: `openid-connect`
  * Access Type:  `Confidential`
  * Standard Flow Enabled: `ON`
  * Implicit Flow Enabled: `OFF`
  * Direct Access Grants Enabled: `ON` **Important**: it should be `ON` for the custom login (to provide login/password via this example application login page) 
  * Service Accounts Enabled: `ON` 
  * Authorization Enabled: `ON` **Important**: to add polices
  * Valid Redirect URIs: `http://localhost:3000/*`. Keycloak will use this value to check redirect URL at least for logout.
  It can be just a wildcard `*`.
  * Web Origins: `*`

### Configure permissions

#### Add polices

Using `Authorization -> Policies` add role based polices to the `CAMPAIGN_CLIENT` 
https://www.keycloak.org/docs/latest/authorization_services/index.html#_policy_rbac

| Policy Name                    | Role                |
|--------------------------------|---------------------|
| Admin                          | admin               |
| Advertiser                     | customer-advertiser |
| Analyst                        | customer-analyst    |
| Admin or Advertiser or Analyst | Aggregated Policy*  |  

Aggregated Policy*
This policy consist of an aggregation of other polices
https://www.keycloak.org/docs/latest/authorization_services/index.html#_policy_aggregated  
  
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

Enter `Rsource Name` column value to the `Name` and `Display Name` fields 

#### Add scope-based permissions

Using `Authorization -> Permissions` add *scope-based* permissions
https://www.keycloak.org/docs/latest/authorization_services/index.html#_permission_create_scope

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
https://www.keycloak.org/docs/latest/securing_apps/index.html#_nodejs_adapter

### Download and run application

1. Clone this project https://github.com/v-ladynev/keycloak-nodejs-example.git

2. Replace `keycloak.json` in the [root of this project](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/keycloak.json)
with downloaded `keycloak.json`.

3. Run `npm install` in the project directory to install Node.js libraries

4. `npm start` to run node.js application

5. Login to the application using this URL http://localhost:3000/
<br>
and any of these credentials:
* login: admin_user, password: admin_user
* login: advertiser_user, password: advertiser_user
* login: analyst_user, password: analyst_user

## Add custom attribute

1. Add a user attribute `customerId` to the `advanced_user`<br>
https://www.keycloak.org/docs/latest/server_admin/index.html#user-attributes

2. Create a mapper and add `customerId` to `ID token`<br> 
http://stackoverflow.com/a/32890003/3405171

3. `customerId` value will be in the decoded `ID token`

## Keycloak docker image

### Using official jboss/keycloak-mysql with MySQL on localhost 

You shold have MySQL runing on `localhost` with `KEYCLOAK_DEV` database, and `login=root password=root` 

```shell
sudo docker run --name keycloak_dev \
--network="host" \
-e MYSQL_PORT_3306_TCP_ADDR=localhost -e MYSQL_PORT_3306_TCP_PORT=3306 \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=root -e MYSQL_PASSWORD=root \ 
-e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
jboss/keycloak-mysql 
```
This creates a Keycloak `admin` user with password `admin`. 
Keycloak will run on `localhost:8080`. You will need to add users, roles and permissions manually.

### Using ladynev/keycloak-mysql-realm-users with MySQL on localhost

```shell
sudo docker run --name keycloak_dev \
--network="host" \
-e MYSQL_PORT_3306_TCP_ADDR=localhost -e MYSQL_PORT_3306_TCP_PORT=3306 \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=root -e MYSQL_PASSWORD=root \
-e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
ladynev/keycloak-mysql-realm-users
```
This creates a Keycloak `admin` user with password `admin`. 
Keycloak will run on `localhost:8080`. It will already have predefined users, roles and permissions from this example, because
of `ladynev/keycloak-mysql-realm-users` image imports this data from [json files](https://github.com/v-ladynev/keycloak-nodejs-example/tree/master/docker/import_realm_users) during start up.

### Using ladynev/keycloak-mysql-realm-users with MySQL docker image 

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

This creates a Keycloak `admin` user with password `admin` and imports users, roles, permissions.

 3. Get IP address of `ladynev/keycloak-mysql-realm-users` container
    
    ```shell
    sudo docker network inspect bridge
    ```
  
 4. Keycloak will run on `ip_address:8080`. For example: http://172.17.0.3:8080 (for Windows it looks like http://192.168.99.100:8080)
 
 5. To run `keycloak-nodejs-example`, it is need to fix `keycloak.json` with server IP-address.
    Other option is generate`keycloak.json` with Keycloak UI `CAMPAIGN_CLIENT -> Installation`. 

### Build docker image from the root of the project

```shell
sudo docker build -t keycloak-mysql-realm-users ./docker/import_realm_users
```
After that new image can be tagged
```shell
docker tag keycloak-mysql-realm-users ladynev/keycloak-mysql-realm-users
```
and pushed to the docker
```shell
docker push ladynev/keycloak-mysql-realm-users
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
  -H 'authorization: Basic Q0FNUEFJR05fQ0xJRU5UOjZkOTc5YmU1LWNiODEtNGQ1Yy05ZmM3LTQ1ZDFiMGM3YTc1ZQ==' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'client_id=CAMPAIGN_CLIENT&username=admin_user&password=admin_user&grant_type=password'
```

`authorization: Basic Q0FNUEFJR05fQ0xJRU5UOjZkOTc5YmU1LWNiODEtNGQ1Yy05ZmM3LTQ1ZDFiMGM3YTc1ZQ==`
is computed as
```javascript
'Basic ' + btoa(clientId + ':' + secret);
```
where (they can be obtained from `keycloak.json`) 
```
client_id = CAMPAIGN_CLIENT
secret = 6d979be5-cb81-4d5c-9fc7-45d1b0c7a75e
```
This is just an example, the secret can be different.

We will have, as a result, a response with `access_token`, `refresh_token` and `id_token` (The response has 2447 bytes length)
```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfT3B2Wm5lSkR3T0NqczZSZmFObjdIc0lKZmRhMWxfU0ZkYUo2SU1hV0k0In0.eyJqdGkiOiI0ODM0OWQ5NS03NjNkLTQ5NTQtODNmMy01NGYzOTY0Y2I4NTQiLCJleHAiOjE1MDk0NzYyODAsIm5iZiI6MCwiaWF0IjoxNTA5NDc1OTgwLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvQ0FNUEFJR05fUkVBTE0iLCJhdWQiOiJDQU1QQUlHTl9DTElFTlQiLCJzdWIiOiI1ZGMzMDBjOS04NmM4LTQ5OTUtYjJiOS0zNjhmOTA0OWJhM2YiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJDQU1QQUlHTl9DTElFTlQiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI3OGRhOWJhMi00YmRmLTRlNTYtODE4NC00N2QxYjgxNGEwZGEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImFkbWluIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbl91c2VyIn0.Qa2PXHhRs_JpMPHYYwKVcpb3kfHN8l6QUGCyWkIRhl6eoI6IlWu3FG11NOtuDhKn5DvKHdnpft9nK7W5b87WSHa5lXawm6Dcp4RLfD5WvK7W7yFceFGhvC8vuM8xXOhvWDbhnX1eP_Tanrpqs19nWbTjLQ2E8iFqzxnJ1PQNNDFL2BXQ3Y58jt0uwaebJnjIhU0Mpb0plTPaRbnMBNfsjfCurXXWN6MM0rVFAHEDDrrW0M3kKeVyDuq9PYvcDvedlETOlCx3Ss9DXtZY2u__qGfABk3aNbCuUtkn9xy-HYJLBUTZIpPW0ImBKM4-tM4tEzQLvb9b6P4iWYFsaQR08w",
    "expires_in": 300,
    "refresh_expires_in": 1800,
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfT3B2Wm5lSkR3T0NqczZSZmFObjdIc0lKZmRhMWxfU0ZkYUo2SU1hV0k0In0.eyJqdGkiOiJjMzdhNWFiYi1kZDNlLTQxMGMtOGQxMy1mMWU5NTU0ZjhmNzMiLCJleHAiOjE1MDk0Nzc3ODAsIm5iZiI6MCwiaWF0IjoxNTA5NDc1OTgwLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvQ0FNUEFJR05fUkVBTE0iLCJhdWQiOiJDQU1QQUlHTl9DTElFTlQiLCJzdWIiOiI1ZGMzMDBjOS04NmM4LTQ5OTUtYjJiOS0zNjhmOTA0OWJhM2YiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoiQ0FNUEFJR05fQ0xJRU5UIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiNzhkYTliYTItNGJkZi00ZTU2LTgxODQtNDdkMWI4MTRhMGRhIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImFkbWluIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19fQ.E46pp4oqM9o9Xa0d44YYzZ7fI61kB1KCDYksoXnUIw0Qbv67VoEWcloMKC2Lr6pmPeu6ptjkK6QJKjmoaeiFNcGHE7SoU5RTq0cyKjTFqg4GkTZuK-y0tk2ek-Beq64Zu69HzTfWGT0zSIDfd2l7EiEN8ptSCS-Tugsgmk1Snvrb2nC_1-U87qUFBR_qVryhwRk8Ie_AAwTVRWk5jATu5PPsLsCXqfM5_VVu-lc_qbOJaPeg1Ag2WXhE4lf_3BzVeRlgsxDr2EuzZG56O4Y6QeyV2J-XsZF2C7n3CcNPVXD42-MGB7Jhn5l2onl074JsJqhE6bzKB063jSf_wzyB4Q",
    "token_type": "bearer",
    "not-before-policy": 0,
    "session_state": "78da9ba2-4bdf-4e56-8184-47d1b814a0da"
}
```
if we decode `access_token` (using https://jwt.io/), we will have (there are roles in the token)

```json
{
  "jti": "48349d95-763d-4954-83f3-54f3964cb854",
  "exp": 1509476280,
  "nbf": 0,
  "iat": 1509475980,
  "iss": "http://localhost:8080/auth/realms/CAMPAIGN_REALM",
  "aud": "CAMPAIGN_CLIENT",
  "sub": "5dc300c9-86c8-4995-b2b9-368f9049ba3f",
  "typ": "Bearer",
  "azp": "CAMPAIGN_CLIENT",
  "auth_time": 0,
  "session_state": "78da9ba2-4bdf-4e56-8184-47d1b814a0da",
  "acr": "1",
  "allowed-origins": [
    "*"
  ],
  "realm_access": {
    "roles": [
      "admin",
      "uma_authorization"
    ]
  },
  "resource_access": {
    "account": {
      "roles": [
        "manage-account",
        "manage-account-links",
        "view-profile"
      ]
    }
  },
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

[Obtaining Permissions](https://www.keycloak.org/docs/latest/authorization_services/index.html#_service_obtaining_permissions)
<br>
[Resources, scopes, permissions and policies in keycloak](https://stackoverflow.com/questions/42186537/resources-scopes-permissions-and-policies-in-keycloak)

## Secure URL

https://stackoverflow.com/questions/12276046/nodejs-express-how-to-secure-a-url

## Links

[Keycloak Admin REST API](http://www.keycloak.org/docs-api/2.5/rest-api/index.html)<br>
<br>
[Change Keycloak login page, get security tokens using REST](http://stackoverflow.com/questions/39356300/avoid-keycloak-default-login-page-and-use-project-login-page)
<br>
[Obtain access token for user](https://www.keycloak.org/docs/latest/server_development/index.html#admin-rest-api)
<br>
[Stop using JWT for sessions](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
<br>
[Integrating Keycloak 4 with Spring Boot 2 Microservices](https://github.com/jinnerbichler/blog/tree/master/keycloak_4_spring_boot_2)
<br>
[Video Keycloak intro part 2 - Resources, Permissions, Scope and Policies](https://www.youtube.com/watch?v=3K77Pvv-ouU)
<br>
Keycloak uses _JSON web token (JWT)_ as a bearer token format. To decode such tokens: https://jwt.io/

