"use client"

import React from "react"
import { 
  Label, 
  PolarGrid, 
  PolarRadiusAxis, 
  RadialBar, 
  RadialBarChart as RechartsRadialBarChart 
} from "recharts"
import { 
  ChartContainer, 
  type ChartConfig 
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface RadialChartProps {
  data: Array<{
    name: string
    value: number
    fill?: string
    [key: string]: any
  }>
  title?: string
  description?: string
  footer?: React.ReactNode
  className?: string
  config: ChartConfig
  dataKey?: string
  showTrend?: boolean
  trendValue?: number
  trendDirection?: 'up' | 'down'
  subtitle?: string
}

export function RadialChart({
  data,
  title,
  description,
  footer,
  config,
  dataKey = "value",
  showTrend = false,
  trendValue,
  trendDirection = 'up',
  subtitle = "Showing data for current period",
}: RadialChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RechartsRadialBarChart
            data={data}
            endAngle={-40}
            startAngle={90}
            innerRadius={80}
            outerRadius={140}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey={dataKey} background />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {data[0][dataKey].toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {config[data[0].name]?.label || data[0].name}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RechartsRadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {showTrend && trendValue && (
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending {trendDirection} by {trendValue}% this month 
            {trendDirection === 'up' ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4"
              >
                <path d="m23 6-9.5 9.5-5-5L1 18" />
                <path d="M17 6h6v6" />
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4"
              >
                <path d="m23 18-9.5-9.5-5 5L1 6" />
                <path d="M17 18h6v-6" />
              </svg>
            )}
          </div>
        )}
        {footer ? footer : (
          <div className="leading-none text-muted-foreground">
            {subtitle}
          </div>
        )}
      </CardFooter>
    </Card>
  )
} 