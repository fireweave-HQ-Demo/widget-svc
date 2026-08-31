from fireweave.fw_harness import init_fw_harness
from src.composition.bootstrap import bootstrap
from src.composition.create_app import serve

"""Entrypoint — composition only."""
init_fw_harness()
ctx, telemetry, port, identity = bootstrap("lantern-api", 3000)
serve(ctx, telemetry, port, html=False, identity=identity)
