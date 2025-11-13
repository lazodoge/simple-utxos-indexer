import express from "express";
import cors from "cors";
import { getUTXOs } from "./db";
import { rateLimit } from "express-rate-limit";

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

app.use(limiter);
app.use(cors({ origin: "*" }));

app.get("/api/utxos/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const utxos = await getUTXOs(address);

    if (!utxos || utxos.length === 0) {
      res.status(404).json({ error: "No UTXOs found for this address" });
      return;
    }

    const utxosResponse = utxos.map((utxo) => {
      return {
        value: utxo.value,
        txid: utxo.id.split(":")[0],
        vout: parseInt(utxo.id.split(":")[1]),
        address: utxo.address,
        blockHeight: utxo.blockHeight,
      };
    });

    return res.json(utxosResponse);
  } catch (error) {
    console.error("Error getting UTXOs:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

app.listen(3040, () => {
  console.log("Server is running on port 3040");
});
