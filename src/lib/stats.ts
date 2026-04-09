export interface Stats {
  charCount: number;
  charCountNoSpace: number;
  manuscriptPages: number;
}

export const calculateStats = (text: string): Stats => {
  // 純粋な文字数（改行含む）
  const charCount = text.length;
  
  // 空白・改行を除いた文字数
  const noSpaceText = text.replace(/[\s　]/g, '');
  const charCountNoSpace = noSpaceText.length;
  
  // 400字詰め原稿用紙換算（端数切り上げ）
  const manuscriptPages = Math.ceil(charCount / 400);

  return {
    charCount,
    charCountNoSpace,
    manuscriptPages,
  };
};
