import { applyRobokassaResult } from "@/lib/robokassa";

async function paramsFromRequest(request: Request) {
  if (request.method === "POST") {
    const form = await request.formData();
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") params.append(key, value);
    }
    return params;
  }
  return new URL(request.url).searchParams;
}

async function handle(request: Request) {
  try {
    const result = await applyRobokassaResult(await paramsFromRequest(request));
    if (!result.accepted) return new Response("bad signature", { status: 400 });
    return new Response(`OK${result.invoiceId}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    console.error("[robokassa] ResultURL error", error);
    return new Response("temporary error", { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
