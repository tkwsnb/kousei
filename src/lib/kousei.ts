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

/**
 * テキストを解析し、校正候補を返す
 * 各ルールは独立して検出を行い、最後に重複排除する
 */
export const analyzeText = (text: string): Correction[] => {
  const raw: Correction[] = [];

  // ルール1: 段落下げ
  // 行頭がスペース・改行・カギ括弧以外の文字で始まる場合
  const indentRegex = /^([^ \t　\n「『])/gm;
  let m: RegExpExecArray | null;
  while ((m = indentRegex.exec(text)) !== null) {
    raw.push({
      id: uid(),
      ruleId: 'indent',
      index: m.index,
      length: 1,
      original: m[1],
      proposed: '　' + m[1],
      reason: '段落の行頭は1字空けてください。',
    });
  }

  // ルール2: 感嘆符・疑問符の後ろに全角スペースを入れる
  const exclRegex = /([！？])([^ 　\n」』）！？…—])/g;
  while ((m = exclRegex.exec(text)) !== null) {
    raw.push({
      id: uid(),
      ruleId: 'exclamation',
      index: m.index,
      length: 2,
      original: m[0],
      proposed: m[1] + '　' + m[2],
      reason: '感嘆符（！？）の後は1字空けてください。',
    });
  }

  // ルール3: 三点リーダの偶数化
  const ellipsisRegex = /(…+)/g;
  while ((m = ellipsisRegex.exec(text)) !== null) {
    if (m[0].length % 2 !== 0) {
      raw.push({
        id: uid(),
        ruleId: 'ellipsis',
        index: m.index,
        length: m[0].length,
        original: m[0],
        proposed: m[0] + '…',
        reason: '三点リーダは偶数個（……）で使用するのが基本です。',
      });
    }
  }

  // ルール4: 半角括弧を全角に統一
  const halfParenRegex = /([\(\)])/g;
  while ((m = halfParenRegex.exec(text)) !== null) {
    raw.push({
      id: uid(),
      ruleId: 'half_paren',
      index: m.index,
      length: 1,
      original: m[0],
      proposed: m[0] === '(' ? '（' : '）',
      reason: '小説の本文では全角の丸括弧（）を使用するのが一般的です。',
    });
  }

  // ルール5: カギ括弧・丸括弧の閉じ忘れ（行単位）
  let offset = 0;
  const lines = text.split('\n');
  for (const line of lines) {
    // カギ括弧
    const openKagi = (line.match(/「/g) || []).length;
    const closeKagi = (line.match(/」/g) || []).length;
    if (openKagi > closeKagi) {
      raw.push({
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
      raw.push({
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

  // ルール6: 誤字検知
  const typoRegex = /もろちん/g;
  while ((m = typoRegex.exec(text)) !== null) {
    raw.push({
      id: uid(),
      ruleId: 'typo',
      index: m.index,
      length: 4,
      original: 'もろちん',
      proposed: 'もちろん',
      reason: 'タイポ（誤字）の可能性があります。「もちろん」の意図か確認してください。',
    });
  }

  // 重複排除: 同じ範囲がカバーされている場合、より長い（具体的な）修正を優先する
  return deduplicateCorrections(raw);
};

/**
 * 重複する修正を排除する
 * 同じ文字範囲にかかる修正が複数ある場合、より長い（具体的な）修正を優先する
 * 例: index=0 の段落下げ(length=1) と index=0 のタイポ(length=4) が重なる場合、
 *      タイポ修正が優先され、段落下げはタイポ修正の proposed に対して再適用する
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
      // 完全に既存の修正範囲内に含まれる場合
      // 既に採用済みの修正があるので、この修正を「マージ」する
      // 例: タイポ(0-4)が先に採用され、段落下げ(0-1)が後に来た場合
      //     タイポの proposed の先頭に全角スペースを追加する
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
