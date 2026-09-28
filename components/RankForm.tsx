"use client";

import { useState } from "react";

export type Rank = {
  id: string;
  name: string;
  group: "Hạ sĩ quan, binh sĩ" | "Sĩ quan";
  rankOrder: number;
};

type RankFormProps = {
  rank?: Rank;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const groups: Rank["group"][] = ["Hạ sĩ quan, binh sĩ", "Sĩ quan"];

export default function RankForm({ rank, onClose, onSaved }: RankFormProps) {
  const [name, setName] = useState(rank?.name ?? "");
  const [group, setGroup] = useState<Rank["group"]>(rank?.group ?? groups[0]);
  const [rankOrder, setRankOrder] = useState(String(rank?.rankOrder ?? ""));
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order = Number(rankOrder);
    if (!name.trim() || !Number.isInteger(order) || order < 1) {
      alert("Hãy nhập tên cấp bậc và thứ tự là số nguyên dương.");
      return;
    }

    setSaving(true);
    try {
      const payload: Rank = {
        id: rank?.id ?? crypto.randomUUID(),
        name: name.trim(),
        group,
        rankOrder: order,
      };
      const response = await fetch(
        rank ? `http://localhost:3001/ranks/${rank.id}` : "http://localhost:3001/ranks",
        {
          method: rank ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Không thể lưu cấp bậc");
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Không thể lưu cấp bậc. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 p-5">
      <h2 className="text-xl font-bold">{rank ? "Sửa cấp bậc" : "Thêm cấp bậc"}</h2>
      <label className="block text-sm font-medium">Tên cấp bậc
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" autoFocus />
      </label>
      <label className="block text-sm font-medium">Nhóm
        <select value={group} onChange={(e) => setGroup(e.target.value as Rank["group"])} className="mt-1 w-full rounded-lg border px-3 py-2">
          {groups.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Thứ tự hiển thị
        <input type="number" min="1" value={rankOrder} onChange={(e) => setRankOrder(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border px-4 py-2">Hủy</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </form>
  );
}
