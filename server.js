// server.js
const express = require('express');
const path = require('path');
const db = require('./db.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conectar DB al arrancar
db.connect();

// ===== RUTAS DE MESES =====
app.get('/api/meses', async (req, res) => {
  try {
    const meses = await db.getMeses();
    res.json(meses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meses', async (req, res) => {
  try {
    const { anio, mes_numero, nombre_mes } = req.body;
    const mes = await db.createMes(anio, mes_numero, nombre_mes);
    res.json(mes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RUTAS DE INGRESOS =====
app.get('/api/ingresos/:mesId', async (req, res) => {
  try {
    const ingresos = await db.getIngresosByMes(req.params.mesId);
    res.json(ingresos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ingresos/:mesId', async (req, res) => {
  try {
    const { tipo, concepto, monto } = req.body;
    const ingreso = await db.upsertIngreso(req.params.mesId, tipo, concepto, monto);
    res.json(ingreso);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RUTAS DE GASTOS =====
app.get('/api/gastos/:mesId', async (req, res) => {
  try {
    const gastos = await db.getGastosByMes(req.params.mesId);
    res.json(gastos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gastos/:mesId', async (req, res) => {
  try {
    const { categoria_id, costo_previsto, costo_real } = req.body;
    const gasto = await db.upsertGasto(req.params.mesId, categoria_id, costo_previsto, costo_real);
    res.json(gasto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RESUMEN (¡igual que tu Excel!) =====
app.get('/api/resumen/:mesId', async (req, res) => {
  try {
    const resumen = await db.getResumenMes(req.params.mesId);
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CATEGORÍAS (para el frontend) =====
app.get('/api/categorias', async (req, res) => {
  try {
    const dbRaw = db.getDb();
    const categorias = await new Promise((resolve, reject) => {
      dbRaw.all(`
        SELECT * FROM categorias_gasto 
        ORDER BY bloque, nombre
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor completo en http://localhost:${PORT}`);
  console.log(`📊 Probar: http://localhost:${PORT}/api/meses`);
});
