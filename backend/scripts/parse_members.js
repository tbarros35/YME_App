const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (char === '\r' && !inQuotes) {
      // skip \r
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const csvPath = path.resolve(__dirname, '../prisma/members_import.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const members = parseCSV(csv);
console.log('Total members found:', members.length);
members.forEach((m, i) => {
  const posClean = (m['Cargo / Posição'] || '').replace(/\r?\n/g, ' -> ');
  console.log(`${i+1}. ${m['Nome']} | Dept: ${m['Departamento']} | Email: ${m['Email']} | Pos: ${posClean}`);
});
