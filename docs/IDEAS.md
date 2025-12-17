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
- Notes: `src/app/visual-config.ts` と `src/app/app.ts` を修正済み

---

## idea1
- Date: 2025-12-17
- Title: ノード選択時にLevel変更機能を持たせるDetail欄で実施する
- Author: takato
- Status: done
- Priority: High
- Summary: ノード選択時にLevel変更機能を持たせるDetail欄で実施する
- Rationale / Benefit: ユーザーが画面から任意の項目のレベルを容易に変更できるようになる
- Estimate: 1-2h
- Notes: 実装ファイル — `src/app/app.html`, `src/app/app.ts`, `src/app/app.css`。保存は `PATCH /skills/<id>/` に対して行う想定（backend 側に該当エンドポイントが必要）。
