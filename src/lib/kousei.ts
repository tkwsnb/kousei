export type RuleId = 'indent' | 'exclamation' | 'ellipsis' | 'quote' | 'half_paren' | 'paren_close' | 'typo';

export interface Correction {
  id: string;
  ruleId: RuleId;
  index: number;
  length: number;
  original: string;
  proposed: string;
  reason: string;
}

// ユニークIDを生成するヘルパー
const uid = (): string => Math.random().toString(36).substring(2, 11);

// --- 個別ルール検出関数 ---

/** ルール1: 段落下げ — 行頭がスペース・カギ括弧以外の文字で始まる場合 */
const detectIndent = (text: string): Correction[] => {
  const results: Correction[] = [];
  const regex = /^([^ \t　\n「『])/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push({
      id: uid(),
      ruleId: 'indent',
      index: m.index,
      length: 1,
      original: m[1],
      proposed: '　' + m[1],
      reason: '段落の行頭は1字空けてください。',
    });
  }
  return results;
};

/** ルール2: 感嘆符・疑問符の後ろに全角スペースを入れる */
const detectExclamationSpace = (text: string): Correction[] => {
  const results: Correction[] = [];
  const regex = /([！？])([^ 　\n」』）！？…—])/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push({
      id: uid(),
      ruleId: 'exclamation',
      index: m.index,
      length: 2,
      original: m[0],
      proposed: m[1] + '　' + m[2],
      reason: '感嘆符（！？）の後は1字空けてください。',
    });
  }
  return results;
};

/** ルール3: 三点リーダの適正化（表記ゆれ修正と偶数化） */
const detectEllipsis = (text: string): Correction[] => {
  const results: Correction[] = [];
  const regex = /([…]{1,}|[・。\.]{2,})/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const str = m[0];
    // 奇数なら +1 して偶数個にする
    let targetLen = str.length;
    if (targetLen % 2 !== 0) {
      targetLen += 1;
    }
    const proposed = '…'.repeat(targetLen);
    // 既に正しい三点リーダになっている場合はスキップ
    if (str !== proposed) {
      results.push({
        id: uid(),
        ruleId: 'ellipsis',
        index: m.index,
        length: str.length,
        original: str,
        proposed,
        reason: '三点リーダは「……」のように2文字（偶数個）の全角記号で使用するのが基本です。',
      });
    }
  }
  return results;
};

/** ルール4: 半角括弧を全角に統一 */
const detectHalfWidthParen = (text: string): Correction[] => {
  const results: Correction[] = [];
  const regex = /([()])/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push({
      id: uid(),
      ruleId: 'half_paren',
      index: m.index,
      length: 1,
      original: m[0],
      proposed: m[0] === '(' ? '（' : '）',
      reason: '小説の本文では全角の丸括弧（）を使用するのが一般的です。',
    });
  }
  return results;
};

/** ルール5: カギ括弧・丸括弧の閉じ忘れ（行単位） */
const detectUnclosedBrackets = (text: string): Correction[] => {
  const results: Correction[] = [];
  let offset = 0;
  const lines = text.split('\n');

  for (const line of lines) {
    // カギ括弧
    const openKagi = (line.match(/「/g) || []).length;
    const closeKagi = (line.match(/」/g) || []).length;
    if (openKagi > closeKagi) {
      results.push({
        id: uid(),
        ruleId: 'quote',
        index: offset + line.length,
        length: 0,
        original: '',
        proposed: '」',
        reason: '「 の数に対して 」 が足りません。閉じ忘れの可能性があります。',
      });
    }
    // 丸括弧（全角・半角混在を考慮）
    const openParen = (line.match(/[（(]/g) || []).length;
    const closeParen = (line.match(/[）)]/g) || []).length;
    if (openParen > closeParen) {
      results.push({
        id: uid(),
        ruleId: 'paren_close',
        index: offset + line.length,
        length: 0,
        original: '',
        proposed: '）',
        reason: '（ の数に対して ） が足りません。閉じ忘れの可能性があります。',
      });
    }
    offset += line.length + 1;
  }

  return results;
};

/** ルール6: 誤字検知（辞書ベース） */
const detectTypos = (text: string): Correction[] => {
  // 誤字辞書: [検索パターン, 修正候補, 理由] のタプル配列
  const typoDict: [RegExp, string, string][] = [
    [/もろちん/g, 'もちろん', '「もちろん」の意図か確認してください。'],
  ];

  const results: Correction[] = [];
  for (const [regex, proposed, hint] of typoDict) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      results.push({
        id: uid(),
        ruleId: 'typo',
        index: m.index,
        length: m[0].length,
        original: m[0],
        proposed,
        reason: `タイポ（誤字）の可能性があります。${hint}`,
      });
    }
  }
  return results;
};

// --- メインの解析・適用ロジック ---

/**
 * テキストを解析し、校正候補を返す
 * 各ルールは独立して検出を行い、最後に重複排除する
 */
export const analyzeText = (text: string): Correction[] => {
  const raw = [
    ...detectIndent(text),
    ...detectExclamationSpace(text),
    ...detectEllipsis(text),
    ...detectHalfWidthParen(text),
    ...detectUnclosedBrackets(text),
    ...detectTypos(text),
  ];
  return deduplicateCorrections(raw);
};

/**
 * 重複する修正を排除する
 * 同じ文字範囲にかかる修正が複数ある場合、より長い（具体的な）修正を優先する
 * 例: index=0 の段落下げ(length=1) と index=0 のタイポ(length=4) が重なる場合、
 *     タイポ修正が優先され、段落下げはタイポ修正の proposed に対して再適用する
 */
const deduplicateCorrections = (corrections: Correction[]): Correction[] => {
  // index順、同じならlengthが大きい順にソート
  const sorted = [...corrections].sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return b.length - a.length; // 長い方が先
  });

  const result: Correction[] = [];
  let coveredUntil = -1; // ここまでの文字は既にカバー済み

  for (const c of sorted) {
    const cEnd = c.index + c.length;

    if (c.length === 0) {
      // 挿入型（括弧閉じ忘れなど）は範囲を持たないので常に通す
      result.push(c);
      continue;
    }

    if (c.index >= coveredUntil) {
      // 重複なし：そのまま採用
      result.push(c);
      coveredUntil = cEnd;
    } else if (cEnd <= coveredUntil) {
      // 完全に既存の修正範囲内に含まれる場合→マージする
      const parent = result.find(
        (r) => r.index <= c.index && r.index + r.length >= cEnd
      );
      if (parent && c.ruleId === 'indent') {
        // 段落下げの場合は、親の proposed の先頭に全角スペースを追加
        parent.proposed = '　' + parent.proposed;
        parent.reason += '（＋段落下げ）';
      }
      // それ以外の完全包含は単純にスキップ（重複避け）
    }
    // 部分重複は今のルール構成では発生しないので考慮しない
  }

  return result.sort((a, b) => a.index - b.index);
};

/**
 * 選択された修正を原文に適用する
 * 後ろから適用することでインデックスのずれを防ぐ
 */
export const applyCorrections = (
  text: string,
  corrections: Correction[],
  activeIds: Set<string>
): string => {
  let result = text;
  const active = corrections
    .filter((c) => activeIds.has(c.id))
    .sort((a, b) => b.index - a.index); // 降順（後ろから適用）

  for (const c of active) {
    const before = result.slice(0, c.index);
    const after = result.slice(c.index + c.length);
    result = before + c.proposed + after;
  }

  return result;
};
