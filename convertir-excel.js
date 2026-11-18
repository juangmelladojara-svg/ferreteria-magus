/**
 * convertir-excel.js
 * Distribuidora Puerto Madero — Conversor Excel → products.json
 *
 * Formato esperado (hoja "Sheet2"):
 *   Tipo de producto | Código Barras | SKU | Variante | Precio Venta
 *
 * Uso: node convertir-excel.js archivo.xls
 * Resultado: genera products.json en la misma carpeta
 */

const xlsx = require('xlsx');
const fs   = require('fs');
const path = require('path');

const archivoEntrada = process.argv[2];

if (!archivoEntrada) {
  console.error('\n❌  Debes indicar el archivo Excel.');
  console.error('   Uso: node convertir-excel.js archivo.xls\n');
  process.exit(1);
}

if (!fs.existsSync(archivoEntrada)) {
  console.error(`\n❌  No se encuentra el archivo: ${archivoEntrada}\n`);
  process.exit(1);
}

console.log(`\n📂  Leyendo: ${archivoEntrada}`);

const workbook = xlsx.readFile(archivoEntrada);

// La hoja de datos es la que tiene más de una columna (la primera suele ser metadata)
const sheetName = workbook.SheetNames.find(name => {
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
  return rows[0] && rows[0].length > 2;
}) || workbook.SheetNames[0];

const sheet = workbook.Sheets[sheetName];
const rows  = xlsx.utils.sheet_to_json(sheet, { defval: '' });

console.log(`📄  Hoja usada: ${sheetName}`);
console.log(`📊  Filas encontradas: ${rows.length}`);

// Excel guarda SKU/Código de barras como fórmula de texto ="705" para no perder ceros iniciales
function limpiarCodigo(valor) {
  const s = String(valor || '').trim();
  const m = s.match(/^="?(.*?)"?$/);
  return (m ? m[1] : s).trim();
}

const ACRONIMOS = { ppr: 'PPR', pvc: 'PVC', wc: 'WC', epp: 'EPP' };

// Excepciones detectadas manualmente: precios que YA venían en pesos completos
// por debajo de 1000 (no en "miles"). Sin esto, ×1000 los infla de forma absurda
// (ej. una amarra plástica no puede costar $300.000).
const PRECIOS_YA_EN_PESOS = new Set([
  'AMARRA PLASTICA UNIDAD 10CM',
  'AMARRA PLASTICA UNIDAD 16CM',
  'CANCAMO CERRADO NUMERO 5',
]);

function normalizarCategoria(raw) {
  const limpio = String(raw || '').trim();
  if (!limpio || limpio.toLowerCase() === 'sin tipo') return 'General';

  // Unifica variantes singular/plural del mismo rubro
  const singularPlural = {
    'BROCA': 'Brocas', 'BROCAS': 'Brocas',
    'ESCUADRA': 'Escuadras', 'ESCUADRAS': 'Escuadras',
    'LLAVE': 'Llaves', 'LLAVES': 'Llaves',
    'SILICONA': 'Siliconas', 'SILICONAS': 'Siliconas',
  };
  const upper = limpio.toUpperCase();
  if (singularPlural[upper]) return singularPlural[upper];

  return limpio
    .toLowerCase()
    .split(' ')
    .map(palabra => ACRONIMOS[palabra] || (palabra.charAt(0).toUpperCase() + palabra.slice(1)))
    .join(' ');
}

function normalizeKey(key) {
  return key.trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[óò]/g, 'o')
    .replace(/[úù]/g, 'u').replace(/[ñ]/g, 'n');
}

const productos = rows
  .map((row, i) => {
    const normalized = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
    }

    const nombre = normalized.variante || normalized.producto || normalized.nombre || '';

    // El listado mezcla dos formatos de precio: pesos completos (6000 = $6.000)
    // y "miles" con decimal (6.3 = $6.300). Cualquier valor < 1000 viene en miles,
    // salvo las excepciones ya detectadas en PRECIOS_YA_EN_PESOS.
    const precioRaw   = parseFloat(normalized.precio_venta || normalized.precio || 0);
    const yaEnPesos   = PRECIOS_YA_EN_PESOS.has(nombre.toUpperCase());
    const precio      = Math.round(precioRaw < 1000 && !yaEnPesos ? precioRaw * 1000 : precioRaw);

    const categoria = normalizarCategoria(normalized.tipo_de_producto || normalized.categoria || '');
    const sku       = limpiarCodigo(normalized.sku);
    const codigoBarras = limpiarCodigo(normalized.codigo_barras);

    if (!nombre) return null; // Saltar filas vacías

    return {
      id:           i + 1,
      nombre:       nombre.toUpperCase(),
      sku,
      codigoBarras,
      enStock:      true,   // el listado no trae stock por unidad, se asume disponible
      precio,
      unidad:       'Unidad',
      categoria,
      subcategoria: '',
      imagen:       null,   // se completa en una etapa posterior (búsqueda de fotos)
    };
  })
  .filter(Boolean);

// Obtener categorías únicas
const categorias = [...new Set(productos.map(p => p.categoria))].sort();
const stats = {
  total:      productos.length,
  enStock:    productos.filter(p => p.enStock).length,
  sinStock:   productos.filter(p => !p.enStock).length,
  categorias: categorias.length,
};

const salida = {
  generado: new Date().toISOString(),
  archivo:  path.basename(archivoEntrada),
  stats,
  categorias,
  productos,
};

const archivoSalida = path.join(path.dirname(archivoEntrada) || '.', 'products.json');
fs.writeFileSync(archivoSalida, JSON.stringify(salida, null, 2), 'utf8');

console.log('\n✅  Conversión exitosa:');
console.log(`   Total productos  : ${stats.total}`);
console.log(`   Categorías       : ${stats.categorias}`);
console.log(`   Archivo generado : ${archivoSalida}`);
console.log('\n👉  Ahora ejecuta push.bat para publicar los cambios.\n');
