import fs from 'node:fs';
import path from 'node:path';
import type { ApcsCourse, ApcsDirectoryListing, ApcsFileCategory, ApcsFileItem, ApcsOverview } from '@/contracts/apcs';

function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

const APCS_ROOT = 'D:\\APCS\\University\\Year I';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

function getCategory(ext: string): ApcsFileCategory {
  const normalized = ext.toLowerCase();
  if (['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'].includes(normalized)) return 'document';
  if (['.pptx', '.ppt'].includes(normalized)) return 'presentation';
  if (['.cpp', '.h', '.c', '.py', '.js', '.ts', '.json', '.html', '.css', '.sh', '.sql'].includes(normalized)) return 'code';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(normalized)) return 'image';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(normalized)) return 'archive';
  return 'other';
}

const COURSE_METADATA: Record<string, { code: string; name: string; description: string; semester: string; tags: string[]; topics: string[] }> = {
  'Calculus I': {
    code: 'MTH251',
    name: 'Calculus I',
    description: 'Differential and integral calculus, limits, derivatives, integration techniques, and applications.',
    semester: 'Semester 1, 2025-2026',
    tags: ['Math', 'Analysis', 'Core'],
    topics: ['Limits & Continuity', 'Derivatives & Applications', 'Integrals & Techniques', 'Differential Equations'],
  },
  'CM102': {
    code: 'CM102',
    name: 'Communication & Scientific Skills',
    description: 'Technical writing, scientific presentations, research methodologies, and collaborative discourse.',
    semester: 'Semester 1, 2025-2026',
    tags: ['Soft Skills', 'Scientific Writing', 'Communication'],
    topics: ['Research Methodology', 'Technical Presentations', 'Academic Integrity', 'Observation Reports'],
  },
  'CS160': {
    code: 'CS160',
    name: 'Introduction to Computer Science',
    description: 'Foundations of computing, structured programming in C++, algorithms, data manipulation, and the Go Game project.',
    semester: 'Semester 1, 2025-2026',
    tags: ['Computer Science', 'C++', 'Programming'],
    topics: ['Algorithms & Complexity', 'C++ Memory & Pointers', 'Data Structures', 'Go Game Engine Project'],
  },
  'Exam': {
    code: 'EXAM-ARCHIVE',
    name: 'Exam Archive & Past Papers',
    description: 'Curated past midterm exams, final tests, sample questions, and solutions across all Year I courses.',
    semester: 'Year I Cumulative',
    tags: ['Exams', 'Revision', 'Archive'],
    topics: ['Midterm Preparation', 'Finals Collection', 'Practice Problem Sets', 'Rubrics'],
  },
  'Physics I': {
    code: 'PHY101',
    name: 'Physics I (Mechanics & Thermodynamics)',
    description: 'Classical mechanics, Newtonian dynamics, conservation laws, oscillatory motion, and thermodynamics.',
    semester: 'Semester 1, 2025-2026',
    tags: ['Physics', 'Mechanics', 'Thermodynamics'],
    topics: ['Kinematics & Dynamics', 'Work & Energy', 'Rotational Motion', 'Thermodynamics'],
  },
};

export class ApcsStorage {
  private rootPath: string;

  constructor(customRoot?: string) {
    this.rootPath = customRoot || APCS_ROOT;
  }

  isRootAccessible(): boolean {
    try {
      return fs.existsSync(this.rootPath) && fs.statSync(this.rootPath).isDirectory();
    } catch {
      return false;
    }
  }

  private scanFolder(dirPath: string, relativeBase: string = ''): ApcsFileItem[] {
    const results: ApcsFileItem[] = [];
    if (!fs.existsSync(dirPath)) return results;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        // Skip hidden or system folders like .vscode, .git
        if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;

        const fullEntryPath = path.join(dirPath, entry.name);
        const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;

        try {
          const stats = fs.statSync(fullEntryPath);
          const isDir = entry.isDirectory();
          const ext = isDir ? '' : path.extname(entry.name);
          const size = isDir ? 0 : stats.size;

          results.push({
            id: relPath.replace(/\\/g, '/'),
            name: entry.name,
            relativePath: relPath.replace(/\\/g, '/'),
            fullPath: fullEntryPath,
            isDirectory: isDir,
            size,
            formattedSize: isDir ? 'Folder' : formatBytes(size),
            extension: ext.toLowerCase(),
            modifiedAt: stats.mtime.toISOString(),
            category: isDir ? 'other' : getCategory(ext),
            parentPath: relativeBase ? relativeBase.replace(/\\/g, '/') : null,
          });
        } catch {
          // ignore inaccessible file
        }
      }
    } catch {
      // directory read failure
    }

    return results;
  }

  private scanAllFilesRecursive(dirPath: string, relativeBase: string = ''): ApcsFileItem[] {
    const items = this.scanFolder(dirPath, relativeBase);
    let all: ApcsFileItem[] = [];

    for (const item of items) {
      all.push(item);
      if (item.isDirectory) {
        const subItems = this.scanAllFilesRecursive(item.fullPath, item.relativePath);
        all = all.concat(subItems);
      }
    }
    return all;
  }

  getOverview(): ApcsOverview {
    if (!this.isRootAccessible()) {
      throw new Error('APCS root is missing or inaccessible');
    }

    try {
      const rootEntries = fs.readdirSync(this.rootPath, { withFileTypes: true });
      const courses: ApcsCourse[] = [];
      let totalFiles = 0;
      let totalSizeBytes = 0;
      const allFiles: ApcsFileItem[] = [];

      for (const entry of rootEntries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

        const folderPath = path.join(this.rootPath, entry.name);
        const files = this.scanAllFilesRecursive(folderPath, entry.name);
        const fileOnlyList = files.filter((f) => !f.isDirectory);

        const courseSizeBytes = fileOnlyList.reduce((acc, f) => acc + f.size, 0);
        totalFiles += fileOnlyList.length;
        totalSizeBytes += courseSizeBytes;
        allFiles.push(...fileOnlyList);

        const meta = COURSE_METADATA[entry.name] ?? {
          code: entry.name.toUpperCase().replace(/\s+/g, '-'),
          name: entry.name,
          description: `Study materials and documents for ${entry.name}.`,
          semester: 'Year I, 2025-2026',
          tags: ['Academic', 'Year I'],
          topics: ['Lectures', 'Assignments', 'Examinations'],
        };

        courses.push({
          id: entry.name.toLowerCase().replace(/\s+/g, '-'),
          code: meta.code,
          name: meta.name,
          description: meta.description,
          folderName: entry.name,
          semester: meta.semester,
          fileCount: fileOnlyList.length,
          totalSizeBytes: courseSizeBytes,
          formattedSize: formatBytes(courseSizeBytes),
          tags: meta.tags,
          topics: meta.topics,
        });
      }

      // Sort recent files by modifiedAt desc
      allFiles.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
      const recentFiles = allFiles.slice(0, 8);

      return {
        courses,
        stats: {
          totalCourses: courses.length,
          totalFiles,
          totalSizeBytes,
          formattedSize: formatBytes(totalSizeBytes),
        },
        recentFiles,
      };
    } catch {
      throw new Error('APCS root is missing or inaccessible');
    }
  }

  getDirectoryListing(subpath: string = ''): ApcsDirectoryListing {
    const cleanSub = subpath.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
    const targetDir = cleanSub ? path.join(this.rootPath, cleanSub) : this.rootPath;

    // Security check: ensure targetDir starts with rootPath
    const resolvedTarget = path.resolve(targetDir);
    const resolvedRoot = path.resolve(this.rootPath);
    if (!contained(resolvedRoot, resolvedTarget) || (fs.existsSync(resolvedTarget) && !contained(fs.realpathSync(resolvedRoot), fs.realpathSync(resolvedTarget)))) {
      throw new Error('Access denied: path outside APCS root');
    }

    if (!this.isRootAccessible()) {
      throw new Error('APCS root is missing or inaccessible');
    }

    const items = this.scanFolder(targetDir, cleanSub);
    // Sort directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    const segments = cleanSub ? cleanSub.split(/[/\\]/) : [];
    const breadcrumbs = [{ name: 'Year I Root', path: '' }];
    let accPath = '';
    for (const seg of segments) {
      accPath = accPath ? `${accPath}/${seg}` : seg;
      breadcrumbs.push({ name: seg, path: accPath });
    }

    const parentPath = segments.length > 0 ? segments.slice(0, -1).join('/') || '' : null;
    const courseId = segments.length > 0 && segments[0] ? segments[0].toLowerCase().replace(/\s+/g, '-') : null;

    return {
      currentPath: cleanSub,
      breadcrumbs,
      parentPath,
      courseId,
      items,
    };
  }

  searchFiles(query: string, courseFilter?: string, categoryFilter?: string): ApcsFileItem[] {
    if (!this.isRootAccessible()) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const all = this.scanAllFilesRecursive(this.rootPath, '');
    return all.filter((item) => {
      if (item.isDirectory) return false;
      const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.relativePath.toLowerCase().includes(q);
      const matchesCourse = !courseFilter || item.relativePath.toLowerCase().startsWith(courseFilter.toLowerCase());
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.category === categoryFilter;
      return matchesQuery && matchesCourse && matchesCategory;
    });
  }

  getFileSafe(relPath: string): { fullPath: string; fileName: string; mimeCategory: ApcsFileCategory; size: number } | null {
    const cleanSub = relPath.replace(/^[/\\]+/, '');
    const target = path.resolve(this.rootPath, cleanSub);
    const resolvedRoot = path.resolve(this.rootPath);
    if (!contained(resolvedRoot, target) || (fs.existsSync(target) && !contained(fs.realpathSync(resolvedRoot), fs.realpathSync(target)))) return null;

    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) return null;

    const stats = fs.statSync(target);
    const ext = path.extname(target);
    return {
      fullPath: target,
      fileName: path.basename(target),
      mimeCategory: getCategory(ext),
      size: stats.size,
    };
  }

  getFileBuffer(relPath: string): { buffer: Buffer; fileName: string; mimeType: string } | null {
    const info = this.getFileSafe(relPath);
    if (!info) return null;

    const ext = path.extname(info.fileName).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.txt' || ext === '.md') mimeType = 'text/plain; charset=utf-8';
    else if (ext === '.cpp' || ext === '.c' || ext === '.h') mimeType = 'text/plain; charset=utf-8';
    else if (ext === '.py' || ext === '.js' || ext === '.ts' || ext === '.json') mimeType = 'text/plain; charset=utf-8';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    const buffer = fs.readFileSync(info.fullPath);
    return { buffer, fileName: info.fileName, mimeType };
  }


}

export const apcsStorage = new ApcsStorage();
