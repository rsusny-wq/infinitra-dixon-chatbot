"use client"

import React from "react"
import { PieChart as RechartsPieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import { 
  ChartContainer,
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart"

export interface PieChartProps {
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  title?: string
  className?: string
  config: ChartConfig
  dataKey?: string
  nameKey?: string
  innerRadius?: number
  outerRadius?: number
}

export function PieChart({
  data,
  title,
  className,
  config,
  dataKey = "value",
  nameKey = "name",
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-medium">{title}</h3>
      )}
      <ChartContainer config={config} className={className}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            label
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`var(--color-${entry[nameKey]})`} 
              />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} />} />
          <Legend />
        </RechartsPieChart>
      </ChartContainer>
    </div>
  )
} 