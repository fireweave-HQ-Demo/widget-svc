from src.core.runtime_context import RuntimeContext

def home_body(ctx: RuntimeContext, html: bool) -> str:
    if html:
        return (
            f"<!doctype html><html><body><h1>{ctx.service}</h1>"
            f"<p>env={ctx.environment}</p></body></html>"
        )
    return ctx.service + "\n"
