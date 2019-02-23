FROM node:8
WORKDIR /srv/hub

COPY dep-layer/ ./

# install and configure logrotate to manage
# our node log files
RUN apt-get update \
  && apt-get -y install logrotate \
  && echo '\
/srv/hub/logs/node.log {\n\
  daily\n\
  missingok\n\
  create 0660 root root\n\
  rotate 30\n\
}'\
>> /etc/logrotate.conf

# BUILD_ONLY tells nodegit that it must compile itself, as opposed to
# downloading a prebuilt binary. It's necessary because there is a published
# binary that _appears_ be compatible with our operating system, but isn't
# really due to the libssl version.
RUN BUILD_ONLY=true yarn install \
  && yarn cache clean

COPY code-layer/ ./

# Setup PaperTrail logging, note that the port 41828 is
# a port that has been assigned for Cardstack's account.
# Log file emitters can be managed in PaperTrail's dashboard.
RUN curl -L https://github.com/papertrail/remote_syslog2/releases/download/v0.20/remote-syslog2_0.20_amd64.deb -o remote-syslog2.deb \
  && dpkg -i ./remote-syslog2.deb \
  && apt-get install -f \
  && rm ./remote-syslog2.deb
RUN mkdir -p /srv/hub/logs \
  && echo '\
files: \n\
  - /srv/hub/logs/node.log\n\
destination:\n\
  host: logs3.papertrailapp.com\n\
  port: 41828\n\
  protocol: tls\n\
pid_file: /var/run/remote_syslog.pid'\
> /etc/log_files.yml

CMD remote_syslog --hostname "${TARGET_ENV:-unknown_env}_$(hostname)" && yarn start-hub 2>&1 | tee -a /srv/hub/logs/node.log

HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 CMD curl -f -H "Accept:application/vnd.api+json" http://localhost:3000/api/content-types || exit 1