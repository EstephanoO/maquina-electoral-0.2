"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

export type InterviewerTimelineChartProps = {
  data: Array<Record<string, string | number>>;
  nowLabel: string;
  series: string[];
  colors: string[];
};

export const InterviewerTimelineChart = ({
  data,
  nowLabel,
  series,
  colors,
}: InterviewerTimelineChartProps) => {
  return (
    <div className="mt-4 h-[220px] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-3">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <ReferenceLine x={nowLabel} stroke="rgba(22,57,96,0.5)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              background: "rgba(12,22,40,0.95)",
              border: "1px solid rgba(22,57,96,0.35)",
              borderRadius: "12px",
              color: "#f8fafc",
            }}
            labelStyle={{ color: "#f8fafc" }}
          />
          {series.map((interviewer, index) => (
            <Line
              key={interviewer}
              type="monotone"
              dataKey={interviewer}
              stroke={colors[index] ?? "#94a3b8"}
              strokeWidth={2.2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
