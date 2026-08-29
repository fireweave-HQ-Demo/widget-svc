import Foundation

struct BenchUser {
  let id: String
  let email: String
  let name: String
  let org: String
  let plan: String
  let country: String
}

final class IdentityStore {
  let enabled: Bool
  private let users: [BenchUser]
  private let byId: [String: BenchUser]
  private var sessions: [String: String] = [:]
  private let lock = NSLock()

  init(enabled: Bool, seedPath: String) {
    self.enabled = enabled
    let loaded = enabled ? IdentityStore.loadUsers(seedPath: seedPath) : []
    self.users = loaded
    var map: [String: BenchUser] = [:]
    for u in loaded { map[u.id] = u }
    self.byId = map
  }

  func listUsers(limit: Int) -> [BenchUser] {
    let n = max(1, limit)
    return Array(users.prefix(n))
  }

  func login(userId: String) -> (token: String, user: BenchUser)? {
    guard let user = byId[userId] else { return nil }
    let token = UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
    lock.lock()
    sessions[token] = user.id
    lock.unlock()
    return (token, user)
  }

  func session(token: String) -> BenchUser? {
    guard !token.isEmpty else { return nil }
    lock.lock()
    let userId = sessions[token]
    lock.unlock()
    guard let userId else { return nil }
    return byId[userId]
  }

  private static func loadUsers(seedPath: String) -> [BenchUser] {
    guard let raw = try? String(contentsOfFile: seedPath, encoding: .utf8) else { return [] }
    guard let start = raw.firstIndex(of: "["), let end = raw.lastIndex(of: "]"), start < end else {
      return []
    }
    let array = String(raw[start...end])
    var out: [BenchUser] = []
    var depth = 0
    var objStart: String.Index?
    var i = array.startIndex
    while i < array.endIndex {
      let c = array[i]
      if c == "{" {
        if depth == 0 { objStart = i }
        depth += 1
      } else if c == "}" {
        depth -= 1
        if depth == 0, let s = objStart {
          let obj = String(array[s...i])
          if let user = parseUser(obj) { out.append(user) }
          objStart = nil
        }
      }
      i = array.index(after: i)
    }
    return out
  }

  private static func parseUser(_ obj: String) -> BenchUser? {
    guard let id = field(obj, "id") else { return nil }
    return BenchUser(
      id: id,
      email: field(obj, "email") ?? "",
      name: field(obj, "name") ?? "",
      org: field(obj, "org") ?? "",
      plan: field(obj, "plan") ?? "free",
      country: field(obj, "country") ?? ""
    )
  }

  private static func field(_ obj: String, _ key: String) -> String? {
    let needle = "\"\(key)\""
    guard let range = obj.range(of: needle) else { return nil }
    let afterKey = obj[range.upperBound...]
    guard let colon = afterKey.firstIndex(of: ":") else { return nil }
    var rest = afterKey[afterKey.index(after: colon)...].drop(while: { $0 == " " || $0 == "\t" })
    guard rest.first == "\"" else { return nil }
    rest = rest.dropFirst()
    guard let end = rest.firstIndex(of: "\"") else { return nil }
    return String(rest[..<end])
  }
}

enum AuthHandlers {
  static func config(_ store: IdentityStore) -> (Int, String) {
    (200, "{\"enabled\":\(store.enabled)}\n")
  }

  static func users(_ store: IdentityStore, query: String) -> (Int, String) {
    guard store.enabled else { return (404, "{\"error\":\"identity disabled\"}\n") }
    let limit = parseLimit(query) ?? 50
    let items = store.listUsers(limit: limit).map(userJson).joined(separator: ",")
    return (200, "{\"users\":[\(items)]}\n")
  }

  static func session(
    _ store: IdentityStore,
    method: String,
    authHeader: String?,
    body: String
  ) -> (Int, String) {
    guard store.enabled else { return (404, "{\"error\":\"identity disabled\"}\n") }
    switch method {
    case "GET":
      let token = bearer(authHeader)
      guard let user = store.session(token: token) else {
        return (401, "{\"error\":\"no session\"}\n")
      }
      return (200, "{\"user\":\(userJson(user))}\n")
    case "POST":
      let userId = extractUserId(body)
      guard !userId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        return (400, "{\"error\":\"userId required\"}\n")
      }
      guard let logged = store.login(userId: userId.trimmingCharacters(in: .whitespacesAndNewlines))
      else {
        return (404, "{\"error\":\"unknown user\"}\n")
      }
      return (
        200,
        "{\"sessionToken\":\"\(logged.token)\",\"user\":\(userJson(logged.user))}\n"
      )
    case "DELETE":
      return (200, "{\"ok\":true}\n")
    default:
      return (405, "{\"error\":\"method not allowed\"}\n")
    }
  }

  private static func userJson(_ u: BenchUser) -> String {
    "{\"id\":\"\(u.id)\",\"email\":\"\(u.email)\",\"name\":\"\(u.name)\",\"org\":\"\(u.org)\",\"plan\":\"\(u.plan)\",\"country\":\"\(u.country)\"}"
  }

  private static func bearer(_ header: String?) -> String {
    guard let h = header, h.count >= 7, h.prefix(7).lowercased() == "bearer " else {
      return ""
    }
    return String(h.dropFirst(7)).trimmingCharacters(in: .whitespaces)
  }

  private static func extractUserId(_ body: String) -> String {
    guard let range = body.range(of: "\"userId\"") else { return "" }
    let rest = body[range.upperBound...]
    guard let colon = rest.firstIndex(of: ":") else { return "" }
    var after = rest[rest.index(after: colon)...].drop(while: { $0 == " " })
    guard after.first == "\"" else { return "" }
    after = after.dropFirst()
    guard let end = after.firstIndex(of: "\"") else { return "" }
    return String(after[..<end])
  }

  private static func parseLimit(_ query: String) -> Int? {
    for part in query.split(separator: "&") {
      let kv = part.split(separator: "=", maxSplits: 1)
      if kv.count == 2, kv[0] == "limit" { return Int(kv[1]) }
    }
    return nil
  }
}
