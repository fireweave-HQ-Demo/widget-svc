import json

from src.features.telemetry.infrastructure.start_otel import Telemetry


def handle_probe_metrics(telemetry: Telemetry) -> tuple[int, bytes]:
    # @fireweave-controlpoint home-probe-metrics
    try:
        telemetry.increment("feature.home-probe.adopted")
        return 200, (
            json.dumps(
                {
                    "ok": True,
                    "feature": "home-probe-metrics",
                    "emitted": ["feature.home-probe.adopted"],
                }
            )
            + "\n"
        ).encode()
    except Exception as err:
        telemetry.increment("feature.home-probe.error")
        return 500, (json.dumps({"ok": False, "error": str(err)}) + "\n").encode()
