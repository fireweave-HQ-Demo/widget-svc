import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Hand-rolled OTLP HTTP JSON exporter (B3-clean — no vendor SDK).
final class Telemetry {
  private(set) var exporterStatus: String = "healthy"
  private let base: String
  private let service: String

  init(ctx: RuntimeContext) {
    var b = ctx.exporterEndpoint
    while b.hasSuffix("/") { b.removeLast() }
    self.base = b
    self.service = ctx.service
  }

  func spanAndLog(name: String) {
    let now = UInt64(Date().timeIntervalSince1970 * 1_000_000_000)
    let traceId = String(format: "%032llx", now % 1_000_000_000_000_000)
    let spanId = String(format: "%016llx", now % 1_000_000_000_000)
    let body =
      "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"\(service)\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"\(traceId)\",\"spanId\":\"\(spanId)\",\"name\":\"\(name)\",\"kind\":1,\"startTimeUnixNano\":\"\(now)\",\"endTimeUnixNano\":\"\(now + 1_000_000)\",\"status\":{\"code\":1}}]}]}]}"
    _ = post(path: "/v1/traces", json: body)
    let log =
      "{\"resourceLogs\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"\(service)\"}}]},\"scopeLogs\":[{\"logRecords\":[{\"timeUnixNano\":\"\(now)\",\"severityNumber\":9,\"body\":{\"stringValue\":\"request\"}}]}]}]}"
    if !post(path: "/v1/logs", json: log) {
      exporterStatus = "degraded"
    }
  }

  func increment(name: String) {
    let now = UInt64(Date().timeIntervalSince1970 * 1_000_000_000)
    let body =
      "{\"resourceMetrics\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"\(service)\"}}]},\"scopeMetrics\":[{\"metrics\":[{\"name\":\"\(name)\",\"sum\":{\"aggregationTemporality\":2,\"isMonotonic\":true,\"dataPoints\":[{\"asInt\":\"1\",\"startTimeUnixNano\":\"\(now)\",\"timeUnixNano\":\"\(now)\"}]}}]}]}]}"
    if !post(path: "/v1/metrics", json: body) {
      exporterStatus = "degraded"
    }
  }

  @discardableResult
  private func post(path: String, json: String) -> Bool {
    guard let url = URL(string: base + path) else { return false }
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = json.data(using: .utf8)
    let sem = DispatchSemaphore(value: 0)
    var ok = false
    URLSession.shared.dataTask(with: req) { _, response, error in
      defer { sem.signal() }
      if error != nil { return }
      if let http = response as? HTTPURLResponse {
        ok = (200..<300).contains(http.statusCode)
      }
    }.resume()
    _ = sem.wait(timeout: .now() + 2)
    return ok
  }
}
