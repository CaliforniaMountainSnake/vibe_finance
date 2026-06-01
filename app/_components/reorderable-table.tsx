'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'

interface Row {
  id: number
  name: string
}

interface ReorderableTableProperties {
  rows: Row[]
}

export function ReorderableTable({ rows: initialRows }: ReorderableTableProperties) {
  const [rows, setRows] = useState(initialRows)

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...rows]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setRows(next)
  }

  const moveDown = (index: number) => {
    if (index === rows.length - 1) return
    const next = [...rows]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setRows(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reorderable Table</CardTitle>
        <CardDescription>Click arrows to move rows up or down.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableCaption>A demo of row reordering with React state.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id} data-testid={`row-${row.id}`}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Move ${row.name} up`}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Move ${row.name} down`}
                      disabled={index === rows.length - 1}
                      onClick={() => moveDown(index)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
