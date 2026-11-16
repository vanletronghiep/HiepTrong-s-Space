'use client';

import { Fragment } from 'react';
import { parseNoteDocument, type NoteTextSegment } from '@/domain/note-format';
import { cn } from './cn';

export interface FormattedNoteContentProps {
  value: string | null | undefined;
  className?: string;
  emptyFallback?: string;
}

function renderSegments(segments: NoteTextSegment[]) {
  return segments.map((segment, index) =>
    segment.bold ? (
      <strong key={index} className="font-semibold text-ws-text">
        {segment.text}
      </strong>
    ) : (
      <Fragment key={index}>{segment.text}</Fragment>
    ),
  );
}

/**
 * Safely renders restricted Markdown (`**bold**` and `- ` bullet lists) into
 * semantic React elements without interpreting raw HTML or unsafe markup.
 */
export function FormattedNoteContent({
  value,
  className,
  emptyFallback,
}: FormattedNoteContentProps) {
  const source = value ?? '';
  const document = parseNoteDocument(source);

  if (document.blocks.length === 0) {
    if (!emptyFallback) {
      return null;
    }
    return (
      <p className={cn('text-[length:var(--fs-small)] text-ws-text-muted italic', className)}>
        {emptyFallback}
      </p>
    );
  }

  return (
    <div
      className={cn(
        'space-y-2 text-[length:var(--fs-small)] leading-[var(--lh-body)] text-ws-text break-words',
        className,
      )}
    >
      {document.blocks.map((block, blockIndex) => {
        if (block.type === 'paragraph') {
          return (
            <p key={blockIndex} className="m-0">
              {block.lines.map((segments, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 ? <br /> : null}
                  {renderSegments(segments)}
                </Fragment>
              ))}
            </p>
          );
        }

        return (
          <ul key={blockIndex} className="m-0 list-disc pl-5 space-y-1">
            {block.items.map((itemLines, itemIndex) => (
              <li key={itemIndex}>
                {itemLines.map((segments, lineIndex) => (
                  <Fragment key={lineIndex}>
                    {lineIndex > 0 ? <br /> : null}
                    {renderSegments(segments)}
                  </Fragment>
                ))}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
