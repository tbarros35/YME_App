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
  const rawPos = row['Cargo / Posição'];
  const rawTG = row['Taskgroups'];
  const rawEvents = row['Eventos do Movimento Júnior'];

  // Parse Career Steps & Admission
  // e.g.:
  // Trainee (Brand Strategy) | 16/07/2025
  // Junior Consultant (Brand Strategy) | 24/10/2025
  // Head of Brand Strategy | 13/07/2026
  const posLines = rawPos.split('\n').map(l => l.trim()).filter(Boolean);
  
  const careerHistory = [];
  const careerMilestones = [];
  let admissionDate = null;
  let currentPosition = 'Consultant';
  let role = 'MEMBER';

  posLines.forEach((line) => {
    // split by | or I
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
      careerMilestones.push({
        title: cleanTitle,
        category: cleanTitle.toLowerCase().includes('trainee') ? 'RECRUITMENT' : 'FORMATION',
        description: `Promoção a ${titleRaw} no departamento de ${department}.`,
        roleStep: cleanTitle,
        eventDate: d.toISOString(),
      });
    }
  });

  // Taskgroups parsing
  const tgLines = rawTG.split('\n').map(l => l.trim()).filter(Boolean);
  const activeTaskgroups = new Set();
  const taskgroupMilestones = [];

  tgLines.forEach((line) => {
    // e.g. "HIVE | PM | 17/03/2026 - 13/07/2026 | 118 Dias"
    // or "Concerto Solidário | Membro Comunicação | 13/07/2026 - 14/11/2025" (2025 is typo for 2026)
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 2) return;

    const tgName = parts[0];
    const tgRole = parts[1] || 'Membro';
    const dateRange = parts[2] || '';

    // Check if current (ends around 14/11/2026 or mentions 14/11/2025 as typo)
    const isCurrent = dateRange.includes('14/11/2026') || dateRange.includes('14/11/2025') || dateRange.includes('Presente');

    // Canonical TG name (e.g. CSR, Partnerships, HIVE, Concerto Solidário, Evento Solidário)
    let canonicalTG = tgName;
    if (tgName.toUpperCase().includes('CSR')) canonicalTG = 'CSR';
    else if (tgName.toUpperCase().includes('PARTNERSHIP')) canonicalTG = 'Partnerships';
    else if (tgName.toUpperCase().includes('HIVE')) canonicalTG = 'HIVE';
    else if (tgName.toUpperCase().includes('CONCERTO')) canonicalTG = 'Concerto Solidário';
    else if (tgName.toUpperCase().includes('EVENTO')) canonicalTG = 'Evento Solidário';

    if (isCurrent) {
      activeTaskgroups.add(canonicalTG);
    }

    // Dates for milestone
    const dates = dateRange.split('-').map(s => s.trim());
    const startDate = parseDate(dates[0]);

    // Determine which roleStep this taskgroup milestone belonged to
    let assignedStep = careerHistory[careerHistory.length - 1];
    if (startDate && careerMilestones.length > 0) {
      for (let i = careerMilestones.length - 1; i >= 0; i--) {
        if (startDate >= new Date(careerMilestones[i].eventDate)) {
          assignedStep = careerMilestones[i].roleStep;
          break;
        }
      }
    }

    taskgroupMilestones.push({
      title: `${canonicalTG} (${tgRole})`,
      category: 'TASKGROUP',
      description: `Participação na taskgroup ${canonicalTG} como ${tgRole} (${dateRange || 'Duração do mandato'}).`,
      roleStep: assignedStep || careerHistory[0],
      eventDate: startDate ? startDate.toISOString() : new Date().toISOString(),
      isCurrent,
    });
  });

  // Eventos Movimento Júnior
  const eventLines = rawEvents.split('\n').map(l => l.trim()).filter(Boolean);
  const eventMilestones = [];

  eventLines.forEach((ev) => {
    // e.g. "XII JENC | 2026", "ExBo Meeting | 2026", "XI JENC | 2026", "X JENC | 2026", "IX JENC | 2025", "JE Europe Winter Conference | 2026", "jeniAL | 2026", "JEday | 2025"
    let eventName = ev;
    let eventDate = new Date(Date.UTC(2026, 5, 1, 12, 0, 0)); // default mid-2026
    let assignedStep = careerHistory[careerHistory.length - 1];

    const evUpper = ev.toUpperCase();

    if (evUpper.includes('IX JENC')) {
      // O IX JENC ocorreu quando os membros que entraram em julho de 2025 eram ainda trainees
      eventName = 'IX JENC (2025)';
      eventDate = new Date(Date.UTC(2025, 9, 15, 12, 0, 0)); // Oct 2025
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('trainee')) || careerHistory[0];
    } else if (evUpper.includes('JEDAY')) {
      eventName = 'JEday (2025)';
      eventDate = new Date(Date.UTC(2025, 10, 20, 12, 0, 0)); // Nov 2025
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('X JENC')) {
      // O X JENC ocorreu quando membros de nov/2025 eram trainees e jul/2025 eram junior consultants
      eventName = 'X JENC (2026)';
      eventDate = new Date(Date.UTC(2026, 0, 20, 12, 0, 0)); // Jan 2026
      if (admissionDate && admissionDate >= new Date(Date.UTC(2025, 10, 1))) {
        // Nov 2025 cohort -> Trainee
        assignedStep = careerHistory.find(s => s.toLowerCase().includes('trainee')) || careerHistory[0];
      } else {
        // Jul 2025 cohort -> Junior Consultant
        assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
      }
    } else if (evUpper.includes('WINTER CONFERENCE')) {
      // O JEE Winter Conference ocorreu em março de 2026
      eventName = 'JE Europe Winter Conference (2026)';
      eventDate = new Date(Date.UTC(2026, 2, 15, 12, 0, 0)); // Mar 2026
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('XI JENC') || evUpper.includes('JENIAL')) {
      // O XI JENC e o Jenial ocorreram quando os membros que entraram em julho e novembro de 2025 eram já todos junior consultants
      eventName = evUpper.includes('XI JENC') ? 'XI JENC (2026)' : 'jeniAL (2026)';
      eventDate = new Date(Date.UTC(2026, 4, 15, 12, 0, 0)); // May 2026
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('junior consultant')) || careerHistory[0];
    } else if (evUpper.includes('EXBO MEETING')) {
      eventName = 'ExBo Meeting (2026)';
      eventDate = new Date(Date.UTC(2026, 6, 20, 12, 0, 0)); // Jul 2026
      assignedStep = careerHistory.find(s => s.toLowerCase().includes('head')) || careerHistory[careerHistory.length - 1];
    } else if (evUpper.includes('XII JENC')) {
      eventName = 'XII JENC (2026)';
      eventDate = new Date(Date.UTC(2026, 9, 20, 12, 0, 0)); // Oct 2026
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

  return {
    name,
    email,
    department,
    position: currentPosition || 'Consultant',
    role,
    careerHistory: careerHistory.length > 0 ? careerHistory : [`Consultant of ${department}`],
    admissionDate: admissionDate ? admissionDate.toISOString() : new Date(Date.UTC(2025, 6, 16)).toISOString(),
    activeTaskgroups: Array.from(activeTaskgroups),
    careerMilestones,
    taskgroupMilestones,
    eventMilestones,
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
console.log('Sample Member #1:');
console.log(JSON.stringify(processedMembers[0], null, 2));
