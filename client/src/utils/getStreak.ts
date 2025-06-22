interface StreakData {
  streakCount: number;
  longestStreak: number;
  totalDays: number;
  lastEntryDate: string | null;
}

export async function getStreak(userId: string): Promise<StreakData> {
  try {
    const response = await fetch(`/api/user/streak?userId=${userId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch streak data');
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching streak:', error);
    return {
      streakCount: 0,
      longestStreak: 0,
      totalDays: 0,
      lastEntryDate: null
    };
  }
}

export function calculateStreakFromEntries(entries: Array<{ createdAt: string }>): StreakData {
  if (!entries || entries.length === 0) {
    return {
      streakCount: 0,
      longestStreak: 0,
      totalDays: 0,
      lastEntryDate: null
    };
  }

  // Sort entries by date (most recent first)
  const sortedEntries = entries
    .map(entry => new Date(entry.createdAt))
    .sort((a, b) => b.getTime() - a.getTime());

  // Get unique days
  const uniqueDays = new Set(
    sortedEntries.map(date => date.toDateString())
  );

  const totalDays = uniqueDays.size;
  const lastEntryDate = sortedEntries[0]?.toISOString() || null;

  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const uniqueDaysArray = Array.from(uniqueDays)
    .map(day => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if today or yesterday has an entry for current streak
  const mostRecentEntry = uniqueDaysArray[0];
  const daysSinceMostRecent = Math.floor(
    (today.getTime() - mostRecentEntry.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceMostRecent <= 1) {
    // Start counting current streak
    let checkDate = new Date(mostRecentEntry);
    
    for (let i = 0; i < uniqueDaysArray.length; i++) {
      const entryDate = uniqueDaysArray[i];
      const expectedDate = new Date(checkDate);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (entryDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak in history
  tempStreak = 1;
  for (let i = 1; i < uniqueDaysArray.length; i++) {
    const currentDate = uniqueDaysArray[i];
    const previousDate = uniqueDaysArray[i - 1];
    
    const dayDiff = Math.floor(
      (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    streakCount: currentStreak,
    longestStreak,
    totalDays,
    lastEntryDate
  };
}