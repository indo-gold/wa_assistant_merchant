const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const sqlFile = path.join(__dirname, 'chatbot_retail (3).sql');

const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

// Parse SQL tables
function parseSQLTables() {
  const tables = {};
  const tableRegex = /CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=InnoDB DEFAULT CHARSET=([^;\s]+)(?: COLLATE=([^;\s]+))?;/gs;
  let m;
  while ((m = tableRegex.exec(sqlContent)) !== null) {
    const tableName = m[1];
    const body = m[2];
    const charset = m[3];
    const collate = m[4] || null;
    
    const columns = {};
    const lines = body.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('--') && !l.startsWith('/*'));
    for (const line of lines) {
      const colMatch = line.match(/^`([^`]+)`\s+(.+)$/);
      if (colMatch) {
        columns[colMatch[1]] = colMatch[2].trim().replace(/,$/, '');
      }
    }
    tables[tableName] = { charset, collate, columns };
  }
  return tables;
}

// Parse indexes from SQL
function parseSQLIndexes() {
  const indexes = {};
  const idxSection = sqlContent.substring(sqlContent.indexOf('-- Indexes for dumped tables'));
  const tableIdxRegex = /-- Indexes for table `([^`]+)`\s*\nALTER TABLE `\1`\s*\n((?:  ADD [^;]+,?\s*\n?)+);/g;
  let m;
  while ((m = tableIdxRegex.exec(idxSection)) !== null) {
    const tableName = m[1];
    const idxBody = m[2];
    indexes[tableName] = [];
    const idxLines = idxBody.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    for (const line of idxLines) {
      indexes[tableName].push(line.replace(/,$/, ''));
    }
  }
  return indexes;
}

// Extract columns from migration content
function extractMigrationColumns(content) {
  const columns = {};
  // Find createTable call and extract its object body
  const match = content.match(/createTable\s*\(\s*['"][^'"]+['"]\s*,\s*(\{[\s\S]*?\})\s*,\s*\{/);
  if (!match) {
    // try without the third argument match
    const match2 = content.match(/createTable\s*\(\s*['"][^'"]+['"]\s*,\s*(\{[\s\S]*\})\s*\)\s*;?\s*\n/);
    if (!match2) return columns;
  }
  const body = match ? match[1] : match2[1];
  
  // Parse column definitions - match key: { ... }
  const colRegex = /(?:^|\n)\s*(?:['"])?([a-zA-Z0-9_]+)(?:['"])?\s*:\s*\{([^}]+)\}/g;
  let cm;
  while ((cm = colRegex.exec(body)) !== null) {
    columns[cm[1]] = cm[2].trim();
  }
  return columns;
}

// Parse migrations
function parseMigrations() {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();
  const result = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const tableMatch = content.match(/createTable\s*\(\s*['"]([^'"]+)['"]/);
    if (!tableMatch) continue;
    const tableName = tableMatch[1];
    
    const columns = extractMigrationColumns(content);
    
    const fks = [];
    const fkRegex = /addConstraint\s*\(\s*['"]([^'"]+)['"],\s*\{[^}]*fields:\s*\[([^\]]+)\][^}]*type:\s*['"]foreign key['"][^}]*name:\s*['"]([^'"]+)['"][^}]*table:\s*['"]([^'"]+)['"][^}]*field:\s*['"]([^'"]+)['"]/g;
    let fkm;
    while ((fkm = fkRegex.exec(content)) !== null) {
      fks.push({
        fromTable: fkm[1],
        fields: fkm[2].replace(/['"]/g, '').split(',').map(s => s.trim()),
        name: fkm[3],
        refTable: fkm[4],
        refField: fkm[5]
      });
    }
    
    const idxs = [];
    const idxRegex = /addIndex\s*\(\s*['"]([^'"]+)['"],\s*\[([^\]]+)\],\s*\{[^}]*name:\s*['"]([^'"]+)['"]/g;
    let im;
    while ((im = idxRegex.exec(content)) !== null) {
      idxs.push({
        table: im[1],
        fields: im[2].replace(/['"]/g, '').split(',').map(s => s.trim()),
        name: im[3]
      });
    }
    
    // Also capture unique constraints via addConstraint
    const uniqRegex = /addConstraint\s*\(\s*['"]([^'"]+)['"],\s*\{[^}]*fields:\s*\[([^\]]+)\][^}]*type:\s*['"]unique['"][^}]*name:\s*['"]([^'"]+)['"]/g;
    let um;
    while ((um = uniqRegex.exec(content)) !== null) {
      idxs.push({
        table: um[1],
        fields: um[2].replace(/['"]/g, '').split(',').map(s => s.trim()),
        name: um[3],
        unique: true
      });
    }
    
    result.push({ file, tableName, columns, fks, idxs });
  }
  return result;
}

const sqlTables = parseSQLTables();
const sqlIndexes = parseSQLIndexes();
const migrations = parseMigrations();

let issues = [];

// 1. Check all SQL tables have migrations
for (const tableName of Object.keys(sqlTables)) {
  if (tableName === 'sequelizemeta') continue;
  const mig = migrations.find(m => m.tableName === tableName);
  if (!mig) issues.push(`MISSING MIGRATION: SQL table '${tableName}' has no migration file`);
}

// 2. Check all migrations correspond to SQL tables
for (const mig of migrations) {
  if (!sqlTables[mig.tableName]) {
    issues.push(`EXTRA MIGRATION: '${mig.file}' creates table '${mig.tableName}' which does NOT exist in SQL dump`);
  }
}

// 3. Check migration order for FKs
const orderMap = {};
migrations.forEach((m, i) => orderMap[m.tableName] = i);
for (const mig of migrations) {
  for (const fk of mig.fks) {
    if (fk.refTable === mig.tableName) continue; // self-ref ok
    if (!(fk.refTable in orderMap)) {
      issues.push(`FK MISSING REF TABLE: ${mig.file} -> FK '${fk.name}' references '${fk.refTable}' which has no migration`);
    } else if (orderMap[fk.refTable] > orderMap[mig.tableName]) {
      issues.push(`FK ORDER BUG: ${mig.file} (order ${orderMap[mig.tableName]}) creates FK to '${fk.refTable}' (order ${orderMap[fk.refTable]})`);
    }
  }
}

// 4. Check columns (basic check)
for (const mig of migrations) {
  const sql = sqlTables[mig.tableName];
  if (!sql) continue;
  
  for (const colName of Object.keys(sql.columns)) {
    if (!mig.columns[colName]) {
      issues.push(`MISSING COLUMN: ${mig.file} table '${mig.tableName}' missing column '${colName}'`);
    }
  }
  for (const colName of Object.keys(mig.columns)) {
    if (!sql.columns[colName]) {
      issues.push(`EXTRA COLUMN: ${mig.file} table '${mig.tableName}' has extra column '${colName}' not in SQL`);
    }
  }
}

// 5. Check indexes
for (const mig of migrations) {
  const sqlIdx = sqlIndexes[mig.tableName] || [];
  // We just do a rough count warning if SQL has indexes but migration has none
  if (sqlIdx.length > 1 && mig.idxs.length === 0) {
    issues.push(`MISSING INDEXES: ${mig.file} table '${mig.tableName}' has ${sqlIdx.length} indexes in SQL but 0 in migration`);
  }
}

// 6. Check critical down() problems
for (const mig of migrations) {
  const content = fs.readFileSync(path.join(migrationsDir, mig.file), 'utf-8');
  const downContent = content.substring(content.indexOf('async down'));
  
  // Check that dropTable is last in down
  const hasDropTable = downContent.includes('dropTable');
  if (!hasDropTable) {
    issues.push(`DOWN BUG: ${mig.file} missing dropTable in down()`);
  }
  
  // Check removeConstraint before removeIndex for same name
  for (const fk of mig.fks) {
    const constraintIdx = downContent.indexOf(`removeConstraint('${fk.fromTable}', '${fk.name}')`);
    const indexIdx = downContent.indexOf(`removeIndex('${fk.fromTable}', '${fk.name}')`);
    if (constraintIdx === -1) {
      issues.push(`DOWN BUG: ${mig.file} missing removeConstraint for FK '${fk.name}'`);
    }
    if (indexIdx !== -1 && indexIdx < constraintIdx) {
      issues.push(`DOWN BUG: ${mig.file} removes index '${fk.name}' BEFORE removing constraint - will fail`);
    }
  }
}

// 7. Check for dangerous ON DELETE / ON UPDATE
for (const mig of migrations) {
  for (const fk of mig.fks) {
    const content = fs.readFileSync(path.join(migrationsDir, mig.file), 'utf-8');
    const fkRegex = new RegExp(`addConstraint\\s*\\(\\s*['"]${mig.tableName}['"],\\s*\\{[^}]*fields:\\s*\\[([^\\]]+)\\][^}]*type:\\s*['"]foreign key['"][^}]*name:\\s*['"]${fk.name}['"][^}]*table:\\s*['"]${fk.refTable}['"][^}]*field:\\s*['"]${fk.refField}['"][^}]*(onDelete:\\s*['"]([^'"]+)['"])?[^}]*(onUpdate:\\s*['"]([^'"]+)['"])?`);
    const match = content.match(fkRegex);
    if (match) {
      const onDelete = match[2] || 'NO ACTION';
      if (onDelete === 'CASCADE' && mig.tableName !== 'order_history' && mig.tableName !== 'order_otps') {
        // Not necessarily a bug, but worth noting for review
      }
    }
  }
}

// Print results
if (issues.length === 0) {
  console.log('✅ No critical issues found in migration review!');
} else {
  console.log(`❌ Found ${issues.length} issue(s):\n`);
  issues.forEach(issue => console.log(' - ' + issue));
}
