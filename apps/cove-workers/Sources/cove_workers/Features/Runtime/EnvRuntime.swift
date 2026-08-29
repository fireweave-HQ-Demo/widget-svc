import Foundation

enum EnvRuntime {
  static func load(service: String) -> RuntimeContext {
    RuntimeContext(
      service: service,
      environment: ProcessInfo.processInfo.environment["APP_ENV"] ?? "dev",
      destination: ProcessInfo.processInfo.environment["BENCH_DESTINATION"] ?? "control",
      exporterEndpoint: ProcessInfo.processInfo.environment["OTEL_EXPORTER_OTLP_ENDPOINT"]
        ?? "http://collector:4318"
    )
  }

  static func port(fallback: UInt16) -> UInt16 {
    if let raw = ProcessInfo.processInfo.environment["PORT"], let p = UInt16(raw) {
      return p
    }
    return fallback
  }
}
