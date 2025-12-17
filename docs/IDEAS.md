# Ideas / Backlog

このファイルはプロジェクト内の「思いつき」「改善案」「将来の機能」用の簡易バックログです。  
追加・更新は自由ですが、議論や実装の起点として最小限のメタ情報を書いてください。

## テンプレート
- Date: 2025-12-17
- Title: 短いタイトル（例: レベルノードを親ノードのラベルとして右上に固定）
- Author: Your Name
- Status: proposed / accepted / in-progress / done / dropped
- Priority: High / Med / Low
- Summary: 1〜2文で要点
- Rationale / Benefit: なぜ必要か / 期待効果
- Estimate: （任意）概算工数
- Notes: 関連ファイルや補足情報

---

## サンプル
- Date: 2025-12-17
- Title: レベルノードの上方向オフセットを設定化する
- Author: takato
- Status: accepted
- Priority: Med
- Summary: levelNodeConfig に verticalOffsetFactor を導入して、レベル表示を親ノードの少し上に移動できるようにする
- Rationale / Benefit: レベル表示が主ラベルに重なる問題を回避できる。見た目の調整が容易になる。
- Estimate: 1-2h
- Notes: `src/app/visual-config.ts` と `src/app/app.ts` を修正済み

---

追記は自由です。議論に発展させたい場合は issue にリンクするか、PR を作ってください。
