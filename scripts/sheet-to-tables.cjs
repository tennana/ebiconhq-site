#!/usr/bin/env node
// Google フォームの回答シート(CSV)から卓情報 JSON(table.11tydata.json) を生成する。
// 使い方: node scripts/sheet-to-tables.cjs <responses.csv> <table.11tydata.json> [--write]
//   --write なしは標準出力に出すだけ。eventTag は出力先ファイルの既存値を引き継ぐ。
const fs = require("fs");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

const COL = {
  ts: "タイムスタンプ", role: "希望する参加区分", extra: "追加区分", name: "受付時のおなまえ",
  system: "立卓予定システム", lv: "対応レベル", people: "対応可能人数",
  items: "必須の持ち物", content: "卓概要(掲載用)",
};

function toTables(csv) {
  const [header, ...rows] = parseCsv(csv);
  const idx = {};
  for (const [k, v] of Object.entries(COL)) {
    idx[k] = header.findIndex((h) => h.trim() === v);
    if (idx[k] < 0) throw new Error(`列が見つかりません: ${v}`);
  }
  const get = (r, k) => (r[idx[k]] || "").trim();
  return rows
    .filter((r) => (get(r, "role") + get(r, "extra")).includes("ゲームマスター") && get(r, "system"))
    .map((r) => {
      const nums = (get(r, "people").match(/\d+/g) || []).map(Number);
      const lo = Math.min(...nums), hi = Math.max(...nums);
      const people = !nums.length ? "" : lo === hi ? `${lo}人` : `${lo}-${hi}人`;
      return {
        name: `${get(r, "name")}卓 ${get(r, "system")}`,
        date: get(r, "ts").slice(0, 10).replace(/\//g, "-"),
        people,
        system: get(r, "system"),
        lv: get(r, "lv"),
        items: get(r, "items").split(/\s*[,、]\s*/).filter(Boolean).join(","),
        content: get(r, "content").replace(/\r\n?/g, "\n"),
      };
    });
}

if (require.main === module) {
  const [csvPath, outPath, flag] = process.argv.slice(2);
  if (!csvPath || !outPath) { console.error("usage: sheet-to-tables.cjs <csv> <json> [--write]"); process.exit(1); }
  const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
  if (!prev.eventTag) { console.error("出力先JSONに eventTag がありません"); process.exit(1); }
  const json = JSON.stringify({ eventTag: prev.eventTag, table: toTables(fs.readFileSync(csvPath, "utf8")) }, null, 2) + "\n";
  if (flag === "--write") fs.writeFileSync(outPath, json); else process.stdout.write(json);
}
module.exports = { parseCsv, toTables };
