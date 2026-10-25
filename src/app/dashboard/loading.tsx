import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-48 bg-muted rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded-md" />
          <div className="h-10 w-28 bg-muted rounded-md" />
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-12 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <div className="p-4 border-b border-border">
          <div className="h-5 w-48 bg-muted rounded" />
        </div>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/60 rounded-md" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
