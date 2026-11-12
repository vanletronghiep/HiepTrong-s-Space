'use client';

import { Dialog } from '@/ui/Dialog';

import React, { useState, useId } from 'react';
import type { ApcsCourse, ApcsFileCategory, ApcsFileItem } from '@/contracts/apcs';
import { useApcsDirectory, useApcsOverview, useApcsSearch } from '@/client/queries/apcs';
import styles from './apcs.module.css';

const CATEGORIES: { label: string; value: ApcsFileCategory | 'all' }[] = [
  { label: 'All files', value: 'all' },
  { label: 'Documents', value: 'document' },
  { label: 'Presentations', value: 'presentation' },
  { label: 'Code', value: 'code' },
  { label: 'Images', value: 'image' },
  { label: 'Archives', value: 'archive' },
];

export function ApcsView() {
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ApcsFileCategory | 'all'>('all');
  const [previewFile, setPreviewFile] = useState<ApcsFileItem | null>(null);

  const searchInputId = useId();

  // Queries
  const { data: overview, isLoading: isOverviewLoading, isError: overviewFailed, refetch: retryOverview } = useApcsOverview();
  const { data: directory, isLoading: isDirLoading, isError: directoryFailed, refetch: retryDirectory } = useApcsDirectory(currentPath);
  const { data: searchResults, isLoading: isSearchLoading, isError: searchFailed, refetch: retrySearch } = useApcsSearch(
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

  const isSearching = searchQuery.trim().length > 0 || selectedCategory !== 'all';
  const displayedItems = isSearching ? searchResults ?? [] : directory?.items ?? [];

  if (overviewFailed || directoryFailed || searchFailed) return <div role="alert">Could not access study materials. <button type="button" onClick={() => { void retryOverview(); void retryDirectory(); void retrySearch(); }}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {/* Sea & Sky Header with restrained wave curve */}
      <header className={styles.header}>
        <svg
          className={styles.headerBgWaves}
          viewBox="0 0 400 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0 60 C80 90, 160 30, 240 65 C320 100, 370 40, 400 70 L400 150 L0 150 Z"
            fill="currentColor"
            opacity="0.12"
          />
          <path
            d="M0 90 C70 120, 170 70, 250 95 C330 120, 360 85, 400 105 L400 150 L0 150 Z"
            fill="currentColor"
            opacity="0.18"
          />
        </svg>

        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            <svg
              className={styles.eyebrowIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span>University archive · Year I</span>
          </div>

          <h1 className={styles.title}>APCS Hub</h1>
          <p className={styles.description}>
            Curated course materials, lecture slides, assignments, and exam archives from Year I of the APCS program.
            Files are indexed directly from your local study archive.
          </p>

          <div className={styles.statsRow}>
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
        </div>
      </header>

      {/* Courses Overview Cards */}
      <section aria-labelledby="courses-heading">
        <div className={styles.sectionHeader}>
          <h2 id="courses-heading" className={styles.sectionTitle}>
            Academic courses
          </h2>
        </div>

        {isOverviewLoading ? (
          <div className={styles.emptyNotice}>Loading academic curriculum...</div>
        ) : (
          <div className={styles.coursesGrid}>
            {overview?.courses.map((course) => {
              const isSelected = activeCourseId === course.folderName;
              return (
                <article key={course.id} className={styles.courseCard}>
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
                    <button
                      type="button"
                      className={styles.browseBtn}
                      onClick={() => handleSelectCourse(course)}
                      aria-label={`Browse materials for ${course.name}`}
                    >
                      <span>{isSelected ? 'Viewing' : 'Browse folder'}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* File Explorer & Browser */}
      <section aria-labelledby="browser-heading" className={styles.browserCard}>
        <div className={styles.sectionHeader}>
          <h2 id="browser-heading" className={styles.sectionTitle}>
            Study materials explorer
          </h2>
        </div>

        {/* Search & Filter Controls */}
        <div className={styles.browserControls}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id={searchInputId}
              type="search"
              className={styles.searchInput}
              placeholder="Search documents, slides, exams, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search study files"
            />
          </div>

          <div className={styles.categoryFilter} role="radiogroup" aria-label="Filter by file type">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.filterChip} ${selectedCategory === cat.value ? styles.filterChipActive : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
                role="radio"
                aria-checked={selectedCategory === cat.value}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Breadcrumbs (when not in search mode) */}
        {!isSearching && (
          <nav className={styles.breadcrumbsBar} aria-label="Folder breadcrumbs">
            {directory?.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === (directory.breadcrumbs.length - 1);
              return (
                <React.Fragment key={crumb.path || 'root'}>
                  {idx > 0 && <span className={styles.breadcrumbDivider}>/</span>}
                  {isLast ? (
                    <span className={styles.breadcrumbCurrent}>{crumb.name}</span>
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
        )}

        {/* Files & Folders Listing */}
        {isDirLoading || isSearchLoading ? (
          <div className={styles.emptyNotice}>Loading files...</div>
        ) : displayedItems.length === 0 ? (
          <div className={styles.emptyNotice}>
            {isSearching ? 'No study materials match your search criteria.' : 'This folder is empty.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.fileTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Name</th>
                  <th className={styles.tableHeader}>Size</th>
                  <th className={styles.tableHeader}>Last modified</th>
                  <th className={styles.tableHeader} style={{ textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Back row if inside a subfolder */}
                {!isSearching && directory?.parentPath !== null && directory?.parentPath !== undefined && (
                  <tr className={styles.fileRow}>
                    <td className={styles.fileCell} colSpan={4}>
                      <button
                        type="button"
                        className={styles.fileNameBtn}
                        onClick={() => handleNavigatePath(directory.parentPath ?? '')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>.. (Parent directory)</span>
                      </button>
                    </td>
                  </tr>
                )}

                {displayedItems.map((item) => (
                  <tr key={item.id} className={styles.fileRow}>
                    <td className={styles.fileCell}>
                      <div className={styles.fileItemContent}>
                        {item.isDirectory ? (
                          <svg
                            className={styles.fileIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        ) : (
                          <svg
                            className={styles.fileIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}

                        {item.isDirectory ? (
                          <button
                            type="button"
                            className={styles.fileNameBtn}
                            onClick={() => handleNavigatePath(item.relativePath)}
                          >
                            {item.name}
                          </button>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              className={styles.fileNameBtn}
                              onClick={() => setPreviewFile(item)}
                            >
                              {item.name}
                            </button>
                            {item.extension && (
                              <span className={styles.fileBadge}>{item.extension.replace('.', '')}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={styles.fileCell}>{item.formattedSize}</td>
                    <td className={styles.fileCell}>
                      {new Date(item.modifiedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className={styles.fileCell}>
                      <div className={styles.fileActionGroup}>
                        {item.isDirectory ? (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleNavigatePath(item.relativePath)}
                          >
                            Open folder
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => setPreviewFile(item)}
                            >
                              Details
                            </button>
                            <a
                              href={`/api/apcs/file?path=${encodeURIComponent(item.relativePath)}&download=true`}
                              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                              download
                            >
                              Download
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
      </section>

      {/* File Preview & Details Dialog */}
      {previewFile && (
        <Dialog open portal title={previewFile.name} className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setPreviewFile(null)}>
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewFile(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong>Location: </strong>
                  <code>{previewFile.relativePath}</code>
                </div>
                <div>
                  <strong>File category: </strong>
                  <span style={{ textTransform: 'capitalize' }}>{previewFile.category}</span>
                </div>
                <div>
                  <strong>File size: </strong>
                  <span>{previewFile.formattedSize}</span>
                </div>
                <div>
                  <strong>Last modified: </strong>
                  <span>{new Date(previewFile.modifiedAt).toLocaleString()}</span>
                </div>

                {previewFile.category === 'image' && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}`}
                      alt={previewFile.name}
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {previewFile.category === 'document' && previewFile.extension === '.pdf' && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--ws-text-muted)' }}>
                      You can view this PDF in a dedicated tab or download it directly to your study device.
                    </p>
                    <a
                      href={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setPreviewFile(null)}
              >
                Close
              </button>
              <a
                href={`/api/apcs/file?path=${encodeURIComponent(previewFile.relativePath)}&download=true`}
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                download
              >
                Download file
              </a>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
