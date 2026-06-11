/**
 * convertir-excel.js
 * Ferretería Magus — Conversor Excel → products.json
 * 
 * Uso: node convertir-excel.js productos.xlsx
 * Resultado: genera products.json en la misma carpeta
 */

const xlsx = require('xlsx');
const fs   = require('fs');
const path = require('path');

const archivoEntrada = process.argv[2];

if (!archivoEntrada) {
  console.error('\n❌  Debes indicar el archivo Excel.');
  console.error('   Uso: node convertir-excel.js productos.xlsx\n');
  process.exit(1);
}

if (!fs.existsSync(archivoEntrada)) {
  console.error(`\n❌  No se encuentra el archivo: ${archivoEntrada}\n`);
  process.exit(1);
}

console.log(`\n📂  Leyendo: ${archivoEntrada}`);

const workbook  = xlsx.readFile(archivoEntrada);
const sheetName = workbook.SheetNames[0];
const sheet     = workbook.Sheets[sheetName];
const rows      = xlsx.utils.sheet_to_json(sheet, { defval: '' });

console.log(`📊  Filas encontradas: ${rows.length}`);

// Normaliza los nombres de columna (maneja variantes del Excel)
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

    // Mapeo de columnas del Excel de Magus
    const nombre      = normalized.producto        || normalized.nombre        || normalized.descripcion || '';
    const stock       = parseInt(normalized.stock  || 0, 10);
    const costoNeto   = parseFloat(normalized.costo_neto  || normalized.costo  || 0);
    const totalNeto   = parseFloat(normalized.total_neto  || normalized.total  || 0);
    const unidad      = normalized.unidad          || 'Unidad';
    const categoria   = normalized.categoria       || normalized.categorias    || 'General';
    const subcatRaw   = normalized.subcategorias   || normalized.subcategoria  || '';
    // La subcategoría en el Excel aparece como "Tuberias y PPR", etc.
    // Limpiamos para usar solo la segunda parte como subcategoría
    const subcategoria = subcatRaw.includes(' y ')
      ? subcatRaw.split(' y ').slice(1).join(' y ').trim()
      : subcatRaw.trim();

    if (!nombre) return null; // Saltar filas vacías

    return {
      id:           i + 1,
      nombre:       nombre.toUpperCase(),
      stock,
      enStock:      stock > 0,
      costoNeto:    Math.round(costoNeto),
      totalNeto:    Math.round(totalNeto),
      precio:       Math.round(costoNeto),   // precio a mostrar = costo neto
      unidad,
      categoria:    categoria.trim(),
      subcategoria,
    };
  })
  .filter(Boolean);

// Obtener categorías únicas
const categorias = [...new Set(productos.map(p => p.categoria))].sort();
const stats = {
  total:        productos.length,
  enStock:      productos.filter(p => p.enStock).length,
  sinStock:     productos.filter(p => !p.enStock).length,
  categorias:   categorias.length,
};

const salida = {
  generado:   new Date().toISOString(),
  archivo:    path.basename(archivoEntrada),
  stats,
  categorias,
  productos,
};

const archivoSalida = path.join(path.dirname(archivoEntrada), 'products.json');
fs.writeFileSync(archivoSalida, JSON.stringify(salida, null, 2), 'utf8');

console.log('\n✅  Conversión exitosa:');
console.log(`   Total productos  : ${stats.total}`);
console.log(`   En stock         : ${stats.enStock}`);
console.log(`   Sin stock        : ${stats.sinStock}`);
console.log(`   Categorías       : ${stats.categorias}`);
console.log(`   Archivo generado : ${archivoSalida}`);
console.log('\n👉  Ahora ejecuta push.bat para publicar los cambios.\n');
