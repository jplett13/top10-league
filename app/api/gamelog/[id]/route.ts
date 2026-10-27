import { getGameLog, mockGameLog, rawGameLog } from "@/lib/gamelog";

export const dynamic = "force-dynamic";

// /api/gamelog/<sleeper player id>          -> the player's games
// /api/gamelog/<sleeper player id>?raw=1    -> what Sleeper sent, for troubleshooting
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]+$/.test(id)) return Response.json({ error: "Unknown player." }, { status: 400 });

  if (process.env.MOCK_DATA === "1") return Response.json(mockGameLog(id));

  try {
    if (new URL(req.url).searchParams.get("raw") === "1") {
      return Response.json(await rawGameLog(id));
    }
    return Response.json(await getGameLog(id));
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Sleeper didn't respond." },
      { status: 502 },
    );
  }
}
