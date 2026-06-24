import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { requireAuth, AuthRequest } from "./src/middleware/auth.js";
import { db } from "./src/db/index.js";
import { assets, maintenance, users } from "./src/db/schema.js";
import { eq, desc } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');
  app.use(cors({
    origin: process.env.APP_URL || true,
    credentials: true,
  }));
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Assets ---
  // Get all assets
  app.get("/api/assets", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allAssets = await db.select().from(assets);
      res.json(allAssets);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  // Create asset
  app.post("/api/assets", requireAuth, async (req: AuthRequest, res) => {
    try {
      const payload = { ...req.body };
      // Map legacy 'id' field to assetId if present
      if (payload.id && !payload.assetId) {
        payload.assetId = payload.id;
      }
      // Remove serial PK 'id' to prevent conflict with auto-increment
      delete payload.id;
      // Ensure numeric fields are proper integers (not negative or NaN)
      if (payload.lifeInMonths !== undefined && payload.lifeInMonths !== null) {
        const parsed = parseInt(payload.lifeInMonths);
        payload.lifeInMonths = (!isNaN(parsed) && parsed > 0) ? parsed : null;
      }
      if (payload.assetUnits !== undefined && payload.assetUnits !== null) {
        const parsed = parseInt(payload.assetUnits);
        payload.assetUnits = (!isNaN(parsed) && parsed > 0) ? parsed : 1;
      }
      const newAsset = await db.insert(assets).values(payload).returning();
      res.json(newAsset[0]);
    } catch (err: any) {
      console.error("Error creating asset:", err);
      if (err.cause?.code === '23505' || err.message?.includes('duplicate key')) {
        return res.status(400).json({ error: "An asset with this Asset Number already exists. Please use a unique Asset Number." });
      }
      res.status(500).json({ error: err.message || "Failed to create asset" });
    }
  });

  // Bulk Create assets
  app.post("/api/assets/bulk", requireAuth, async (req: AuthRequest, res) => {
    try {
      const items = req.body.assets;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid payload" });
      }
      
      const mappedItems = items.map(item => {
        const payload = { ...item };
        // Map legacy 'id' field to assetId if present
        if (payload.id && !payload.assetId) {
          payload.assetId = payload.id;
        }
        // Remove serial PK 'id' to prevent conflict with auto-increment
        delete payload.id;
        // Sanitize integer fields
        if (payload.lifeInMonths !== undefined && payload.lifeInMonths !== null) {
          const parsed = parseInt(payload.lifeInMonths);
          payload.lifeInMonths = (!isNaN(parsed) && parsed > 0) ? parsed : null;
        }
        if (payload.assetUnits !== undefined && payload.assetUnits !== null) {
          const parsed = parseInt(payload.assetUnits);
          payload.assetUnits = (!isNaN(parsed) && parsed > 0) ? parsed : 1;
        }
        return payload;
      });
      
      const newAssets = await db.transaction(async (tx) => {
        return await tx.insert(assets).values(mappedItems).returning();
      });
      
      res.json(newAssets);
    } catch (err: any) {
      console.error(err);
      if (err.cause?.code === '23505' || err.message?.includes('duplicate key')) {
        return res.status(400).json({ error: "One or more assets in the bulk import have an Asset Number that already exists in the database. Please ensure all Asset Numbers are unique." });
      }
      res.status(500).json({ error: err.message || "Failed to perform bulk insert" });
    }
  });

  // Update asset
  app.put("/api/assets/:id(*)", requireAuth, async (req: AuthRequest, res) => {
    try {
      const payload = { ...req.body };
      if (payload.id) {
        payload.assetId = payload.id;
        delete payload.id;
      }
      delete payload.createdAt;
      delete payload.lastUpdated;

      const updatedAsset = await db.update(assets).set({
        ...payload,
        lastUpdated: new Date()
      }).where(eq(assets.assetId, req.params.id)).returning();
      res.json(updatedAsset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id(*)", requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.delete(assets).where(eq(assets.assetId, req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // --- Maintenance ---
  // Get maintenance
  app.get("/api/maintenance", requireAuth, async (req: AuthRequest, res) => {
    try {
      const maintenanceRecords = await db.select().from(maintenance).orderBy(desc(maintenance.createdAt));
      res.json(maintenanceRecords);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch maintenance" });
    }
  });

  // Create maintenance
  app.post("/api/maintenance", requireAuth, async (req: AuthRequest, res) => {
    try {
      const record = await db.insert(maintenance).values(req.body).returning();
      res.json(record[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create maintenance record" });
    }
  });

  // Update maintenance
  app.put("/api/maintenance/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const payload = { ...req.body };
      delete payload.createdAt;
      
      const updatedRecord = await db.update(maintenance).set({
        ...payload
      }).where(eq(maintenance.maintenanceId, req.params.id)).returning();
      res.json(updatedRecord[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update maintenance record" });
    }
  });

  // Delete maintenance
  app.delete("/api/maintenance/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.delete(maintenance).where(eq(maintenance.maintenanceId, req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete maintenance record" });
    }
  });

  // --- AI Chat ---
  app.post("/api/ai/chat", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { messages } = req.body;
      const allAssets = await db.select().from(assets);
      const allMaintenance = await db.select().from(maintenance);

      const systemPrompt = `You are a helpful AI assistant for the 'Perusahaan Raja' Asset Management app. 
Here is the current asset inventory data in JSON format: ${JSON.stringify(allAssets)}
Here is the maintenance records data in JSON format: ${JSON.stringify(allMaintenance)}
Answer user queries related to this data context. Be concise and professional. Use markdown for better formatting.`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const MIMO_API_KEY = process.env.MIMO_API_KEY || "tp-ssqijy8zs5qxm6ptdlcnfuhsgmug0mi77gr1e4vaefnuw2v1";

      const response = await fetch("https://token-plan-sgp.xiaomimimo.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MIMO_API_KEY}`
        },
        body: JSON.stringify({
          model: "mimo-v2.5",
          messages: aiMessages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
