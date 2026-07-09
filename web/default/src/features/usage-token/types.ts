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
/**
 * Type definitions for the public token usage query page.
 */

export interface TokenUsage {
  object: string
  name: string
  total_granted: number
  total_used: number
  total_available: number
  unlimited_quota: boolean
  model_limits: Record<string, unknown>
  model_limits_enabled: boolean
  expires_at: number
}

export interface TokenUsageLog {
  id: number
  created_at: number
  type: number
  content: string
  model_name: string
  quota: number
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
  token_name: string
  request_id?: string
  other?: string
}
