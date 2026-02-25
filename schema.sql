PRAGMA foreign_keys = ON;

-- Limpiar tablas existentes
DROP TABLE IF EXISTS gastos;
DROP TABLE IF EXISTS ingresos;
DROP TABLE IF EXISTS categorias_gasto;
DROP TABLE IF EXISTS meses;

-- Tabla de meses (Enero 2025, Febrero 2025, etc.)
CREATE TABLE meses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anio INTEGER NOT NULL,
  mes_numero INTEGER NOT NULL CHECK (mes_numero >= 1 AND mes_numero <= 12),
  nombre_mes TEXT NOT NULL
);

-- Tabla de ingresos (exactamente como tu Excel)
CREATE TABLE ingresos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mes_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('previsto', 'real')),
  concepto TEXT NOT NULL CHECK (concepto IN ('Ingreso 1', 'Ingresos adicionales')),
  monto REAL NOT NULL DEFAULT 0 CHECK (monto >= 0),
  FOREIGN KEY (mes_id) REFERENCES meses(id) ON DELETE CASCADE,
  UNIQUE(mes_id, tipo, concepto)
);

-- Tabla de categorías (TODAS las del Excel agrupadas por bloque)
CREATE TABLE categorias_gasto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bloque TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo_resumen TEXT NOT NULL CHECK (tipo_resumen IN ('FIJO', 'EXTRA', 'INVERSION'))
);

-- Tabla de gastos (costos previstos/reales por categoría y mes)
CREATE TABLE gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mes_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  costo_previsto REAL NOT NULL DEFAULT 0,
  costo_real REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (mes_id) REFERENCES meses(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias_gasto(id) ON DELETE RESTRICT,
  UNIQUE(mes_id, categoria_id)
);

-- ===========================================
-- TODAS LAS CATEGORÍAS EXACTAS DEL EXCEL
-- ===========================================

-- BLOQUE ALOJAMIENTO (todas FIJAS)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('ALOJAMIENTO', 'Hipoteca o alquiler', 'FIJO'),
('ALOJAMIENTO', 'Teléfono', 'FIJO'),
('ALOJAMIENTO', 'Electricidad', 'FIJO'),
('ALOJAMIENTO', 'Gas', 'FIJO'),
('ALOJAMIENTO', 'Agua y alcantarillado', 'FIJO'),
('ALOJAMIENTO', 'Televisión por cable', 'FIJO'),
('ALOJAMIENTO', 'Recogida de residuos', 'FIJO'),
('ALOJAMIENTO', 'Mantenimiento o reparaciones', 'FIJO'),
('ALOJAMIENTO', 'Suministros', 'FIJO'),
('ALOJAMIENTO', 'Otros', 'FIJO');

-- BLOQUE ENTRETENIMIENTO/OCIO (todas EXTRAS)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('ENTRETENIMIENTO/OCIO', 'Salida', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Noche de fiesta', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Cine', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Conciertos', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Eventos deportivos', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Plataformas de contenido', 'EXTRA'),
('ENTRETENIMIENTO/OCIO', 'Otros', 'EXTRA');

-- BLOQUE TRANSPORTE (mezcla FIJO/EXTRA)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('TRANSPORTE', 'Pago del vehículo', 'FIJO'),
('TRANSPORTE', 'Gastos de taxi o bus', 'EXTRA'),
('TRANSPORTE', 'Seguro', 'FIJO'),
('TRANSPORTE', 'Licencias', 'FIJO'),
('TRANSPORTE', 'Combustible', 'EXTRA'),
('TRANSPORTE', 'Mantenimiento', 'FIJO'),
('TRANSPORTE', 'Otros', 'EXTRA');

-- BLOQUE COMIDA (mezcla FIJO/EXTRA)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('COMIDA', 'Alimentos', 'FIJO'),
('COMIDA', 'Restaurantes', 'EXTRA'),
('COMIDA', 'Comida a domicilio', 'EXTRA'),
('COMIDA', 'Otros', 'EXTRA');

-- BLOQUE CUIDADO PERSONAL (mezcla FIJO/EXTRA)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('CUIDADO PERSONAL', 'Gimnasio', 'FIJO'),
('CUIDADO PERSONAL', 'Pelo', 'EXTRA'),
('CUIDADO PERSONAL', 'Ropa', 'EXTRA'),
('CUIDADO PERSONAL', 'Médico/Salud', 'FIJO'),
('CUIDADO PERSONAL', 'Cursos', 'EXTRA'),
('CUIDADO PERSONAL', 'Otros', 'EXTRA');

-- BLOQUE OTROS GASTOS (extras)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('OTROS GASTOS', 'Regalos', 'EXTRA'),
('OTROS GASTOS', 'Compras puntuales', 'EXTRA'),
('OTROS GASTOS', 'Renovación/Reparación Dispositivos', 'EXTRA'),
('OTROS GASTOS', 'Otros', 'EXTRA');

-- BLOQUE INVERSIONES (todas INVERSIONES)
INSERT INTO categorias_gasto (bloque, nombre, tipo_resumen) VALUES
('INVERSIONES', 'S&P 500', 'INVERSION'),
('INVERSIONES', 'Fondos Indexados', 'INVERSION'),
('INVERSIONES', 'Cuenta ahorros', 'INVERSION'),
('INVERSIONES', 'Criptomonedas', 'INVERSION'),
('INVERSIONES', 'Otros', 'INVERSION');

-- Mes de prueba (Octubre 2025 como aparece en tu Excel)
INSERT INTO meses (anio, mes_numero, nombre_mes) VALUES
(2025, 10, 'Octubre 2025');
