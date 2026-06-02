import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { makeRenderer } from './helpers'
import App from '@/app/page'

describe('App — главная страница', () => {
  it('отображает три основных карточки', async () => {
    const { render } = await makeRenderer()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Данные API')).toBeInTheDocument()
      expect(screen.getByText('Избранные курсы')).toBeInTheDocument()
      expect(screen.getByText('Мои средства')).toBeInTheDocument()
    })
  })
})
