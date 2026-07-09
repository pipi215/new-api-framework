/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { api } from '@/lib/api'

import type { TokenUsage, TokenUsageLog } from './types'

// Authorization header builder for token-key authenticated requests.
function authHeader(key: string): { Authorization: string } {
  const normalized = key.startsWith('Bearer ') ? key : `Bearer ${key}`
  return { Authorization: normalized }
}

/**
 * Query token usage summary (quota granted/used/available, expiry, ...).
 * The endpoint authenticates via the token key itself; no session required.
 * Note: this endpoint returns `{ code, message, data }` (not `success`),
 * so we bypass the business-error interceptor and handle errors manually.
 */
export async function getTokenUsage(
  key: string
): Promise<{ ok: boolean; message: string; data?: TokenUsage }> {
  try {
    const res = await api.get('/api/usage/token/', {
      headers: authHeader(key),
      skipBusinessError: true,
      skipErrorHandler: true,
      disableDuplicate: true,
    })
    const body = res.data
    if (body.code === true) {
      return { ok: true, message: body.message ?? 'ok', data: body.data }
    }
    return { ok: false, message: body.message || 'Invalid token' }
  } catch (err) {
    const message =
      err?.response?.data?.message || err?.message || 'Request failed'
    return { ok: false, message }
  }
}

/**
 * Query the recent usage logs for a token key.
 * The endpoint authenticates via the token key itself; no session required.
 */
export async function getTokenLogs(
  key: string
): Promise<{ ok: boolean; message: string; data?: TokenUsageLog[] }> {
  try {
    const res = await api.get('/api/log/token', {
      headers: authHeader(key),
      skipBusinessError: true,
      skipErrorHandler: true,
      disableDuplicate: true,
    })
    const body = res.data
    if (body.success === true) {
      return { ok: true, message: body.message ?? '', data: body.data ?? [] }
    }
    return { ok: false, message: body.message || 'Invalid token' }
  } catch (err) {
    const message =
      err?.response?.data?.message || err?.message || 'Request failed'
    return { ok: false, message }
  }
}
