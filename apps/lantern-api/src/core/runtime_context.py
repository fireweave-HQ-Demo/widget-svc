from dataclasses import dataclass

@dataclass(frozen=True)
class RuntimeContext:
    service: str
    environment: str
    destination: str
    exporter_endpoint: str
