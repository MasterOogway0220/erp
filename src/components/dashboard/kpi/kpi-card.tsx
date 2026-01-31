"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
    title: string
    value: string | number
    unit?: string
    change?: number
    description?: string
    icon?: React.ReactNode
}

export function KPICard({ title, value, unit = "", change, description, icon }: KPICardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {unit}
                </div>
                {(change !== undefined || description) && (
                    <div className="flex items-center gap-1 mt-1">
                        {change !== undefined && (
                            <Badge variant={change >= 0 ? "default" : "destructive"} className="px-1 py-0 h-4 text-[10px]">
                                {change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                                {Math.abs(change)}%
                            </Badge>
                        )}
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
