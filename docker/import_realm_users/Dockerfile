FROM jboss/keycloak-mysql:latest

RUN mkdir /opt/jboss/keycloak/campaign

ADD CAMPAIGN_REALM-realm.json /opt/jboss/keycloak/campaign
ADD CAMPAIGN_REALM-users-0.json /opt/jboss/keycloak/campaign

ENTRYPOINT [ "/opt/jboss/docker-entrypoint.sh" ]

CMD ["-b", "0.0.0.0", \
  "-Dkeycloak.migration.action=import", \
  "-Dkeycloak.migration.provider=dir", \
  "-Dkeycloak.migration.strategy=IGNORE_EXISTING", \
  "-Dkeycloak.migration.dir=/opt/jboss/keycloak/campaign"]