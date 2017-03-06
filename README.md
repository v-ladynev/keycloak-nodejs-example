# keycloak-nodejs-example

A simply step by step Keycloak and Node.js integration tutorial. 

1. Download the last version of Keycloak (used 2.5.4.Final) http://www.keycloak.org/downloads.html
2. Run server using standalone.sh (standalone.bat)
3. You should now have the Keycloak server up and running. To check that it's working open [http://localhost:8080/auth](http://localhost:8080/auth). You will need to create Admin user. Then click on `Admin Console` https://keycloak.gitbooks.io/documentation/getting_started/topics/first-boot/admin-console.html.
4. Create a `demo` realm https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/realm.html
5. Create users: `admin_user`, `advanced_user` (don't forget to disable `Temporary` password) 
https://keycloak.gitbooks.io/documentation/getting_started/topics/first-realm/user.html
