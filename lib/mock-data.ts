export type HotSymbol = {
  symbol: string;
  price: number;
  changePercent: number;
  volume: string;
  signal: 'Breakout' | 'Momentum' | 'Reversal';
};

export const hotSymbols: HotSymbol[] = [
  { symbol: 'BTCUSDT', price: 52341.12, changePercent: 2.31, volume: '84.1M', signal: 'Momentum' },
  { symbol: 'ETHUSDT', price: 2841.9, changePercent: 4.9, volume: '112.3M', signal: 'Breakout' },
  { symbol: 'SOLUSDT', price: 98.52, changePercent: -1.2, volume: '96.4M', signal: 'Reversal' },
  { symbol: 'BNBUSDT', price: 372.06, changePercent: 3.18, volume: '61.8M', signal: 'Breakout' }
];
