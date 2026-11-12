const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '../prisma/members_import.csv');
const rawCSV = fs.readFileSync(csvPath, 'utf8');

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
      // ignore
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
      row[h.trim()] = (values[idx] || '').trim();
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

function parseDate(str) {
  if (!str) return null;
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

function processMember(row) {
  const name = row['Nome'];
  const email = row['Email'].toLowerCase().trim();
  const department = row['Departamento'].trim();
  const rawPos = row['Cargo / Posição'] || '';
  const rawTG = row['Taskgroups'] || '';
  const rawEvents = row['Eventos do Movimento Júnior'] || '';
  const rawProjects = row['Projetos Externos'] || '';

  // Parse Career Steps & Dates
  const posLines = rawPos.split('\n').map(l => l.trim()).filter(Boolean);
  
  const careerHistory = [];
  const careerDates = []; // { step: string, date: Date }
  let admissionDate = null;
  let currentPosition = 'Consultant';
  let role = 'MEMBER';

  posLines.forEach((line) => {
    const parts = line.split(/[|I]/);
    const titleRaw = (parts[0] || '').trim();
    const dateRaw = (parts[1] || '').trim();
    const d = parseDate(dateRaw);

    let cleanTitle = titleRaw;
    if (cleanTitle.toLowerCase().includes('trainee')) {
      cleanTitle = `Trainee of ${department}`;
      if (!admissionDate && d) admissionDate = d;
    } else if (cleanTitle.toLowerCase().includes('junior consultant')) {
      cleanTitle = `Junior Consultant of ${department}`;
    } else if (cleanTitle.toLowerCase().includes('head')) {
      cleanTitle = `Head of ${department}`;
      role = 'DIRECTOR';
    } else if (cleanTitle.toLowerCase().includes('manager')) {
      cleanTitle = `${titleRaw} of ${department}`;
    }

    careerHistory.push(cleanTitle);
    currentPosition = titleRaw;
    if (titleRaw.toLowerCase().includes('head')) {
      role = 'DIRECTOR';
    }

    if (d) {
      careerDates.push({ step: cleanTitle, date: d });
    }
  });

  // Helper to determine the roleStep at any given date based on career progression
  function getRoleStepAtDate(targetDate) {
    if (!targetDate || careerDates.length === 0) {
      return careerHistory[0] || `Trainee of ${department}`;
    }
    const sorted = [...careerDates].sort((a, b) => a.date.getTime() - b.date.getTime());
    let matchedStep = sorted[0].step;
    for (const entry of sorted) {
      if (targetDate.getTime() >= entry.date.getTime()) {
        matchedStep = entry.step;
      }
    }
    return matchedStep;
  }

  // 1. Taskgroups parsing
  const tgLines = rawTG.split('\n').map(l => l.trim()).filter(Boolean);
  const activeTaskgroups = new Set();
  const taskgroupMilestones = [];

  tgLines.forEach((line) => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 2) return;

    const tgName = parts[0];
    const tgRole = parts[1] || 'Membro';
    const dateRange = parts[2] || '';

    const isCurrent = dateRange.includes('14/11/2026') || dateRange.includes('14/11/2025') || dateRange.includes('Presente');

    let canonicalTG = tgName;
    if (tgName.toUpperCase().includes('CSR')) canonicalTG = 'CSR';
    else if (tgName.toUpperCase().includes('PARTNERSHIP')) canonicalTG = 'Partnerships';
    else if (tgName.toUpperCase().includes('HIVE')) canonicalTG = 'HIVE';
    else if (tgName.toUpperCase().includes('CONCERTO')) canonicalTG = 'Concerto Solidário';
    else if (tgName.toUpperCase().includes('EVENTO')) canonicalTG = 'Evento Solidário';

    if (isCurrent) {
      activeTaskgroups.add(canonicalTG);
    }

    const dates = dateRange.split('-').map(s => s.trim());
    const startDate = parseDate(dates[0]);
    const assignedStep = getRoleStepAtDate(startDate);

    taskgroupMilestones.push({
      title: `${canonicalTG} (${tgRole})`,
      category: 'TASKGROUP',
      description: `Participação na taskgroup ${canonicalTG} como ${tgRole} (${dateRange || 'Duração do mandato'}).`,
      roleStep: assignedStep,
      eventDate: startDate ? startDate.toISOString() : (admissionDate ? admissionDate.toISOString() : new Date().toISOString()),
      isCurrent,
    });
  });

  // 2. Eventos Movimento Júnior
  const eventLines = rawEvents.split('\n').map(l => l.trim()).filter(Boolean);
  const eventMilestones = [];

  eventLines.forEach((ev) => {
    let eventName = ev;
    let eventDate = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
    let assignedStep = careerHistory[careerHistory.length - 1];

    const evUpper = ev.toUpperCase();

    if (evUpper.includes('IX JENC')) {
      eventName = 'IX JENC (2025)';
      eventDate = new Date(Date.UTC(2025, 9, 15, 12, 0, 0));
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('trainee')) || careerHistory[0];
    } else if (evUpper.includes('JEDAY')) {
      eventName = 'JEday (2025)';
      eventDate = new Date(Date.UTC(2025, 10, 20, 12, 0, 0));
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('X JENC')) {
      eventName = 'X JENC (2026)';
      eventDate = new Date(Date.UTC(2026, 0, 20, 12, 0, 0));
      if (admissionDate && admissionDate >= new Date(Date.UTC(2025, 10, 1))) {
        assignedStep = careerHistory.find(s => s.toLowerCase().includes('trainee')) || careerHistory[0];
      } else {
        assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
      }
    } else if (evUpper.includes('WINTER CONFERENCE')) {
      eventName = 'JE Europe Winter Conference (2026)';
      eventDate = new Date(Date.UTC(2026, 2, 15, 12, 0, 0));
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('XI JENC') || evUpper.includes('JENIAL')) {
      eventName = evUpper.includes('XI JENC') ? 'XI JENC (2026)' : 'jeniAL (2026)';
      eventDate = new Date(Date.UTC(2026, 4, 15, 12, 0, 0));
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('EXBO MEETING')) {
      eventName = 'ExBo Meeting (2026)';
      eventDate = new Date(Date.UTC(2026, 6, 20, 12, 0, 0));
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('head')) || careerHistory[careerHistory.length - 1];
    } else if (evUpper.includes('XII JENC')) {
      eventName = 'XII JENC (2026)';
      eventDate = new Date(Date.UTC(2026, 9, 20, 12, 0, 0));
      assignedStep = careerHistory[careerHistory.length - 1];
    }

    eventMilestones.push({
      title: eventName,
      category: 'FORMATION',
      description: `Participação no evento nacional/europeu do Movimento Júnior: ${eventName}.`,
      roleStep: assignedStep || careerHistory[0],
      eventDate: eventDate.toISOString(),
    });
  });

  // 3. Projetos Externos (Serviços)
  const projectLines = rawProjects.split('\n').map(l => l.trim()).filter(Boolean);
  const projectMilestones = [];

  projectLines.forEach((line) => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) return;

    const projCode = parts[0];
    const projScope = parts[1];
    const projRole = parts[2];
    const dateRange = parts[3] || '';

    const dates = dateRange.split('-').map(s => s.trim());
    const startDate = parseDate(dates[0]);
    const assignedStep = getRoleStepAtDate(startDate);

    projectMilestones.push({
      title: `${projCode} - ${projScope} (${projRole})`,
      category: 'PROJECT',
      description: `Participação no serviço externo ${projCode} (${projScope}) como ${projRole} (${dateRange || 'Em curso'}).`,
      roleStep: assignedStep,
      eventDate: startDate ? startDate.toISOString() : (admissionDate ? admissionDate.toISOString() : new Date().toISOString()),
    });
  });

  return {
    name,
    email,
    department,
    position: currentPosition || 'Consultant',
    role,
    careerHistory: careerHistory.length > 0 ? careerHistory : [`Consultant of ${department}`],
    admissionDate: admissionDate ? admissionDate.toISOString() : new Date(Date.UTC(2025, 6, 16)).toISOString(),
    activeTaskgroups: Array.from(activeTaskgroups),
    taskgroupMilestones,
    eventMilestones,
    projectMilestones,
  };
}

const rawMembers = parseCSV(rawCSV);
const processedMembers = rawMembers.map(processMember);

fs.writeFileSync(
  path.resolve(__dirname, 'processed_members.json'),
  JSON.stringify(processedMembers, null, 2),
  'utf8'
);

console.log('✅ Processed', processedMembers.length, 'members.');

const withProjects = processedMembers.filter(m => m.projectMilestones.length > 0);
console.log(`\n📁 Membros com Projetos Externos: ${withProjects.length}`);
withProjects.forEach(m => {
  console.log(`\n• ${m.name} (${m.department}):`);
  m.projectMilestones.forEach(p => {
    console.log(`  - [${p.roleStep}] ${p.title} (${p.eventDate.slice(0, 10)})`);
  });
});
