import React from 'react';
import type { Correction } from '../lib/kousei';

interface Props {
  corrections: Correction[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (active: boolean) => void;
}

/**
 * 修正提案リスト: 検出された校正候補を一覧表示し、
 * チェックボックスで個別に適用/除外を切り替えられる
 */
export const CorrectionList: React.FC<Props> = ({ corrections, activeIds, onToggle, onToggleAll }) => {
  if (corrections.length === 0) return null;

  return (
    <div className="correction-list">
      <h3>【修正提案リスト】</h3>
      <div className="correction-actions">
        <button onClick={() => onToggleAll(true)}>すべて適用</button>
        <button onClick={() => onToggleAll(false)}>すべて解除</button>
      </div>
      <table className="correction-table">
        <thead>
          <tr>
            <th className="col-toggle">適用</th>
            <th className="col-before">修正前</th>
            <th className="col-after">修正後</th>
            <th>理由</th>
          </tr>
        </thead>
        <tbody>
          {corrections.map((c) => (
            <tr key={c.id}>
              <td className="cell-center">
                <input
                  type="checkbox"
                  checked={activeIds.has(c.id)}
                  onChange={() => onToggle(c.id)}
                />
              </td>
              <td>
                <code>{c.original ? c.original.replace(/\n/g, '↵\n') : '（なし）'}</code>
              </td>
              <td>
                <code className="diff-add">{c.proposed.replace(/\n/g, '↵\n')}</code>
              </td>
              <td>{c.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
