import React from 'react';
import { Correction } from '../lib/kousei';

interface Props {
  corrections: Correction[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (active: boolean) => void;
}

export const CorrectionList: React.FC<Props> = ({ corrections, activeIds, onToggle, onToggleAll }) => {
  if (corrections.length === 0) return null;

  return (
    <div className="correction-list">
      <h3>【修正提案リスト】</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => onToggleAll(true)} style={{ marginRight: '5px' }}>すべて適用</button>
        <button onClick={() => onToggleAll(false)}>すべて解除</button>
      </div>
      <table width="100%">
        <thead>
          <tr>
            <th width="50">適用</th>
            <th width="100">修正前</th>
            <th width="100">修正後</th>
            <th>理由</th>
          </tr>
        </thead>
        <tbody>
          {corrections.map((c) => (
            <tr key={c.id}>
              <td align="center">
                <input 
                  type="checkbox" 
                  checked={activeIds.has(c.id)} 
                  onChange={() => onToggle(c.id)} 
                />
              </td>
              <td><code>{c.original.replace(/\n/g, '↵\n')}</code></td>
              <td><code className="diff-add">{c.proposed.replace(/\n/g, '↵\n')}</code></td>
              <td>{c.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
