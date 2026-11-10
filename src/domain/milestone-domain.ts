import type { MilestoneItem } from '@/contracts/milestone';

export function computeLandmarkProgress(milestone: MilestoneItem): number {
  if (!milestone.landmarks || milestone.landmarks.length === 0) {
    return milestone.status === 'achieved' ? 100 : 0;
  }
  const completed = milestone.landmarks.filter((l) => l.completed).length;
  return Math.round((completed / milestone.landmarks.length) * 100);
}

