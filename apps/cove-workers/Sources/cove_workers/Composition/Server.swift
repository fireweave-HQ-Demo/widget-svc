import Foundation

#if canImport(Glibc)
import Glibc
#elseif canImport(Darwin)
import Darwin
#endif

private let corsMethods = "GET, POST, PUT, DELETE, OPTIONS"
private let corsHeaders = "content-type, authorization"

enum Server {
  static func serve(
    ctx: RuntimeContext,
    tel: Telemetry,
    port: UInt16,
    identity: IdentityStore
  ) {
    let fd = socket(AF_INET, sockStreamType, 0)
    precondition(fd >= 0, "socket failed")
    var yes: Int32 = 1
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, socklen_t(MemoryLayout.size(ofValue: yes)))

    var addr = sockaddr_in()
    memset(&addr, 0, MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = port.bigEndian
    addr.sin_addr.s_addr = INADDR_ANY

    let bindOk = withUnsafePointer(to: &addr) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }
    precondition(bindOk == 0, "bind failed on :\(port)")
    #if canImport(Glibc)
    precondition(Glibc.listen(fd, 64) == 0, "listen failed")
    #else
    precondition(Darwin.listen(fd, 64) == 0, "listen failed")
    #endif

    print("\(ctx.service) listening on :\(port) APP_ENV=\(ctx.environment)")

    while true {
      var clientAddr = sockaddr_in()
      var len = socklen_t(MemoryLayout<sockaddr_in>.size)
      let client = withUnsafeMutablePointer(to: &clientAddr) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
          accept(fd, $0, &len)
        }
      }
      guard client >= 0 else { continue }
      defer { close(client) }

      var buf = [UInt8](repeating: 0, count: 8192)
      let n = recv(client, &buf, buf.count, 0)
      guard n > 0 else { continue }
      let raw = String(bytes: buf[0..<Int(n)], encoding: .utf8) ?? ""
      let req = parseRequest(raw)
      let (status, ctype, body) = route(ctx: ctx, tel: tel, identity: identity, req: req)
      let resp =
        "HTTP/1.1 \(status)\r\nContent-Type: \(ctype)\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: \(corsMethods)\r\nAccess-Control-Allow-Headers: \(corsHeaders)\r\nContent-Length: \(body.utf8.count)\r\nConnection: close\r\n\r\n\(body)"
      resp.withCString { ptr in
        _ = send(client, ptr, strlen(ptr), 0)
      }
    }
  }
}

#if canImport(Glibc)
private let sockStreamType = Int32(SOCK_STREAM.rawValue)
#else
private let sockStreamType = SOCK_STREAM
#endif

private struct HttpRequest {
  var method: String
  var path: String
  var query: String
  var headers: [String: String]
  var body: String
}

private func route(
  ctx: RuntimeContext,
  tel: Telemetry,
  identity: IdentityStore,
  req: HttpRequest
) -> (String, String, String) {
  if req.method == "OPTIONS" {
    return ("204 No Content", "text/plain", "")
  }
  switch (req.method, req.path) {
  case ("GET", "/health"):
    tel.spanAndLog(name: "GET /health")
    return ("200 OK", "application/json", HealthReport.json(ctx: ctx, status: tel.exporterStatus))
  case ("GET", "/auth/config"):
    tel.spanAndLog(name: "GET /auth/config")
    let (code, body) = AuthHandlers.config(identity)
    return (statusLine(code), "application/json", body)
  case ("GET", "/auth/users"):
    tel.spanAndLog(name: "GET /auth/users")
    let (code, body) = AuthHandlers.users(identity, query: req.query)
    return (statusLine(code), "application/json", body)
  case ("GET", "/auth/session"), ("POST", "/auth/session"), ("DELETE", "/auth/session"):
    tel.spanAndLog(name: "\(req.method) /auth/session")
    let (code, body) = AuthHandlers.session(
      identity,
      method: req.method,
      authHeader: req.headers["authorization"],
      body: req.body
    )
    return (statusLine(code), "application/json", body)
  case ("GET", "/"):
    tel.spanAndLog(name: "GET /")
    return ("200 OK", "text/plain", Home.body(ctx: ctx))
  default:
    return ("404 Not Found", "text/plain", "")
  }
}

private func statusLine(_ code: Int) -> String {
  switch code {
  case 200: return "200 OK"
  case 204: return "204 No Content"
  case 400: return "400 Bad Request"
  case 401: return "401 Unauthorized"
  case 404: return "404 Not Found"
  case 405: return "405 Method Not Allowed"
  default: return "500 Internal Server Error"
  }
}

private func parseRequest(_ raw: String) -> HttpRequest {
  let lines = raw.split(separator: "\r\n", omittingEmptySubsequences: false).map(String.init)
  let parts = (lines.first ?? "").split(separator: " ")
  let method = parts.count > 0 ? String(parts[0]) : "GET"
  let target = parts.count > 1 ? String(parts[1]) : "/"
  let pathQuery = target.split(separator: "?", maxSplits: 1).map(String.init)
  let path = pathQuery.first ?? "/"
  let query = pathQuery.count > 1 ? pathQuery[1] : ""
  var headers: [String: String] = [:]
  var i = 1
  while i < lines.count {
    let line = lines[i]
    if line.isEmpty { i += 1; break }
    if let colon = line.firstIndex(of: ":") {
      let k = String(line[..<colon]).trimmingCharacters(in: .whitespaces).lowercased()
      let v = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
      headers[k] = v
    }
    i += 1
  }
  let body = i < lines.count ? lines[i...].joined(separator: "\r\n") : ""
  return HttpRequest(method: method, path: path, query: query, headers: headers, body: body)
}
