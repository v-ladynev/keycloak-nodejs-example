# keycloak-nodejs-example

A simply step by step Keycloak and Node.js integration tutorial. 

1. Download the last version of Keycloak (used 2.5.4.Final) http://www.keycloak.org/downloads.html

2. Run server using standalone.sh (standalone.bat)

3. You should now have the Keycloak server up and running. 
To check that it's working open [http://localhost:8080/auth](http://localhost:8080/auth). 
You will need to create Admin user. 
Then click on `Admin Console` https://keycloak.gitbooks.io/documentation/getting_started/topics/first-boot/admin-console.html.

4. Create a `demo` realm https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/realm.html

5. Create users: `admin_user`, `advanced_user` (don't forget to disable `Temporary` password) 
https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/user.html

6. Create roles: `ADMIN`, `ADVANCED_USER`, `BASIC_USER`
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/roles/realm-roles.html

7. Add roles to users: `admin_user` — `ADMIN`, `advanced_user` — `ADVANCED_USER` (need to choose every user)
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/roles/user-role-mappings.html

Add role-based policy
https://keycloak.gitbooks.io/authorization-services-guide/topics/policy/role-policy.html 

8. Add a Client: `Client ID = demo` -> `Save button` -> `Client Protocol = openid-connect`, `Access Type = Confidential`,
 `Valid Redirect URIs = http://localhost` (**TODO need investigate**)   

Direct Access Grants Enabled: ON
Service Accounts Enabled: ON
Authorization Enabled: ON
 

https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/clients/client-oidc.html

9. Using `Authorization -> Policies` add role based polices

`createCustomer ADMIN`
`createCampaign ADMIN ADVANCED_USER`
`showReports ADMIN ADVANCED_USER BASIC_USER`
 

https://keycloak.gitbooks.io/authorization-services-guide/topics/policy/role-policy.html


10. Create `keycloak.json` using `Client Authenticator = Client id and secret` (**TODO need investigate**):
https://keycloak.gitbooks.io/server-adminstration-guide/content/topics/clients/oidc/confidential.html

11. Download `keycloak.json` from `Installation`

12. Clone this project https://github.com/v-ladynev/keycloak-nodejs-example.git

13. Copy `keycloak.json` in the root of the project

14. Run `npm install` in the project directory to install Node.js libraries

15. `npm start` to run node.js application

# Links

[Change Keycloak login page, get security tokens using REST]
(http://stackoverflow.com/questions/39356300/avoid-keycloak-default-login-page-and-use-project-login-page)

Keycloak uses _JSON web token (JWT)_ as a barier token format. To decode such tokens: https://jwt.io/

