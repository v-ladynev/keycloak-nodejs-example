 #!/bin/bash

docker run --name mysql \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USER=keycloak -e MYSQL_PASSWORD=keycloak \
-e MYSQL_ROOT_PASSWORD=root_password \
-d mysql

sleep 15s

docker run --name keycloak_dev \
--link mysql:mysql \
-p 8080:8080 \
-e MYSQL_DATABASE=KEYCLOAK_DEV -e MYSQL_USERNAME=keycloak -e MYSQL_PASSWORD=keycloak \
-e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin \
ladynev/keycloak-mysql-realm-users