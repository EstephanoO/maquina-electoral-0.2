"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/ui/primitives/card";

type CampaignDatum = {
  name: string;
  value: number;
  color: string;
};

const fallbackData: CampaignDatum[] = [
  { name: "Campana A", value: 38, color: "#38bdf8" },
  { name: "Campana B", value: 26, color: "#22c55e" },
  { name: "Campana C", value: 18, color: "#f97316" },
  { name: "Campana D", value: 18, color: "#6366f1" },
];

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const rows = lines.slice(1).map((line) => line.split(","));
  const data = rows
    .map((row) => ({
      name: row[0]?.trim() ?? "",
      value: Number.parseFloat(row[1] ?? "0"),
    }))
    .filter((item) => item.name && Number.isFinite(item.value));
  if (!data.length) return null;
  return data.map((item, index) => ({
    ...item,
    color: fallbackData[index % fallbackData.length].color,
  }));
};

export default function CampaignsPie({ csvUrl }: { csvUrl: string }) {
  const [data, setData] = React.useState<CampaignDatum[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch(csvUrl, { cache: "force-cache" });
        if (!response.ok) throw new Error("csv");
        const text = await response.text();
        if (!isMounted) return;
        setData(parseCsv(text));
      } catch {
        if (isMounted) setError(true);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [csvUrl]);

  const resolved = data ?? fallbackData;

  return (
    <Card className="rounded-3xl bg-card/70 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ring-1 ring-transparent">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-foreground">
          Campanas
        </p>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Distribucion
        </span>
      </div>
      {error ? (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs text-destructive ring-1 ring-red-200/70">
          No se pudo cargar el CSV de campanas.
        </div>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Tooltip />
              <Pie
                data={resolved}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {resolved.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {resolved.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
