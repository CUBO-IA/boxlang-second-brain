FROM ortussolutions/boxlang:miniserver-1.18.0

# El instalador de esta imagen no resuelve su enlace simbólico a scripts/helpers.
ENV BOXLANG_INSTALL_HOME=/usr/local/boxlang
WORKDIR /opt/second-brain-dependencies
COPY box.json .
RUN install-bx-module $(jq -r '.dependencies | to_entries[] | "\(.key)@\(.value)"' box.json)
COPY docker/patches/bx-ai-3.5.0-scientific-vectors.sh /tmp/
RUN sh /tmp/bx-ai-3.5.0-scientific-vectors.sh /root/.boxlang/modules/bx-ai \
    && rm /tmp/bx-ai-3.5.0-scientific-vectors.sh

WORKDIR /modules/second-brain
COPY box.json ModuleConfig.bx ./
COPY config/ ./config/
COPY backend/ ./backend/
COPY tests/ ./tests/
COPY backend/ /app/
