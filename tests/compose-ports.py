#!/usr/bin/env python3
"""Check host-port separation without starting or changing any containers."""

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
    for rendered in (development, custom_development):
        dev_service = rendered["services"][service]
        for key in set(base_service) | set(dev_service):
            if key != "ports":
                assert base_service.get(key) == dev_service.get(key), f"{service}.{key} changed in override"

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

print("PASS: base compose has no published ports; default override publishes only the three loopback mappings.")
print("PASS: internal URLs, healthchecks, storage, and other service configuration are unchanged.")
