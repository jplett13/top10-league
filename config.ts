import { debugSnapshot } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

// Visit /api/debug after deploying to see exactly what Sleeper returns.
export async function GET() {
  if (process.env.MOCK_DATA === "1") return Response.json({ mock: true });
  try {
    return Response.json(await debugSnapshot());
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
