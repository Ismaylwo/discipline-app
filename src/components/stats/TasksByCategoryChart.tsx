"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function TasksByCategoryChart({ data }: { data: Array<{ category_name: string; total: number; done: number }> }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category_name" tickMargin={8} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" />
          <Bar dataKey="done" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
