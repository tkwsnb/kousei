import { useState, useMemo } from 'react';
import { analyzeText, applyCorrections, type Correction } from './lib/kousei';
import { calculateStats } from './lib/stats';
import { DiffViewer } from './components/DiffViewer';
import { CorrectionList } from './components/CorrectionList';

function App() {
  const [inputText, setInputText] = useState<string>('');
  const [checkedText, setCheckedText] = useState<string>('');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  // 入力テキストが変わるたびにリアルタイムで統計を再計算
  const stats = useMemo(() => calculateStats(inputText), [inputText]);

  /** 「チェックする」ボタン押下時の処理 */
  const handleCheck = () => {
    const found = analyzeText(inputText);
    setCorrections(found);
    setActiveIds(new Set(found.map((c) => c.id)));
    setCheckedText(inputText);
  };

  /** 「エディタに反映する」ボタン押下時の処理 */
  const handleApply = () => {
    if (corrections.length === 0) return;
    const finalText = applyCorrections(checkedText, corrections, activeIds);
    setInputText(finalText);
    setCorrections([]);
    setActiveIds(new Set());
    setCheckedText('');
  };

  /** 個別の修正のオン・オフを切り替える */
  const toggleCorrection = (id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /** すべて適用 / すべて解除 */
  const toggleAll = (active: boolean) => {
    setActiveIds(
      active ? new Set(corrections.map((c) => c.id)) : new Set()
    );
  };

  return (
    <div className="app-wrapper">
      <header>
      <h1>本文校正くん</h1>
      <p className="subtitle">
        段落下げや感嘆符（！？）後ろの空白、かぎ括弧（「」）や丸括弧（（））の閉じ忘れをチェックするための小説向け校正ツール
      </p>
      <hr />

      <div className="stats">
        【文字数統計】
        純文字数（空白除き）: {stats.charCountNoSpace} 字 /
        総文字数: {stats.charCount} 字 /
        原稿用紙（400字詰）換算: 約 {stats.manuscriptPages} 枚
      </div>
      </header>

      <main>
      <div className="controls">
        <button className="btn-primary" onClick={handleCheck}>
          ▼ チェックする
        </button>
        <button className="btn-primary" onClick={handleApply}>
          ◀ エディタに反映する
        </button>
      </div>

      <div className="container">
        <section className="pane">
          <div className="pane-title">■ 原文エディタ</div>
          <div className="pane-content">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ここに小説の本文を入力・ペーストしてください。"
            />
          </div>
        </section>

        <section className="pane">
          <div className="pane-title">■ 校正プレビュー（赤字が修正箇所）</div>
          <div className="pane-content">
            <DiffViewer
              originalText={checkedText}
              corrections={corrections}
              activeIds={activeIds}
            />
          </div>
        </section>
      </div>

      {corrections.length > 0 && (
        <CorrectionList
          corrections={corrections}
          activeIds={activeIds}
          onToggle={toggleCorrection}
          onToggleAll={toggleAll}
        />
      )}
      </main>

      <hr />
      <footer>
        <div className="footer">
          <a href="https://tkwsnb.net/">トップへ戻る</a> | <a href="https://x.com/tkwsnb">作った人</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
