// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  // Conectar a la base de datos
  connect() {
    const dbPath = path.join(__dirname, 'presupuesto.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error conectando a la base de datos:', err.message);
      } else {
        console.log('✅ conexión exitosa');
        this.initSchema();
      }
    });
  }

  // Cargar schema.sql si la BD está vacía
  initSchema() {
    // Verificamos si existe la tabla 'meses' buscando en sqlite_master
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='meses'", (err, row) => {
      if (err || !row) {
        console.log('📋 Base vacía o tabla no encontrada, cargando schema.sql...');
        const fs = require('fs');
        const schema = fs.readFileSync('schema.sql', 'utf8');
        this.db.exec(schema, (err) => {
          if (err) {
            console.error('❌ Error cargando schema:', err.message);
          } else {
            console.log('✅ Schema cargado correctamente');
          }
        });
      }
    });
  }

  // Obtener la instancia de la DB (para queries manuales)
  getDb() {
    return this.db;
  }

  // Crear un nuevo mes
  createMes(anio, mes_numero, nombre_mes) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO meses (anio, mes_numero, nombre_mes) VALUES (?, ?, ?)`,
        [anio, mes_numero, nombre_mes],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, anio, mes_numero, nombre_mes });
        }
      );
    });
  }

  // Obtener todos los meses
  getMeses() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM meses ORDER BY anio DESC, mes_numero DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Obtener un mes por ID
  getMesById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM meses WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Crear/Actualizar ingreso
  upsertIngreso(mes_id, tipo, concepto, monto) {
    return new Promise((resolve, reject) => {
      // Usamos INSERT OR REPLACE simplificado ahora que schema.sql tiene UNIQUE(mes_id, tipo, concepto)
      this.db.run(
        `INSERT OR REPLACE INTO ingresos (mes_id, tipo, concepto, monto) VALUES (?, ?, ?, ?)`,
        [mes_id, tipo, concepto, monto],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, mes_id, tipo, concepto, monto });
        }
      );
    });
  }

  // Obtener ingresos de un mes
  getIngresosByMes(mes_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM ingresos WHERE mes_id = ? ORDER BY tipo, concepto`,
        [mes_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Crear/Actualizar gasto
  upsertGasto(mes_id, categoria_id, costo_previsto, costo_real) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO gastos (mes_id, categoria_id, costo_previsto, costo_real) 
         VALUES (?, ?, ?, ?)`,
        [mes_id, categoria_id, costo_previsto, costo_real],
        function (err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            mes_id,
            categoria_id,
            costo_previsto,
            costo_real
          });
        }
      );
    });
  }

  // Obtener gastos de un mes con categorías
  getGastosByMes(mes_id) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT g.*, c.bloque, c.nombre, c.tipo_resumen 
        FROM gastos g 
        JOIN categorias_gasto c ON g.categoria_id = c.id 
        WHERE g.mes_id = ?
        ORDER BY c.bloque, c.nombre
      `, [mes_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Obtener resumen completo de un mes (¡igual que tu Excel!)
  getResumenMes(mes_id) {
    return new Promise((resolve, reject) => {
      // Corrección importante: Calculamos totales en subconsultas para evitar el producto cartesiano
      // que ocurre al hacer JOIN directo entre ingresos y gastos.
      this.db.get(`
        SELECT 
          m.nombre_mes,
          (SELECT COALESCE(SUM(monto), 0) FROM ingresos WHERE mes_id = m.id AND tipo = 'previsto') as total_ingresos_previsto,
          (SELECT COALESCE(SUM(monto), 0) FROM ingresos WHERE mes_id = m.id AND tipo = 'real') as total_ingresos_real,
          (SELECT COALESCE(SUM(costo_previsto), 0) FROM gastos WHERE mes_id = m.id) as total_gastos_previsto,
          (SELECT COALESCE(SUM(costo_real), 0) FROM gastos WHERE mes_id = m.id) as total_gastos_real
        FROM meses m
        WHERE m.id = ?
      `, [mes_id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);

        // Añadimos los cálculos de saldos en JS para mayor claridad
        row.saldo_previsto = row.total_ingresos_previsto - row.total_gastos_previsto;
        row.saldo_real = row.total_ingresos_real - row.total_gastos_real;
        row.diferencia_total = (row.total_ingresos_real - row.total_ingresos_previsto) -
          (row.total_gastos_real - row.total_gastos_previsto);

        resolve(row);
      });
    });
  }

  // Obtener categorías agrupadas por bloque
  getCategoriasByBloque() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT bloque, COUNT(*) as total_categorias 
        FROM categorias_gasto 
        GROUP BY bloque 
        ORDER BY bloque
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Cerrar conexión
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error cerrando DB:', err.message);
        } else {
          console.log('🔒 Base de datos cerrada');
        }
      });
    }
  }
}

module.exports = new Database();
