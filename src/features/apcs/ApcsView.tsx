'use client';

import { usePageReady } from '@/features/transitions/TransitionProvider';
import React, { useId, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Folder,
  Presentation,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useApcsDirectory, useApcsOverview, useApcsSearch } from '@/client/queries/apcs';
import type { ApcsCourse, ApcsFileCategory, ApcsFileItem } from '@/contracts/apcs';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { Skeleton } from '@/ui/Skeleton';
import styles from './apcs.module.css';

const CATEGORIES: { label: string; value: ApcsFileCategory | 'all' }[] = [
  { label: 'All files', value: 'all' },
  { label: 'Documents', value: 'document' },
  { label: 'Presentations', value: 'presentation' },
  { label: 'Code', value: 'code' },
  { label: 'Images', value: 'image' },
  { label: 'Archives', value: 'archive' },
];

function formatApcsDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function formatApcsDateTime(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function renderFileCategoryIcon(item: ApcsFileItem) {
  if (item.isDirectory) {
    return <Folder size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />;
  }
  switch (item.category) {
    case 'presentation':
      return (
        <Presentation size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />
      );
    case 'code':
      return (
        <FileCode2 size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />
      );
    case 'image':
      return (
        <FileImage size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />
      );
    case 'archive':
      return (
        <FileArchive size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />
      );
    default:
      return (
        <FileText size={18} strokeWidth={1.5} className={styles.fileIcon} aria-hidden="true" />
      );
  }
}

export function ApcsView() {
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ApcsFileCategory | 'all'>('all');
  const [previewFile, setPreviewFile] = useState<ApcsFileItem | null>(null);

  const searchInputId = useId();

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: overviewFailed,
    refetch: retryOverview,
  } = useApcsOverview();
  usePageReady(!isOverviewLoading);
  const {
    data: directory,
    isLoading: isDirLoading,
    isError: directoryFailed,
    refetch: retryDirectory,
  } = useApcsDirectory(currentPath);
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isError: searchFailed,
    refetch: retrySearch,
  } = useApcsSearch(
    searchQuery,
    activeCourseId ? activeCourseId : undefined,
    selectedCategory !== 'all' ? selectedCategory : undefined,
  );

  const handleSelectCourse = (course: ApcsCourse) => {
    setActiveCourseId(course.folderName);
    setCurrentPath(course.folderName);
  };

  const handleNavigatePath = (path: string) => {
    setCurrentPath(path);
    if (!path) {
      setActiveCourseId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveCourseId(null);
    setCurrentPath('');
  };

  const isSearching = searchQuery.trim().length > 0 || selectedCategory !== 'all';
  const displayedItems = isSearching ? (searchResults ?? []) : (directory?.items ?? []);
  const activeCourse = overview?.courses.find((course) => course.folderName === activeCourseId);
  const recentFiles = overview?.recentFiles ?? [];
  const folderCount = displayedItems.filter((item) => item.isDirectory).length;
  const fileCount = displayedItems.length - folderCount;
  const explorerFailed = isSearching ? searchFailed : directoryFailed;

  const handleRetry = () => {
    if (overviewFailed) void retryOverview();
    if (isSearching && searchFailed) void retrySearch();
    if (!isSearching && directoryFailed) void retryDirectory();
  };

  return (
    <div className={styles.pageStack}>
      {/* Unboxed Winter Library Masthead */}
      <header data-feature-heading className={styles.masthead} aria-labelledby="apcs-page-heading">
        <Image
          src="/visuals/apcs-hub/glacier-shelf.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.mastheadArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Compass size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>University archive · Year I</span>
          </div>

          <h1 id="apcs-page-heading" className={styles.displayTitle}>
            APCS <span className={styles.displayTitleEmphasis}>Hub</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Curated course materials, lecture slides, assignments, and exam archives from Year I of
            the APCS program. Files are indexed directly from your local study archive.
          </p>
        </div>

        {isOverviewLoading ? (
          <div className={styles.statsRow} aria-label="Loading archive summary">
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
          </div>
        ) : (
          <div className={styles.statsRow} aria-label="Archive summary">
            <div className={styles.statCard}>
              <div className={styles.statValue}>{overview?.stats.totalCourses ?? 0}</div>
              <div className={styles.statLabel}>Core subjects</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{overview?.stats.totalFiles ?? 0}</div>
              <div className={styles.statLabel}>Files indexed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{overview?.stats.formattedSize ?? '0 MB'}</div>
              <div className={styles.statLabel}>Archive size</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>Year I</div>
              <div className={styles.statLabel}>Current curriculum</div>
            </div>
          </div>
        )}
      </header>

      {overviewFailed ? (
        <section className={styles.sectionBlock} aria-label="Archive load failure">
          <div role="alert" className={styles.alertBanner}>
            <span className={styles.alertMessageGroup}>
              <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>Could not access study materials from the local archive.</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />}
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
          <EmptyState
            title="Study archive unavailable"
            description="Check that your local APCS Year I folder is accessible, then retry."
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            }
          />
        </section>
      ) : (
        <>
          {/* Academic Courses Shelf */}
          <section aria-labelledby="courses-heading" className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 id="courses-heading" className={styles.sectionTitle}>
                Academic courses
              </h2>
              <span className={styles.sectionTally}>
                {overview?.courses.length ?? 0}{' '}
                {(overview?.courses.length ?? 0) === 1 ? 'course' : 'courses'}
              </span>
            </div>

            {isOverviewLoading ? (
              <div className={styles.coursesGrid} aria-label="Loading academic curriculum">
                <Skeleton className="h-52 w-full rounded-card" />
                <Skeleton className="h-52 w-full rounded-card" />
                <Skeleton className="h-52 w-full rounded-card" />
              </div>
            ) : (
              <div className={styles.coursesGrid}>
                {overview?.courses.map((course) => {
                  const isSelected = activeCourseId === course.folderName;
                  return (
                    <article
                      key={course.id}
                      className={cn(styles.courseCard, isSelected && styles.courseCardActive)}
                    >
                      <div className={styles.courseTop}>
                        <div className={styles.courseHeaderLine}>
                          <span className={styles.courseCode}>{course.code}</span>
                          <span className={styles.courseSemester}>{course.semester}</span>
                        </div>
                        <h3 className={styles.courseName}>{course.name}</h3>
                        <p className={styles.courseDesc}>{course.description}</p>
                        <div className={styles.courseTags}>
                          {course.topics.slice(0, 3).map((topic) => (
                            <span key={topic} className={styles.tagPill}>
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.courseFooter}>
                        <div className={styles.courseStats}>
                          {course.fileCount} files · {course.formattedSize}
                        </div>
                        <Button
                          variant={isSelected ? 'primary' : 'secondary'}
                          size="sm"
                          aria-pressed={isSelected}
                          aria-label={`Browse materials for ${course.name}`}
                          rightIcon={
                            <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />
                          }
                          onClick={() => handleSelectCourse(course)}
                        >
                          {isSelected ? 'Viewing' : 'Browse folder'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Materials Strip (when present) */}
          {!isOverviewLoading && recentFiles.length > 0 ? (
            <section aria-labelledby="recent-files-heading" className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h2 id="recent-files-heading" className={styles.sectionTitle}>
                  Recent materials
                </h2>
                <span className={styles.sectionTally}>
                  {recentFiles.length} {recentFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              <div className={styles.recentGrid}>
                {recentFiles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.recentCard}
                    onClick={() => setPreviewFile(item)}
                  >
                    <span className={styles.recentCardTop}>
                      <span className={styles.recentCardIcon}>{renderFileCategoryIcon(item)}</span>
                      <span className={styles.recentCardName}>{item.name}</span>
                    </span>
                    <span className={styles.recentCardMeta}>
                      {item.formattedSize} · {formatApcsDate(item.modifiedAt)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* Aurora Silk Horizontal Divider */}
          <div className={styles.auroraDivider} aria-hidden="true">
            <Image
              src="/visuals/apcs-hub/aurora-silk.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.auroraDividerArt}
            />
          </div>

          {/* Study Materials Explorer */}
          <section aria-labelledby="browser-heading" className={styles.explorerCard}>
            <Image
              src="/visuals/apcs-hub/ice-window-frame.svg"
              alt=""
              aria-hidden="true"
              width={400}
              height={300}
              unoptimized
              className={styles.explorerFrameArt}
            />
            <Image
              src="/visuals/apcs-hub/frost-fern.svg"
              alt=""
              aria-hidden="true"
              width={240}
              height={240}
              unoptimized
              className={styles.explorerFernArt}
            />

            <div className={styles.explorerHeader}>
              <h2 id="browser-heading" className={styles.sectionTitle}>
                Study materials explorer
              </h2>
              <span className={styles.sectionTally}>
                {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Search & Category Filter Controls */}
            <div className={styles.browserControls}>
              <div className={styles.searchWrapper}>
                <label htmlFor={searchInputId} className="sr-only">
                  Search study files
                </label>
                <Search
                  size={16}
                  strokeWidth={1.5}
                  className={styles.searchIcon}
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search documents, slides, exams, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.categoryFilter} role="group" aria-label="Filter by file type">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.value;
                  return (
                    <Chip
                      key={cat.value}
                      active={active}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(styles.filterChip, !active && styles.filterChipInactive)}
                    >
                      {cat.label}
                    </Chip>
                  );
                })}
              </div>
            </div>

            {activeCourse ? (
              <div className={styles.scopeBar}>
                <span className={styles.scopeLabel}>
                  Scoped to {activeCourse.code} · {activeCourse.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<X size={14} strokeWidth={1.5} aria-hidden="true" />}
                  onClick={() => handleNavigatePath('')}
                >
                  Show all courses
                </Button>
              </div>
            ) : null}

            <div className={styles.explorerSplit}>
              <div className={styles.explorerMain}>
                {/* Directory Breadcrumbs (when browsing folders) */}
                {!isSearching ? (
                  <nav className={styles.breadcrumbsBar} aria-label="Folder breadcrumbs">
                    {directory?.breadcrumbs.map((crumb, idx) => {
                      const isLast = idx === directory.breadcrumbs.length - 1;
                      return (
                        <React.Fragment key={crumb.path || 'root'}>
                          {idx > 0 ? (
                            <span className={styles.breadcrumbDivider} aria-hidden="true">
                              <ChevronRight size={12} strokeWidth={1.5} />
                            </span>
                          ) : null}
                          {isLast ? (
                            <span className={styles.breadcrumbCurrent} aria-current="page">
                              {crumb.name}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={styles.breadcrumbBtn}
                              onClick={() => handleNavigatePath(crumb.path)}
                            >
                              {crumb.name}
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </nav>
                ) : null}

                {explorerFailed ? (
                  <div role="alert" className={styles.alertBanner}>
                    <span className={styles.alertMessageGroup}>
                      <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
                      <span>Could not access study materials for this view.</span>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />}
                      onClick={handleRetry}
                    >
                      Retry
                    </Button>
                  </div>
                ) : isDirLoading || isSearchLoading ? (
                  <div className={styles.skeletonList} aria-label="Loading study materials">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : displayedItems.length === 0 ? (
                  <EmptyState
                    title={
                      isSearching
                        ? 'No study materials match your search criteria.'
                        : 'This folder is empty.'
                    }
                    description={
                      isSearching
                        ? 'Try another search term or clear your active filters.'
                        : 'Use the breadcrumbs to return to your course materials.'
                    }
                    action={
                      isSearching ? (
                        <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                          Clear filters
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.fileTable}>
                      <thead>
                        <tr>
                          <th scope="col" className={styles.tableHeader}>
                            Name
                          </th>
                          <th scope="col" className={styles.tableHeader}>
                            Size
                          </th>
                          <th scope="col" className={styles.tableHeader}>
                            Last modified
                          </th>
                          <th
                            scope="col"
                            className={cn(styles.tableHeader, styles.tableHeaderActions)}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {!isSearching &&
                        directory?.parentPath !== null &&
                        directory?.parentPath !== undefined ? (
                          <tr className={styles.fileRow}>
                            <td className={styles.fileCell} colSpan={4}>
                              <button
                                type="button"
                                className={cn(styles.fileNameBtn, styles.parentDirBtn)}
                                onClick={() => handleNavigatePath(directory.parentPath ?? '')}
                              >
                                <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                                <span>.. (Parent directory)</span>
                              </button>
                            </td>
                          </tr>
                        ) : null}

                        {displayedItems.map((item) => (
                          <tr key={item.id} className={styles.fileRow}>
                            <td className={styles.fileCell}>
                              <div className={styles.fileItemContent}>
                                {renderFileCategoryIcon(item)}

                                {item.isDirectory ? (
                                  <button
                                    type="button"
                                    className={styles.fileNameBtn}
                                    onClick={() => handleNavigatePath(item.relativePath)}
                                  >
                                    {item.name}
                                  </button>
                                ) : (
                                  <span className={styles.fileNameCluster}>
                                    <button
                                      type="button"
                                      className={styles.fileNameBtn}
                                      onClick={() => setPreviewFile(item)}
                                    >
                                      {item.name}
                                    </button>
                                    {item.extension ? (
                                      <span className={styles.fileBadge}>
                                        {item.extension.replace('.', '')}
                                      </span>
                                    ) : null}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className={cn(styles.fileCell, styles.fileMetaNum)}>
                              {item.formattedSize}
                            </td>
                            <td className={cn(styles.fileCell, styles.fileMetaNum)}>
                              {formatApcsDate(item.modifiedAt)}
                            </td>

                            <td className={styles.fileCell}>
                              <div className={styles.fileActionGroup}>
                                {item.isDirectory ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleNavigatePath(item.relativePath)}
                                  >
                                    Open folder
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setPreviewFile(item)}
                                    >
                                      Details
                                    </Button>
                                    <a
                                      href={`/api/apcs/file?path=${encodeURIComponent(item.relativePath)}&download=true`}
                                      className={cn(styles.actionBtn, styles.actionBtnPrimary)}
                                      download
                                    >
                                      <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                                      <span>Download</span>
                                    </a>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Split-View Active Shelf Context Folio */}
              <aside className={styles.shelfPanel} aria-label="Current archive shelf">
                <span className={styles.shelfEyebrow}>
                  {isSearching ? 'Search scope' : 'Active shelf'}
                </span>
                <h3 className={styles.shelfHeading}>
                  {activeCourse ? activeCourse.name : 'Year I Archive'}
                </h3>
                <p className={styles.shelfDesc}>
                  {activeCourse
                    ? activeCourse.description
                    : 'Select a course above or open any folder in the table to inspect materials and open file previews.'}
                </p>

                <div className={styles.shelfCounts}>
                  <div className={styles.shelfCountCell}>
                    <div className={styles.shelfCountValue}>{folderCount}</div>
                    <div className={styles.shelfCountLabel}>Folders</div>
                  </div>
                  <div className={styles.shelfCountCell}>
                    <div className={styles.shelfCountValue}>{fileCount}</div>
                    <div className={styles.shelfCountLabel}>Files</div>
                  </div>
                </div>

                {activeCourse && activeCourse.topics.length > 0 ? (
                  <div className={styles.courseTags}>
                    {activeCourse.topics.map((topic) => (
                      <span key={topic} className={styles.tagPill}>
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        </>
      )}

      {/* File Preview & Details Dialog */}
      {previewFile ? (
        <Dialog
          open
          portal
          title={previewFile.name}
          className="max-w-2xl max-h-[90svh] overflow-y-auto"
          onClose={() => setPreviewFile(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
              <a
                href={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}&download=true`}
                className={cn(styles.actionBtn, styles.actionBtnPrimary)}
                download
              >
                <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                <span>Download file</span>
              </a>
            </>
          }
        >
          <div className={styles.modalMetaList}>
            <div className={styles.modalMetaRow}>
              <span className={styles.modalMetaLabel}>Location</span>
              <span className={styles.modalMetaValue}>{previewFile.relativePath}</span>
            </div>
            <div className={styles.modalMetaRow}>
              <span className={styles.modalMetaLabel}>File category</span>
              <span className={cn(styles.modalMetaValue, styles.modalCategory)}>
                {previewFile.category}
              </span>
            </div>
            <div className={styles.modalMetaRow}>
              <span className={styles.modalMetaLabel}>File size</span>
              <span className={styles.modalMetaValue}>{previewFile.formattedSize}</span>
            </div>
            <div className={styles.modalMetaRow}>
              <span className={styles.modalMetaLabel}>Last modified</span>
              <span className={styles.modalMetaValue}>
                {formatApcsDateTime(previewFile.modifiedAt)}
              </span>
            </div>

            {previewFile.category === 'image' ? (
              <div className={styles.imagePreviewBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}`}
                  alt={previewFile.name}
                  className={styles.imagePreview}
                />
              </div>
            ) : null}

            {previewFile.category === 'document' && previewFile.extension === '.pdf' ? (
              <div className={styles.pdfPreviewBox}>
                <p className={styles.pdfHint}>
                  You can view this PDF in a dedicated tab or download it directly to your study
                  device.
                </p>
                <a
                  href={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(styles.actionBtn, styles.actionBtnPrimary)}
                >
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  <span>Open PDF in new tab</span>
                </a>
              </div>
            ) : null}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
