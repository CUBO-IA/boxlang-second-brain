#!/usr/bin/env python3
"""Check production isolation and development mounts without changing containers."""

import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PORTS = {
    "frontend": ("FRONTEND_PORT", "3000", "3000", "13000"),
    "boxlang": ("BACKEND_PORT", "8080", "8080", "18080"),
    "postgres": ("POSTGRES_PORT", "55433", "5432", "15433"),
}
BINDS = {
    "frontend": {"/app/app", "/tests"},
    "boxlang": {"/modules/second-brain", "/app"},
    "postgres": {"/docker-entrypoint-initdb.d/01-pgvector.sql"},
}


def compose_config(custom_ports=False, *args):
    env = os.environ.copy()
    env.update(
        {
            "POSTGRES_PASSWORD": "compose-ports-test-only",
            "POSTGRES_DB": "compose_ports_test",
            "POSTGRES_USER": "compose_ports_test",
            "APP_ORIGIN": "https://brain.example.test",
            "OPENAI_API_KEY": "",
            "P00_ALLOW_PROVIDER_CALLS": "NO",
        }
    )
    for name, _, _, _ in PORTS.values():
        env.pop(name, None)
    if custom_ports:
        env.update({name: custom for name, _, _, custom in PORTS.values()})
    result = subprocess.run(
        ["docker", "compose", "--env-file", "/dev/null", *args, "config", "--format", "json"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, f"docker compose config failed (exit {result.returncode})"
    return json.loads(result.stdout)


base = compose_config(False, "-f", "compose.yaml")
development = compose_config()
custom_development = compose_config(True)

assert set(base["services"]) == {"frontend", "boxlang", "postgres"}
for service, (_, default_published, target, custom_published) in PORTS.items():
    assert "ports" not in base["services"][service], f"base publishes {service} ports"
    for rendered, expected_port in ((development, default_published), (custom_development, custom_published)):
        actual = rendered["services"][service].get("ports", [])
        assert len(actual) == 1, f"development mapping missing or unexpected for {service}"
        assert actual[0]["host_ip"] == "127.0.0.1"
        assert actual[0]["published"] == expected_port
        assert actual[0]["target"] == int(target)
        assert actual[0]["protocol"] == "tcp"

    base_service = base["services"][service]
    assert all(volume["type"] == "volume" for volume in base_service.get("volumes", [])), f"production requires host files for {service}"
    expected_service = dict(base_service)
    if service == "frontend":
        assert base_service["build"]["target"] == "production"
        expected_service["build"] = {**base_service["build"], "target": "development"}
    for rendered in (development, custom_development):
        dev_service = rendered["services"][service]
        volumes = dev_service.get("volumes", [])
        assert {volume["target"] for volume in volumes if volume["type"] == "bind"} == BINDS[service]
        assert all(volume["read_only"] for volume in volumes if volume["type"] == "bind")
        assert [volume for volume in volumes if volume["type"] == "volume"] == base_service.get("volumes", [])
        for key in set(base_service) | set(dev_service):
            if key not in {"ports", "volumes"}:
                assert expected_service.get(key) == dev_service.get(key), f"{service}.{key} changed in override"

assert base["services"]["frontend"]["expose"] == ["3000"]
assert base["services"]["boxlang"]["expose"] == ["8080"]
assert base["services"]["postgres"]["expose"] == ["5432"]
assert base["services"]["frontend"]["environment"]["BOXLANG_URL"] == "http://boxlang:8080"
assert base["services"]["boxlang"]["environment"]["POSTGRES_HOST"] == "postgres"
assert base["services"]["frontend"]["healthcheck"]
assert base["services"]["boxlang"]["healthcheck"]
assert base["services"]["postgres"]["healthcheck"]
assert any(volume.get("source") == "originals_data" for volume in base["services"]["boxlang"]["volumes"])
assert any(volume.get("source") == "postgres_data" for volume in base["services"]["postgres"]["volumes"])

with_worker = compose_config(False, "--profile", "ai")
worker = with_worker["services"]["worker"]
assert worker["profiles"] == ["ai"]
assert worker["command"] == ["boxlang", "backend/library-worker.bxs"]
assert worker["restart"] == "unless-stopped"
assert worker["healthcheck"]["disable"] is True
assert "ports" not in worker
assert worker["volumes"] == with_worker["services"]["boxlang"]["volumes"]
assert worker["environment"]["P00_ALLOW_PROVIDER_CALLS"] == "NO"
assert worker["environment"]["P03_WORKER_CONTINUOUS"] == "YES"

production_worker = compose_config(False, "-f", "compose.yaml", "--profile", "ai")["services"]["worker"]
assert production_worker["volumes"] == base["services"]["boxlang"]["volumes"]
assert all(volume["type"] == "volume" for volume in production_worker["volumes"])

print("PASS: production requires no repository bind mounts or published host ports, including the worker.")
print("PASS: development keeps read-only source mounts, loopback ports, internal URLs, healthchecks, and persistent volumes.")
print("PASS: frontend uses the production image target in deployment and the development target only in the local override.")
