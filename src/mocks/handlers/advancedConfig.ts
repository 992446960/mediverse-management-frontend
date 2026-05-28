import { http, HttpResponse, delay } from 'msw'
import { mockEngines, mockModelGroups, mockToolGroups } from '../data/advancedConfig'

const BASE_URL = '/api/v1'

export const advancedConfigHandlers = [
  http.get(`${BASE_URL}/tools`, async ({ request }) => {
    await delay(160)
    const url = new URL(request.url)
    const category = url.searchParams.get('category')?.trim()
    const data = category
      ? mockToolGroups.filter((group) => group.category === category)
      : mockToolGroups
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      total: data.reduce((sum, group) => sum + group.items.length, 0),
      category: data.map((group) => group.category),
      data,
    })
  }),

  http.get(`${BASE_URL}/engines`, async () => {
    await delay(160)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      total: mockEngines.length,
      data: mockEngines,
    })
  }),

  http.get(`${BASE_URL}/models`, async ({ request }) => {
    await delay(160)
    const url = new URL(request.url)
    const provider = url.searchParams.get('provider')?.trim()
    const data = provider
      ? mockModelGroups.filter((group) => group.provider === provider)
      : mockModelGroups
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      total: data.reduce((sum, group) => sum + group.items.length, 0),
      provider: data.map((group) => group.provider),
      data,
    })
  }),
]
