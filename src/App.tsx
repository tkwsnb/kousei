import { useState, useMemo } from 'react';
import { analyzeText, applyCorrections, Correction } from './lib/kousei';
import { calculateStats } from './lib/stats';
import { DiffViewer } from './components/DiffViewer';
import { CorrectionList } from './components/CorrectionList';

function App() {
  const [inputText, setInputText] = useState<string>('');
  const [checkedText, setCheckedText] = useState<string>('');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => calculateStats(inputText), [inputText]);

  const handleCheck = () => {
    const newCorrections = analyzeText(inputText);
    setCorrections(newCorrections);
    setActiveIds(new Set(newCorrections.map(c => c.id)));
    setCheckedText(inputText);
  };

  const handleApply = () => {
    if (corrections.length === 0) return;
    const finalText = applyCorrections(checkedText, corrections, activeIds);
    setInputText(finalText);
    setCorrections([]);
    setActiveIds(new Set());
    setCheckedText('');
  };

  const toggleCorrection = (id: string) => {
    setActiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (active: boolean) => {
    if (active) {
      setActiveIds(new Set(corrections.map(c => c.id)));
    } else {
      setActiveIds(new Set());
    }
  };

  return (
    <div>
      <h1>Kousei-Note (仮)</h1>
      <p style={{ textAlign: 'center' }}>阿部寛のホームページ風クラシカル校正ツール</p>
      <hr />

      <div className="stats">
        【文字数統計】
        純文字数（空白除き）: {stats.charCountNoSpace} 字 /
        総文字数: {stats.charCount} 字 /
        原稿用紙（400字詰）換算: 約 {stats.manuscriptPages} 枚
      </div>

      <div className="controls">
        <button onClick={handleCheck} style={{ marginRight: '10px', fontSize: '16px', fontWeight: 'bold' }}>
          ▼ チェックする
        </button>
        <button onClick={handleApply} style={{ fontSize: '16px', fontWeight: 'bold' }}>
          ◀ エディターに反映する
        </button>
      </div>

      <div className="container">
        <div className="pane">
          <div className="pane-title">■ 原文エディター</div>
          <div className="pane-content">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ここに小説の本文を入力・ペーストしてください。"
            />
          </div>
        </div>

        <div className="pane">
          <div className="pane-title">■ 校正プレビュー（赤字が修正箇所）</div>
          <div className="pane-content">
            <DiffViewer
              originalText={checkedText}
              corrections={corrections}
              activeIds={activeIds}
            />
          </div>
        </div>
      </div>

      {corrections.length > 0 && (
        <CorrectionList
          corrections={corrections}
          activeIds={activeIds}
          onToggle={toggleCorrection}
          onToggleAll={toggleAll}
        />
      )}
      
      <hr />
      <div style={{ textAlign: 'center', fontSize: '12px' }}>
        <a href="#">トップへ戻る</a> | このツールはオープンソースです。
      </div>
    </div>
  );
}

export default App;
