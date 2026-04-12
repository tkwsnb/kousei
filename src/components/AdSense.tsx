import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  slot?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle';
}

/**
 * Google AdSense 広告ユニットを表示するためのコンポーネント
 */
export function AdSense({ slot, style, format = 'auto' }: AdSenseProps) {
  useEffect(() => {
    try {
      // 広告の読み込みを実行
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="adsense-container" style={{ margin: '20px 0', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px', fontFamily: 'serif' }}>
        --- 広告 ---
      </div>
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-6504863776490019"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
