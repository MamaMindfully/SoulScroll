// Tree progress engine for journal streak visualization

export function getTreeStage(daysStreak: number): string {
  if (daysStreak >= 10) return '/assets/tree/tree_stage_3.svg';
  if (daysStreak >= 3) return '/assets/tree/tree_stage_2.svg';
  return '/assets/tree/tree_stage_1.svg';
}

export function getTreeStageInfo(daysStreak: number): {
  stage: number;
  title: string;
  description: string;
  nextMilestone?: number;
} {
  if (daysStreak >= 10) {
    return {
      stage: 3,
      title: "Flourishing Tree",
      description: "Your journaling practice has grown into a mighty tree! You've built a strong foundation for self-reflection.",
    };
  }
  
  if (daysStreak >= 3) {
    return {
      stage: 2,
      title: "Growing Sapling",
      description: "Your consistency is paying off! Your journaling habit is taking root and growing stronger.",
      nextMilestone: 10,
    };
  }
  
  return {
    stage: 1,
    title: "New Seedling",
    description: "Every journey begins with a single step. Your journaling seedling is just beginning to sprout!",
    nextMilestone: 3,
  };
}

export function getTreeMessages(daysStreak: number): string[] {
  const messages = [
    "Your soul tree grows with each reflection 🌱",
    "Consistency nurtures wisdom",
    "Every entry is a leaf on your tree of growth",
    "Your thoughts are taking root",
    "Patience and practice create beautiful trees"
  ];
  
  if (daysStreak >= 10) {
    return [
      "Your tree stands tall and proud! 🌳",
      "Ten days of growth - incredible dedication!",
      "Your roots run deep with wisdom",
      "A flourishing practice creates a flourishing mind"
    ];
  }
  
  if (daysStreak >= 3) {
    return [
      "Your sapling is growing strong! 🌿",
      "Three days of commitment - you're building momentum!",
      "Your consistency is creating real growth",
      "The roots of wisdom are taking hold"
    ];
  }
  
  return messages;
}