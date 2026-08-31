"""Load the pip ``fireweave`` distribution without the local harness shadowing it."""

from __future__ import annotations

import importlib
import sys
from pathlib import Path
from types import ModuleType

_SDK: ModuleType | None = None


def _load_sdk() -> ModuleType:
    global _SDK
    if _SDK is not None:
        return _SDK

    app_dir = Path(__file__).resolve().parent.parent
    saved_path = sys.path[:]
    saved_modules = {
        name: sys.modules.pop(name)
        for name in list(sys.modules)
        if name == "fireweave" or name.startswith("fireweave.")
    }

    sys.path = [entry for entry in sys.path if Path(entry).resolve() != app_dir.resolve()]

    try:
        _SDK = importlib.import_module("fireweave")
        return _SDK
    finally:
        sys.path = saved_path
        sys.modules.update(saved_modules)


_sdk = _load_sdk()

EvaluationContext = _sdk.EvaluationContext
EvaluationOptions = getattr(_sdk, "EvaluationOptions", None)
FireweaveClient = _sdk.FireweaveClient
RegisterTargetOptions = _sdk.RegisterTargetOptions
RegisterTargetResult = getattr(_sdk, "RegisterTargetResult", None)
init_fireweave = _sdk.init_fireweave
