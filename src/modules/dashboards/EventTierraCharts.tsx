"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HourPoint = {
  time: string;
  interviews: number;
  total: number;
};

type ProgressPoint = {
  name: string;
  completadas: number;
  objetivo: number;
};

export const ProgressChart = ({ data }: { data: ProgressPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={26}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
          contentStyle={{
            borderRadius: 8,
            borderColor: "hsl(var(--border))",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="completadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="objetivo" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const TimelineChart = ({ data }: { data: HourPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            borderColor: "hsl(var(--border))",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          fill="url(#areaFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const PaceChart = ({ data }: { data: HourPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          cursor={{ stroke: "hsl(var(--secondary-foreground))", strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            borderColor: "hsl(var(--border))",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Area
          type="monotone"
          dataKey="interviews"
          stroke="hsl(var(--secondary-foreground))"
          fill="url(#hourFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
