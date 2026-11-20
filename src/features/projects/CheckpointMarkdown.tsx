import { Fragment } from 'react';
import { parseCheckpointMarkdown, type InlineToken } from '@/domain/checkpoint-markdown';
import { cn } from '@/ui/cn';
import styles from './projects.module.css';

function Inline({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((token, index) => {
    let node: React.ReactNode = token.text;
    if (token.code) node = <code className={styles.mdCode}>{node}</code>;
    if (token.italic) node = <em>{node}</em>;
    if (token.bold) node = <strong>{node}</strong>;
    return <Fragment key={index}>{node}</Fragment>;
  });
}

/** Static, formatted display of a checkpoint description. No Markdown markers are shown. */
export function CheckpointMarkdown({ value, className }: { value: string; className?: string }) {
  const blocks = parseCheckpointMarkdown(value);
  if (blocks.length === 0) return null;

  return (
    <div className={cn(styles.markdown, className)}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = (['h4', 'h5', 'h6'] as const)[block.level - 1] ?? 'h6';
          return (
            <Tag key={index} className={styles.mdHeading} data-level={block.level}>
              <Inline tokens={block.inline} />
            </Tag>
          );
        }
        if (block.type === 'bullets') {
          return (
            <ul key={index} className={styles.mdList}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline tokens={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className={styles.mdParagraph}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                <Inline tokens={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
