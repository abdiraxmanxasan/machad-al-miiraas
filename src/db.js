// ═══════════════════════════════════════════════════════════════
//  Database — localStorage-backed relational store
//  All state lives here. Modules call these functions directly.
// ═══════════════════════════════════════════════════════════════

const KEYS = {
  students: 'sms_students',
  teachers: 'sms_teachers',
  classes:  'sms_classes',
  subjects: 'sms_subjects',
  attendance: 'sms_attendance',
  notifications: 'sms_notifications',
  settings: 'sms_settings',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ───── Seed Data ─────────────────────────────────────────────
function seedIfEmpty() {
  if (load(KEYS.students)) return; // Already seeded

  const classIds = {
    '7A': uid(), '7B': uid(),
    '8A': uid(), '8B': uid(),
    '9A': uid(), '9B': uid(),
  };

  const teacherIds = {
    t1: uid(), t2: uid(), t3: uid(), t4: uid(), t5: uid(),
  };

  const subjectIds = {
    math: uid(), arabic: uid(), english: uid(), science: uid(), social: uid(),
  };

  // Subjects
  save(KEYS.subjects, [
    { id: subjectIds.math,    name: 'Mathematics',       code: 'MATH', color: '#2563eb' },
    { id: subjectIds.arabic,  name: 'Arabic Language',   code: 'ARAB', color: '#7c3aed' },
    { id: subjectIds.english, name: 'English',           code: 'ENG',  color: '#0891b2' },
    { id: subjectIds.science, name: 'Science',           code: 'SCI',  color: '#16a34a' },
    { id: subjectIds.social,  name: 'Social Studies',    code: 'SOC',  color: '#d97706' },
  ]);

  // Teachers
  save(KEYS.teachers, [
    { id: teacherIds.t1, name: 'Abdi Warsame',   employeeId: 'TCH-001', phone: '+252-61-1234567', email: 'awarsame@school.so', subjects: [subjectIds.math],    classes: [classIds['7A'], classIds['8A']], status: 'active',   joinDate: '2022-09-01', gender: 'male',   qualification: 'BSc Mathematics', avatar: 'AW' },
    { id: teacherIds.t2, name: 'Faadumo Hirsi',  employeeId: 'TCH-002', phone: '+252-61-2345678', email: 'fhirsi@school.so',   subjects: [subjectIds.arabic],   classes: [classIds['7A'], classIds['7B']], status: 'active',   joinDate: '2021-08-15', gender: 'female', qualification: 'BA Arabic', avatar: 'FH' },
    { id: teacherIds.t3, name: 'Mahad Jama',     employeeId: 'TCH-003', phone: '+252-61-3456789', email: 'mjama@school.so',    subjects: [subjectIds.english],  classes: [classIds['8A'], classIds['8B']], status: 'active',   joinDate: '2023-01-10', gender: 'male',   qualification: 'BA English Literature', avatar: 'MJ' },
    { id: teacherIds.t4, name: 'Hodan Osman',    employeeId: 'TCH-004', phone: '+252-61-4567890', email: 'hosman@school.so',   subjects: [subjectIds.science],  classes: [classIds['9A']], status: 'active',   joinDate: '2020-09-01', gender: 'female', qualification: 'BSc Biology', avatar: 'HO' },
    { id: teacherIds.t5, name: 'Xasan Muumin',   employeeId: 'TCH-005', phone: '+252-61-5678901', email: 'xmuumin@school.so',  subjects: [subjectIds.social],   classes: [classIds['9B']], status: 'inactive', joinDate: '2019-08-20', gender: 'male',   qualification: 'BA History', avatar: 'XM' },
  ]);

  // Classes
  save(KEYS.classes, [
    { id: classIds['7A'], name: 'Grade 7-A', grade: '7', section: 'A', teacherId: teacherIds.t1, subjects: [subjectIds.math, subjectIds.arabic, subjectIds.english], room: '101', capacity: 35, academicYear: '2026-2027' },
    { id: classIds['7B'], name: 'Grade 7-B', grade: '7', section: 'B', teacherId: teacherIds.t2, subjects: [subjectIds.math, subjectIds.arabic, subjectIds.science], room: '102', capacity: 35, academicYear: '2026-2027' },
    { id: classIds['8A'], name: 'Grade 8-A', grade: '8', section: 'A', teacherId: teacherIds.t3, subjects: [subjectIds.math, subjectIds.english, subjectIds.science], room: '201', capacity: 38, academicYear: '2026-2027' },
    { id: classIds['8B'], name: 'Grade 8-B', grade: '8', section: 'B', teacherId: teacherIds.t3, subjects: [subjectIds.math, subjectIds.english, subjectIds.social],  room: '202', capacity: 38, academicYear: '2026-2027' },
    { id: classIds['9A'], name: 'Grade 9-A', grade: '9', section: 'A', teacherId: teacherIds.t4, subjects: [subjectIds.science, subjectIds.math, subjectIds.arabic],  room: '301', capacity: 40, academicYear: '2026-2027' },
    { id: classIds['9B'], name: 'Grade 9-B', grade: '9', section: 'B', teacherId: teacherIds.t5, subjects: [subjectIds.social, subjectIds.english, subjectIds.arabic], room: '302', capacity: 40, academicYear: '2026-2027' },
  ]);

  // Students (12 per class × 6 classes = 72 students)
  const studentNames = [
    ['Ahmed Ali', 'Mahad Hassan', 'Cabdi Nuur', 'Ibraahim Cali', 'Xasan Warsame', 'Muuse Jama', 'Faarax Osman', 'Deeq Abdi', 'Khadar Yuusuf', 'Naasir Muumin', 'Sahal Axmed', 'Jaamac Maxamed'],
    ['Liibaan Saleebaan', 'Abdirahman Xirsi', 'Nimco Cumar', 'Hodan Axmed', 'Asad Diiriye', 'Sucaad Nuur', 'Caaisha Jaamac', 'Raxma Cali', 'Fadumo Hassan', 'Saynab Warsame', 'Maryan Muuse', 'Ubax Faarax'],
    ['Guled Osman', 'Cumar Maxamed', 'Shukri Axmed', 'Fatima Hassan', 'Cabdullahi Nuur', 'Maxamuud Jama', 'Idil Cali', 'Wiil Abdi', 'Barwaaqo Warsame', 'Amina Nuur', 'Suuleymaan Jama', 'Qaalin Osman'],
    ['Yahye Hassan', 'Bashiir Axmed', 'Samiira Cali', 'Nadifo Nuur', 'Fowzia Jama', 'Daud Warsame', 'Amiina Muuse', 'Ruun Osman', 'Cali Maxamed', 'Ibtisaam Abdi', 'Warsan Jama', 'Siciid Hassan'],
    ['Maryam Axmed', 'Hani Nuur', 'Bile Cali', 'Ifrah Warsame', 'Yasiin Jama', 'Haawa Muuse', 'Sagal Osman', 'Liiban Abdi', 'Asho Maxamed', 'Cabdiraxman Nuur', 'Filsan Jama', 'Khalid Cali'],
    ['Suad Axmed', 'Ladan Warsame', 'Rooda Nuur', 'Ayanle Jama', 'Cambaro Cali', 'Mahdi Muuse', 'Nimo Osman', 'Hibaaq Abdi', 'Jaceyl Maxamed', 'Farhan Nuur', 'Diido Jama', 'Rashiid Cali'],
  ];

  const classArr = Object.values(classIds);
  const genders  = ['male','female'];
  const parents  = ['Axmed Hassan', 'Warsame Cali', 'Nuur Jama', 'Osman Maxamed', 'Muuse Abdi'];
  const students = [];
  let stNum = 1;

  classArr.forEach((classId, ci) => {
    studentNames[ci].forEach((name, idx) => {
      const yearJoined = 2024 + (Math.floor(idx / 4));
      students.push({
        id: uid(),
        studentId: `ST-${String(stNum).padStart(3, '0')}`,
        name,
        gender: idx % 2 === 0 ? 'male' : 'female',
        dateOfBirth: `200${8 + (idx % 3)}-0${(idx % 9) + 1}-${String((idx % 28) + 1).padStart(2,'0')}`,
        classId,
        grade: classArr.indexOf(classId) < 2 ? '7' : classArr.indexOf(classId) < 4 ? '8' : '9',
        phone: `+252-61-${String(6000000 + stNum).slice(1)}`,
        parentName: parents[idx % parents.length],
        parentPhone: `+252-61-${String(7000000 + stNum).slice(1)}`,
        parentRelation: 'Father',
        address: 'Mogadishu, Somalia',
        enrollmentDate: `${yearJoined}-09-01`,
        status: idx === 3 ? 'inactive' : 'active',
        avatar: name.split(' ').map(n=>n[0]).join('').slice(0,2),
      });
      stNum++;
    });
  });

  save(KEYS.students, students);

  // Seed attendance for the last 7 days
  const today = new Date();
  const allStudents = students.filter(s => s.status === 'active');
  const statuses = ['present','present','present','present','present','late','absent']; // weighted
  const records = [];
  
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().slice(0, 10);

    classArr.forEach(classId => {
      const classStudents = allStudents.filter(s => s.classId === classId);
      classStudents.forEach(student => {
        const status = d === 0 ? null : statuses[Math.floor(Math.random() * statuses.length)];
        if (status) {
          records.push({
            id: uid(),
            studentId: student.id,
            classId,
            date: dateStr,
            status,
            time: status === 'present' ? `07:${String(30 + Math.floor(Math.random()*30)).padStart(2,'0')}` :
                  status === 'late'    ? `08:${String(Math.floor(Math.random()*30)).padStart(2,'0')}` : null,
            recordedBy: 'system',
            notes: '',
          });
        }
      });
    });
  }

  save(KEYS.attendance, records);

  // Notifications
  save(KEYS.notifications, [
    { id: uid(), type: 'info',    title: 'New Enrollment', message: 'Ahmed Ali has been enrolled in Grade 7-A', time: new Date().toISOString(), read: false },
    { id: uid(), type: 'warning', title: 'Low Attendance', message: 'Grade 8-B attendance below 75% this week',  time: new Date(Date.now()-3600000).toISOString(), read: false },
    { id: uid(), type: 'success', title: 'Report Generated', message: 'Monthly attendance report is ready',      time: new Date(Date.now()-7200000).toISOString(), read: true },
  ]);
}

// ═══════════════════════════════════════
//  Public API
// ═══════════════════════════════════════

// Students
export function getStudents()   { return load(KEYS.students)  || []; }
export function saveStudents(d) { save(KEYS.students, d); }

// Teachers
export function getTeachers()   { return load(KEYS.teachers)  || []; }
export function saveTeachers(d) { save(KEYS.teachers, d); }

// Classes
export function getClasses()    { return load(KEYS.classes)   || []; }
export function saveClasses(d)  { save(KEYS.classes, d); }

// Subjects
export function getSubjects()   { return load(KEYS.subjects)  || []; }
export function saveSubjects(d) { save(KEYS.subjects, d); }

// Attendance
export function getAttendance()   { return load(KEYS.attendance)  || []; }
export function saveAttendance(d) { save(KEYS.attendance, d); }

// Notifications
export function getNotifications()   { return load(KEYS.notifications)  || []; }
export function saveNotifications(d) { save(KEYS.notifications, d); }

// Helpers
export function getStudentsByClass(classId) {
  return getStudents().filter(s => s.classId === classId && s.status === 'active');
}

export function getAttendanceForDate(date, classId) {
  return getAttendance().filter(a => a.date === date && (!classId || a.classId === classId));
}

export function getStudentAttendanceSummary(studentId, startDate, endDate) {
  const records = getAttendance().filter(a => {
    const d = a.date;
    return a.studentId === studentId && d >= startDate && d <= endDate;
  });
  const total    = records.length;
  const present  = records.filter(r => r.status === 'present').length;
  const absent   = records.filter(r => r.status === 'absent').length;
  const late     = records.filter(r => r.status === 'late').length;
  const excused  = records.filter(r => r.status === 'excused').length;
  const rate     = total > 0 ? Math.round(((present + excused) / total) * 100) : 0;
  return { total, present, absent, late, excused, rate };
}

export function getTodayAttendanceSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const students = getStudents().filter(s => s.status === 'active');
  const todayRecords = getAttendanceForDate(today);
  const present = todayRecords.filter(r => r.status === 'present').length;
  const absent  = todayRecords.filter(r => r.status === 'absent').length;
  const late    = todayRecords.filter(r => r.status === 'late').length;
  const excused = todayRecords.filter(r => r.status === 'excused').length;
  const marked  = todayRecords.length;
  return { present, absent, late, excused, marked, total: students.length };
}

export function addNotification(type, title, message) {
  const notifs = getNotifications();
  notifs.unshift({ id: uid(), type, title, message, time: new Date().toISOString(), read: false });
  saveNotifications(notifs.slice(0, 50)); // keep last 50
}

export function generateId() { return uid(); }

// Initialize
seedIfEmpty();
