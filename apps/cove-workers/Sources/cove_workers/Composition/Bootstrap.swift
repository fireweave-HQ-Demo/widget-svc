import Foundation

#if canImport(Glibc)
import Glibc
#elseif canImport(Darwin)
import Darwin
#endif

enum Bootstrap {
  static func run(service: String, defaultPort: UInt16) -> (
    RuntimeContext, Telemetry, UInt16, IdentityStore
  ) {
    let ctx = EnvRuntime.load(service: service)
    let tel = Telemetry(ctx: ctx)
    let port = EnvRuntime.port(fallback: defaultPort)
    let enabled = ProcessInfo.processInfo.environment["IDENTITY_ENABLED"] == "true"
    let seed =
      ProcessInfo.processInfo.environment["IDENTITY_SEED_PATH"]
      ?? "/data/identity/seed.json"
    let identity = IdentityStore(enabled: enabled, seedPath: seed)
    return (ctx, tel, port, identity)
  }
}
