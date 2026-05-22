const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const User = require('../models/User');
const logger = require('../config/logger');

const pad = (n) => String(n).padStart(2, '0');

const parseWorkDays = () => {
  const raw = process.env.AUTO_ROSTER_WORK_DAYS || '1,2,3,4,5';
  return raw
    .split(',')
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
};

const parseTime = (timeString, fallbackHour, fallbackMinute) => {
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  const [hourRaw, minuteRaw] = timeString.split(':');
  const hour = parseInt(hourRaw, 10);
  const minute = parseInt(minuteRaw, 10);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  return { hour, minute };
};

const availabilityKeyByDay = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const buildDateWithTime = (date, hour, minute) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const getMonthBoundaries = (year, monthIndex) => {
  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { monthStart, monthEnd };
};

const parseShiftTemplates = () => {
  const fallbackTemplates = [
    { name: 'Morning', start: '06:00', end: '14:00', type: 'regular' },
    { name: 'Afternoon', start: '14:00', end: '22:00', type: 'regular' },
    { name: 'Night', start: '22:00', end: '06:00', type: 'regular' },
  ];

  const raw = process.env.AUTO_ROSTER_SHIFT_TEMPLATES_JSON;
  if (!raw) return fallbackTemplates;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackTemplates;
    }

    const sanitized = parsed
      .map((t, index) => ({
        name: (t && t.name) || `Template ${index + 1}`,
        start: (t && t.start) || '09:00',
        end: (t && t.end) || '17:00',
        type: (t && t.type) || 'regular',
      }))
      .filter((t) => typeof t.start === 'string' && typeof t.end === 'string');

    return sanitized.length > 0 ? sanitized : fallbackTemplates;
  } catch (error) {
    logger.warn('AUTO_ROSTER_SHIFT_TEMPLATES_JSON is invalid JSON. Falling back to default templates.');
    return fallbackTemplates;
  }
};

const buildRangeFromTimeStrings = (date, startTimeString, endTimeString, defaultStart, defaultEnd) => {
  const startParts = parseTime(startTimeString, defaultStart.hour, defaultStart.minute);
  const endParts = parseTime(endTimeString, defaultEnd.hour, defaultEnd.minute);

  const startTime = buildDateWithTime(date, startParts.hour, startParts.minute);
  const endTime = buildDateWithTime(date, endParts.hour, endParts.minute);

  // Overnight shifts are allowed (e.g. 22:00 -> 06:00 next day).
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return { startTime, endTime };
};

const rotateArrayByOffset = (arr, offset) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const normalized = ((offset % arr.length) + arr.length) % arr.length;
  return arr.map((_, index) => arr[(index + normalized) % arr.length]);
};

const pickBestTemplate = ({
  date,
  employee,
  templateCandidates,
  employeeTemplateCount,
  dailyTemplateUsage,
  defaultStart,
  defaultEnd,
}) => {
  if (templateCandidates.length === 0) {
    return null;
  }

  const employeeId = employee._id.toString();
  const employeeCountMap = employeeTemplateCount.get(employeeId) || new Map();

  let best = null;

  templateCandidates.forEach((template, index) => {
    const employeeUsed = employeeCountMap.get(template.name) || 0;
    const dailyUsed = dailyTemplateUsage.get(template.name) || 0;
    const tieBreaker = (date.getDate() + index) % 7;
    const score = employeeUsed * 10 + dailyUsed * 3 + tieBreaker;

    const range = buildRangeFromTimeStrings(date, template.start, template.end, defaultStart, defaultEnd);

    if (!best || score < best.score) {
      best = {
        template,
        score,
        startTime: range.startTime,
        endTime: range.endTime,
      };
    }
  });

  return best;
};

const generateMonthlyRoster = async ({ year, month } = {}) => {
  const now = new Date();
  const targetYear = Number.isInteger(year) ? year : now.getFullYear();
  const targetMonthIndex = Number.isInteger(month) ? month - 1 : now.getMonth();

  if (targetMonthIndex < 0 || targetMonthIndex > 11) {
    throw new Error('Invalid month value for roster generation');
  }

  const cycleKey = `${targetYear}-${pad(targetMonthIndex + 1)}`;
  const { monthStart, monthEnd } = getMonthBoundaries(targetYear, targetMonthIndex);

  const workDays = parseWorkDays();
  const defaultStart = parseTime(process.env.AUTO_ROSTER_SHIFT_START || '09:00', 9, 0);
  const defaultEnd = parseTime(process.env.AUTO_ROSTER_SHIFT_END || '17:00', 17, 0);
  const shiftTemplates = parseShiftTemplates();

  const schedulerActor = await User.findOne({
    role: { $in: ['admin', 'manager'] },
    isActive: true,
  }).select('_id');

  if (!schedulerActor) {
    logger.warn(`Monthly roster skipped for ${cycleKey}: no active admin/manager found`);
    return { cycleKey, created: 0, skipped: 0, removed: 0 };
  }

  const employees = await Employee.find({ status: 'active' })
    .populate('user', 'isActive firstName lastName')
    .select('_id user availability');

  const activeEmployees = employees.filter((e) => e.user && e.user.isActive !== false);

  const removedResult = await Shift.deleteMany({
    autoGenerated: true,
    generationCycle: cycleKey,
  });

  let created = 0;
  let skipped = 0;
  const employeeTemplateCount = new Map(
    activeEmployees.map((employee) => [employee._id.toString(), new Map()])
  );
  let workdayIndex = 0;

  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    const day = date.getDay();
    if (!workDays.includes(day)) {
      continue;
    }

    const rotatedEmployees = rotateArrayByOffset(activeEmployees, workdayIndex);
    workdayIndex += 1;
    const dailyTemplateUsage = new Map();

    for (const employee of rotatedEmployees) {
      const availabilityKey = availabilityKeyByDay[day];
      const dayAvailability = employee.availability?.[availabilityKey] || null;

      if (dayAvailability && dayAvailability.available === false) {
        skipped += 1;
        continue;
      }

      const hasAvailabilityWindow = !!(dayAvailability?.start && dayAvailability?.end);
      const availabilityWindow = hasAvailabilityWindow
        ? buildRangeFromTimeStrings(date, dayAvailability.start, dayAvailability.end, defaultStart, defaultEnd)
        : null;

      const templateCandidates = shiftTemplates.filter((template) => {
        if (!availabilityWindow) return true;
        const candidateRange = buildRangeFromTimeStrings(date, template.start, template.end, defaultStart, defaultEnd);
        return candidateRange.startTime >= availabilityWindow.startTime && candidateRange.endTime <= availabilityWindow.endTime;
      });

      const bestTemplateSelection = pickBestTemplate({
        date,
        employee,
        templateCandidates,
        employeeTemplateCount,
        dailyTemplateUsage,
        defaultStart,
        defaultEnd,
      });

      let startTime;
      let endTime;
      let chosenTemplateName;
      let chosenTemplateType;

      if (bestTemplateSelection) {
        startTime = bestTemplateSelection.startTime;
        endTime = bestTemplateSelection.endTime;
        chosenTemplateName = bestTemplateSelection.template.name;
        chosenTemplateType = bestTemplateSelection.template.type || 'regular';
      } else if (availabilityWindow) {
        startTime = availabilityWindow.startTime;
        endTime = availabilityWindow.endTime;
        chosenTemplateName = 'Availability Window';
        chosenTemplateType = 'regular';
      } else {
        skipped += 1;
        continue;
      }

      const hasConflict = await Shift.findOne({
        employee: employee._id,
        status: { $nin: ['cancelled'] },
        $or: [
          { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
          { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
          { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
        ],
      }).select('_id');

      if (hasConflict) {
        skipped += 1;
        continue;
      }

      const monthName = startTime.toLocaleString('en-US', { month: 'long' });
      await Shift.create({
        title: `${chosenTemplateName} Auto Shift`,
        description: `Automatically generated monthly roster for ${cycleKey} (${monthName})`,
        employee: employee._id,
        startTime,
        endTime,
        type: chosenTemplateType,
        status: 'scheduled',
        autoGenerated: true,
        generationCycle: cycleKey,
        notes: `Auto-generated monthly roster using intelligent rotation (${chosenTemplateName})`,
        createdBy: schedulerActor._id,
      });

      const employeeId = employee._id.toString();
      const employeeCountMap = employeeTemplateCount.get(employeeId) || new Map();
      employeeCountMap.set(chosenTemplateName, (employeeCountMap.get(chosenTemplateName) || 0) + 1);
      employeeTemplateCount.set(employeeId, employeeCountMap);
      dailyTemplateUsage.set(chosenTemplateName, (dailyTemplateUsage.get(chosenTemplateName) || 0) + 1);

      created += 1;
    }
  }

  logger.info(`Monthly roster generation completed for ${cycleKey}: created=${created}, skipped=${skipped}, removed=${removedResult.deletedCount}`);
  return {
    cycleKey,
    created,
    skipped,
    removed: removedResult.deletedCount,
  };
};

module.exports = {
  generateMonthlyRoster,
};
