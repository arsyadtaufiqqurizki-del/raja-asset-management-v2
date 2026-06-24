import { db } from "./src/db";
import { assets } from "./src/db/schema";

async function run() {
  try {
    const newAsset = await db.insert(assets).values({
      assetId: "RRPL/test-1",
      name: "Test Asset",
      val: "Rp 123",
      date: "2023-01-01"
    }).returning();
    console.log("Success:", newAsset);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
run();
