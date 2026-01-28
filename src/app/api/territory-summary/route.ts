import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { territory } from "@/db/schema";

const timeZone = "America/Lima";

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const formatDayKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

const formatHourKey = (value: Date) => {
  const hour = new Intl.DateTimeFormat("es-PE", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(value);
  return `${hour}:00`;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateParam = url.searchParams.get("candidate");
  const clientParam = url.searchParams.get("client");
  if (clientParam && !clientToCandidate[clientParam]) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;

  const baseQuery = db
    .select({
      interviewer: territory.interviewer,
      candidate: territory.candidate,
      createdAt: territory.createdAt,
    })
    .from(territory);
  const query = resolvedCandidate
    ? baseQuery.where(eq(territory.candidate, resolvedCandidate))
    : baseQuery;
  const rows = await query.orderBy(desc(territory.createdAt)).limit(4000);

  if (rows.length === 0) {
    return NextResponse.json({
      total: 0,
      uniqueInterviewers: 0,
      latestAt: null,
      day: null,
      perCandidate: [],
      perHour: [],
      topInterviewers: [],
      lowInterviewers: [],
    });
  }

  const latestAt = rows[0].createdAt;
  const dayKey = formatDayKey(latestAt);

  const perCandidateMap = new Map<string, number>();
  const interviewerMap = new Map<string, number>();
  const perHourMap = new Map<string, number>();

  const dayRows = rows.filter((row) => formatDayKey(row.createdAt) === dayKey);

  for (const row of dayRows) {
    perCandidateMap.set(row.candidate, (perCandidateMap.get(row.candidate) ?? 0) + 1);
    interviewerMap.set(row.interviewer, (interviewerMap.get(row.interviewer) ?? 0) + 1);
    const hourKey = formatHourKey(row.createdAt);
    perHourMap.set(hourKey, (perHourMap.get(hourKey) ?? 0) + 1);
  }

  const perCandidate = [...perCandidateMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const perHour = [...perHourMap.entries()]
    .map(([time, interviews]) => ({ time, interviews }))
    .sort((a, b) => Number(a.time.slice(0, 2)) - Number(b.time.slice(0, 2)))
    .reduce<Array<{ time: string; interviews: number; total: number }>>((acc, item) => {
      const total = (acc.at(-1)?.total ?? 0) + item.interviews;
      acc.push({ ...item, total });
      return acc;
    }, []);

  const interviewerEntries = [...interviewerMap.entries()].map(([name, count]) => ({
    name,
    interviews: count,
  }));
  const topInterviewers = [...interviewerEntries]
    .sort((a, b) => b.interviews - a.interviews)
    .slice(0, 4);
  const lowInterviewers = [...interviewerEntries]
    .sort((a, b) => a.interviews - b.interviews)
    .slice(0, 4);

  return NextResponse.json({
    total: dayRows.length,
    uniqueInterviewers: interviewerMap.size,
    latestAt: latestAt.toISOString(),
    day: dayKey,
    perCandidate,
    perHour,
    topInterviewers,
    lowInterviewers,
  });
}
