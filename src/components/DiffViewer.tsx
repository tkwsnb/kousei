import React, { useMemo } from 'react';
import { Correction } from '../lib/kousei';

interface DiffViewerProps {
  originalText: string;
  corrections: Correction[];
  activeIds: Set<string>;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ originalText, corrections, activeIds }) => {
  const elements = useMemo(() => {
    if (!originalText) {
      return <span>テキストを入力して「チェックする」を押してください。</span>;
    }

    const nodes: React.ReactNode[] = [];
    let currentIndex = 0;

    const activeCorrections = corrections
      .filter((c) => activeIds.has(c.id))
      .sort((a, b) => a.index - b.index);

    for (const c of activeCorrections) {
      if (c.index > currentIndex) {
        nodes.push(<span key={`text-${currentIndex}`}>{originalText.slice(currentIndex, c.index)}</span>);
      }

      nodes.push(
        <span key={`diff-${c.id}`} className="diff-add" title={c.reason}>
          {c.proposed}
        </span>
      );

      currentIndex = c.index + c.length;
    }

    if (currentIndex < originalText.length) {
      nodes.push(<span key={`text-${currentIndex}`}>{originalText.slice(currentIndex)}</span>);
    }

    return nodes;
  }, [originalText, corrections, activeIds]);

  return <div className="preview-text">{elements}</div>;
};
