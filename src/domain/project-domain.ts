import type { ProjectItem } from '@/contracts/project';

export interface ProjectStats {
  total: number;
  activeCount: number;
  completedCount: number;
  averageProgress: number;
}

export function computeProjectStats(projects: ProjectItem[]): ProjectStats {
  const total = projects.length;
  if (total === 0) {
    return { total: 0, activeCount: 0, completedCount: 0, averageProgress: 0 };
  }

  let activeCount = 0;
  let completedCount = 0;
  let progressSum = 0;

  for (const project of projects) {
    if (project.status === 'completed') {
      completedCount += 1;
    } else {
      activeCount += 1;
    }
    progressSum += project.progressPercent;
  }

  return {
    total,
    activeCount,
    completedCount,
    averageProgress: Math.round(progressSum / total),
  };
}

