enum HealthReport {
  static func json(ctx: RuntimeContext, status: String) -> String {
    "{\"ok\":true,\"service\":\"\(ctx.service)\",\"environment\":\"\(ctx.environment)\",\"destination\":\"\(ctx.destination)\",\"exporter\":{\"endpoint\":\"\(ctx.exporterEndpoint)\",\"status\":\"\(status)\",\"signals\":[\"traces\",\"logs\",\"metrics\"]}}"
  }
}
