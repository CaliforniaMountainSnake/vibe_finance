import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReorderableTable } from '@/app/_components/reorderable-table'

const sampleRows = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
]

describe('ReorderableTable', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('renders all rows in initial order', () => {
    render(<ReorderableTable rows={sampleRows} />)

    const rows = screen.getAllByTestId(/^row-/)
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Alice')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Bob')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Carol')).toBeInTheDocument()
  })

  it('moves a row up on ArrowUp click', async () => {
    render(<ReorderableTable rows={sampleRows} />)
    const row2 = screen.getByTestId('row-2')
    const upButton = within(row2).getByLabelText('Move Bob up')

    await user.click(upButton)

    const rows = screen.getAllByTestId(/^row-/)

    // After move: Alice↔Bob
    expect(within(rows[0]).getByText('Bob')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Alice')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Carol')).toBeInTheDocument()
  })

  it('moves a row down on ArrowDown click', async () => {
    render(<ReorderableTable rows={sampleRows} />)
    const row2 = screen.getByTestId('row-2')
    const downButton = within(row2).getByLabelText('Move Bob down')

    await user.click(downButton)

    const rows = screen.getAllByTestId(/^row-/)

    // After move: Bob↔Carol
    expect(within(rows[0]).getByText('Alice')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Carol')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Bob')).toBeInTheDocument()
  })

  it('disables ArrowUp for the first row', () => {
    render(<ReorderableTable rows={sampleRows} />)
    const row1 = screen.getByTestId('row-1')
    const upButton = within(row1).getByLabelText('Move Alice up')

    expect(upButton).toBeDisabled()
  })

  it('disables ArrowDown for the last row', () => {
    render(<ReorderableTable rows={sampleRows} />)
    const row3 = screen.getByTestId('row-3')
    const downButton = within(row3).getByLabelText('Move Carol down')

    expect(downButton).toBeDisabled()
  })
})
