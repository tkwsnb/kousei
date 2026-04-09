import React, { useMemo } from 'react';
import type { Correction } from '../lib/kousei';

interface DiffViewerProps {
  originalText: string;
  corrections: Correction[];
  activeIds: Set<string>;
}

/**
 * 校正プレビュー: 原文の中で修正箇所を赤字ハイライトして表示する
 *
 * 修正の種類:
 * - length > 0 : 原文の一部を proposed で「置換」する
 * - length === 0 : 原文の特定位置に proposed を「挿入」する
 *
 * 重複はanalyzeText側で排除済みなので、ここでは単純に処理する
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({ originalText, corrections, activeIds }) => {
  const elements = useMemo(() => {
    if (!originalText) {
      return <span>テキストを入力して「チェックする」を押してください。</span>;
    }

    const nodes: React.ReactNode[] = [];
    let cursor = 0; // 原文上の現在位置

    // アクティブな修正を index 昇順でソート
    const active = corrections
      .filter((c) => activeIds.has(c.id))
      .sort((a, b) => a.index - b.index);

    for (const c of active) {
      // 修正箇所の開始位置がカーソルより前ならスキップ（重複排除漏れ対策）
      if (c.index < cursor) continue;

      // 修正箇所の前の通常テキストを出力
      if (c.index > cursor) {
        nodes.push(
          <span key={`t-${cursor}`}>{originalText.slice(cursor, c.index)}</span>
        );
      }

      if (c.length === 0) {
        // 挿入型: 原文はそのままで、proposed を赤字で差し込む
        nodes.push(
          <span key={`ins-${c.id}`} className="diff-add" title={c.reason}>
            {c.proposed}
          </span>
        );
        // カーソルは進めない（原文の文字を消費していない）
      } else {
        // 置換型: 原文の該当部分を proposed で置き換えて赤字表示
        nodes.push(
          <span key={`rep-${c.id}`} className="diff-add" title={c.reason}>
            {c.proposed}
          </span>
        );
        cursor = c.index + c.length;
      }
    }

    // 残りの通常テキスト
    if (cursor < originalText.length) {
      nodes.push(
        <span key={`t-${cursor}`}>{originalText.slice(cursor)}</span>
      );
    }

    return nodes;
  }, [originalText, corrections, activeIds]);

  return <div className="preview-text">{elements}</div>;
};
