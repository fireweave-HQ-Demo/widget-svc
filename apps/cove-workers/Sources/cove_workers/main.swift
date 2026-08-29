/// Entrypoint — composition only.
let (ctx, tel, port, identity) = Bootstrap.run(service: "cove-workers", defaultPort: 3000)
Server.serve(ctx: ctx, tel: tel, port: port, identity: identity)
