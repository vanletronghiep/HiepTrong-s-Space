import type { ApcsDirectoryListing, ApcsFileItem, ApcsOverview } from '@/contracts/apcs';
import { apcsStorage } from '@/services/storage/apcs-storage';

export class ApcsService {
  getOverview(): ApcsOverview {
    return apcsStorage.getOverview();
  }

  getDirectory(subpath: string = ''): ApcsDirectoryListing {
    return apcsStorage.getDirectoryListing(subpath);
  }

  searchFiles(query: string, courseFilter?: string, categoryFilter?: string): ApcsFileItem[] {
    return apcsStorage.searchFiles(query, courseFilter, categoryFilter);
  }

  getFileSafe(relPath: string) {
    return apcsStorage.getFileSafe(relPath);
  }

  getFileBuffer(relPath: string) {
    return apcsStorage.getFileBuffer(relPath);
  }
}

export const apcsService = new ApcsService();
