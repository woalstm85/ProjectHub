import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export interface WeekBlock {
    weekNumber: number;
    isActive: boolean;
    label: string;
}

export interface MonthTimeline {
    month: string; // "YYYY.MM"
    weeks: WeekBlock[];
}

/**
 * Get the week number of the month for a given date.
 * 1st week, 2nd week, etc.
 */
export const getWeekOfMonth = (date: Date): number => {
    const d = dayjs(date);
    const firstDayOfMonth = d.startOf('month');
    const firstDayWeek = firstDayOfMonth.week();
    const currentWeek = d.week();

    // Handle year crossover (e.g. Dec to Jan)
    if (currentWeek < firstDayWeek && currentWeek < 5) {
        // This is likely a new year week, need more complex logic or simple approximation
        // For simplicity in this context, let's use a simple math approach based on date
        return Math.ceil((d.date() + firstDayOfMonth.day()) / 7);
    }

    return currentWeek - firstDayWeek + 1;
};

/**
 * Generate timeline data for a project range.
 * Returns start month and end month data.
 */
export const getProjectTimeline = (startDate: Date, endDate: Date): { start: MonthTimeline, end: MonthTimeline } => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const generateMonthWeeks = (targetDate: dayjs.Dayjs, isStart: boolean): MonthTimeline => {
        const monthStr = targetDate.format('M월');
        const weeks: WeekBlock[] = [];
        const lastDay = targetDate.endOf('month').date();

        // Simple 4-5 weeks approximation or exact calculation
        // Let's assume max 5 weeks for visualization consistency
        for (let i = 1; i <= 5; i++) {
            let isActive = false;

            // Calculate approximate date range for this week
            // This is a visual approximation. 
            // Week 1: 1-7, Week 2: 8-14, etc.
            const weekStartDay = (i - 1) * 7 + 1;
            const weekEndDay = Math.min(i * 7, lastDay);

            if (weekStartDay > lastDay) {
                // Week doesn't exist in this month
                weeks.push({ weekNumber: i, isActive: false, label: '' });
                continue;
            }

            const weekStartDate = targetDate.date(weekStartDay);
            const weekEndDate = targetDate.date(weekEndDay);

            if (isStart) {
                // For start month: active if week end date >= project start date
                // And obviously week start date <= project end date (which is true if start month == end month)
                if (weekEndDate.isAfter(start.subtract(1, 'day'))) {
                    isActive = true;
                }
                // Special case: if start month is same as end month
                if (start.isSame(end, 'month')) {
                    if (weekStartDate.isAfter(end)) {
                        isActive = false;
                    }
                }
            } else {
                // For end month: active if week start date <= project end date
                if (weekStartDate.isBefore(end.add(1, 'day'))) {
                    isActive = true;
                }
            }

            weeks.push({ weekNumber: i, isActive, label: `${i}` });
        }

        return { month: monthStr, weeks };
    };

    return {
        start: generateMonthWeeks(start, true),
        end: generateMonthWeeks(end, false),
    };
};
