export const layoutConfig = {
  dagre: {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 180,
    rankSep: 240,
    edgeSep: 30,
    padding: 20
  },
  grid: {
    name: 'grid',
    padding: 20
  }
} as const;

export const levelNodeConfig = {
  height: 14,
  marginInside: 6,
  // positive => 下方向、負 => 上方向（調整可）
  verticalOffsetFactor: 0,
  minWidth: 36,
  maxWidth: 72
} as const;

export const mainLabelConfig = {
  textValign: 'center' as const,
  // 正の値で下へ、負の値で上へ
  textMarginY: -22,
  textHalign: 'center' as const
} as const;
