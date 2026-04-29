import { Router } from "express";

const router = Router();
const SII_BASE = "https://sii.celaya.tecnm.mx/api";

const forwardResponse = async (response, res) => {
  const text = await response.text();

  res
    .status(response.status)
    .type(response.headers.get("content-type") || "application/json")
    .send(text);
};

router.post("/login", async (req, res) => {
  try {
    const response = await fetch(`${SII_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    await forwardResponse(response, res);
  } catch (error) {
    console.error("Error en proxy /login:", error);
    res.status(500).json({ message: "Error al conectar con el SII" });
  }
});

router.get("/movil/estudiante", async (req, res) => {
  try {
    const response = await fetch(`${SII_BASE}/movil/estudiante`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });

    await forwardResponse(response, res);
  } catch (error) {
    console.error("Error en proxy /movil/estudiante:", error);
    res.status(500).json({ message: "Error al conectar con el SII" });
  }
});

router.get("/movil/estudiante/calificaciones", async (req, res) => {
  try {
    const response = await fetch(`${SII_BASE}/movil/estudiante/calificaciones`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });

    await forwardResponse(response, res);
  } catch (error) {
    console.error("Error en proxy /calificaciones:", error);
    res.status(500).json({ message: "Error al conectar con el SII" });
  }
});

router.get("/movil/estudiante/kardex", async (req, res) => {
  try {
    const response = await fetch(`${SII_BASE}/movil/estudiante/kardex`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });

    await forwardResponse(response, res);
  } catch (error) {
    console.error("Error en proxy /kardex:", error);
    res.status(500).json({ message: "Error al conectar con el SII" });
  }
});

router.get("/movil/estudiante/horarios", async (req, res) => {
  try {
    const response = await fetch(`${SII_BASE}/movil/estudiante/horarios`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });

    await forwardResponse(response, res);
  } catch (error) {
    console.error("Error en proxy /horarios:", error);
    res.status(500).json({ message: "Error al conectar con el SII" });
  }
});

export default router;