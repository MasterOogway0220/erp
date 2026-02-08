'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge'; // Assuming this exists

interface DiffItem {
  type: 'added' | 'removed' | 'changed' | 'object_changed' | 'array_changed';
  oldValue?: any;
  newValue?: any;
  changes?: any; // For object_changed or array_changed
}

interface DiffDisplayProps {
  data: { [key: string]: DiffItem };
  level?: number;
}

const formatValue = (value: any) => {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export function DiffDisplay({ data, level = 0 }: DiffDisplayProps) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-gray-500 text-sm">No significant differences found.</p>;
  }

  const paddingLeft = level * 16; // Indent based on level

  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, item]) => (
        <div key={key} style={{ paddingLeft: `${paddingLeft}px` }}>
          {item.type === 'added' && (
            <div className="flex items-start text-green-700 bg-green-50 p-1 rounded">
              <Badge variant="success" className="mr-2">ADDED</Badge>
              <span className="font-semibold">{key}:</span>
              <span className="ml-2 whitespace-pre-wrap">{formatValue(item.newValue)}</span>
            </div>
          )}
          {item.type === 'removed' && (
            <div className="flex items-start text-red-700 bg-red-50 p-1 rounded">
              <Badge variant="destructive" className="mr-2">REMOVED</Badge>
              <span className="font-semibold">{key}:</span>
              <span className="ml-2 whitespace-pre-wrap line-through">{formatValue(item.oldValue)}</span>
            </div>
          )}
          {item.type === 'changed' && (
            <div className="p-1 rounded">
              <div className="flex items-start text-blue-700 bg-blue-50">
                <Badge variant="info" className="mr-2">CHANGED</Badge>
                <span className="font-semibold">{key}:</span>
              </div>
              <div className="ml-4 pl-2 border-l-2 border-blue-200">
                <p className="text-red-600 line-through">Old: {formatValue(item.oldValue)}</p>
                <p className="text-green-600">New: {formatValue(item.newValue)}</p>
              </div>
            </div>
          )}
          {(item.type === 'object_changed' || item.type === 'array_changed') && (
            <div className="p-1">
              <div className="flex items-center text-gray-800">
                <Badge variant="outline" className="mr-2">{item.type === 'object_changed' ? 'OBJECT' : 'ARRAY'} CHANGES</Badge>
                <span className="font-semibold">{key}:</span>
              </div>
              <div className="ml-4 border-l border-gray-200">
                <DiffDisplay data={item.changes} level={level + 1} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
