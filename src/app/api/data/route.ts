import { jsonOk } from "@/lib/api-utils";
import { loadAppData } from "@/lib/load-app-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadAppData();
  return jsonOk(data);
}
