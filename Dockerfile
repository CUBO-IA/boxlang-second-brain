FROM ortussolutions/boxlang:cli-1.18.0

# El instalador de esta imagen no resuelve su enlace simbólico a scripts/helpers.
ENV BOXLANG_INSTALL_HOME=/usr/local/boxlang
WORKDIR /opt/second-brain-dependencies
COPY box.json .
RUN install-bx-module $(jq -r '.dependencies | to_entries[] | "\(.key)@\(.value)"' box.json)

WORKDIR /modules/second-brain
CMD ["sleep", "infinity"]
