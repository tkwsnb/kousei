export type RuleId = 'indent' | 'exclamation' | 'ellipsis';

export interface Correction {
  id: string;
  ruleId: RuleId;
  index: number;
  length: number;
  original: string;
  proposed: string;
  reason: string;
}

export const analyzeText = (text: string): Correction[] => {
  const corrections: Correction[] = [];

  // 1. 段落下げ: 行頭がスペース、改行、カギ括弧以外の場合にマッチ
  const indentRegex = /^([^ \t　\n「『])/gm;
  let indentMatch;
  while ((indentMatch = indentRegex.exec(text)) !== null) {
    corrections.push({
      id: crypto.randomUUID(),
      ruleId: 'indent',
      index: indentMatch.index,
      length: 1, // マッチした最初の1文字
      original: indentMatch[1],
      proposed: '　' + indentMatch[1],
      reason: '段落の行頭は1字空けてください。',
    });
  }

  // 2. 感嘆符の後ろの空白: ！や？の直後がスペースや特定の閉じ記号以外にマッチ
  const exclRegex = /([！？])([^ 　\n」』）！？…—])/g;
  let exclMatch;
  while ((exclMatch = exclRegex.exec(text)) !== null) {
    corrections.push({
      id: crypto.randomUUID(),
      ruleId: 'exclamation',
      index: exclMatch.index,
      length: 2, // 記号とその後ろの1文字
      original: exclMatch[0],
      proposed: exclMatch[1] + '　' + exclMatch[2],
      reason: '感嘆符（！？）の後は1字空けてください。',
    });
  }

  // 3. 三点リーダの偶数化: …の連続を検索
  const ellipsisRegex = /(…+)/g;
  let ellipMatch;
  while ((ellipMatch = ellipsisRegex.exec(text)) !== null) {
    if (ellipMatch[0].length % 2 !== 0) {
      corrections.push({
        id: crypto.randomUUID(),
        ruleId: 'ellipsis',
        index: ellipMatch.index,
        length: ellipMatch[0].length,
        original: ellipMatch[0],
        proposed: ellipMatch[0] + '…',
        reason: '三点リーダは偶数個（……）で使用するのが基本です。',
      });
    }
  }

  // 出現順（index順）にソートして返す
  return corrections.sort((a, b) => a.index - b.index);
};

export const applyCorrections = (text: string, corrections: Correction[], activeIds: Set<string>): string => {
  // 元のテキストのインデックスが狂わないよう、後ろから置換する
  let result = text;
  const sortedActive = [...corrections]
    .filter((c) => activeIds.has(c.id))
    .sort((a, b) => b.index - a.index); // 降順

  for (const c of sortedActive) {
    const before = result.slice(0, c.index);
    const after = result.slice(c.index + c.length);
    result = before + c.proposed + after;
  }

  return result;
};
