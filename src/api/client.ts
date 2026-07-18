import type { paths } from './generated/schema'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type JsonBody<Path extends keyof paths, Method extends 'post'> =
  paths[Path][Method] extends {
    requestBody: { content: { 'application/json': infer Body } }
  }
    ? Body
    : never

type JsonResponse<Path extends keyof paths, Method extends 'post'> =
  paths[Path][Method] extends {
    responses: { 200: { content: { 'application/json': infer Body } } }
  }
    ? Body
    : never

export async function postJson<Path extends keyof paths>(
  path: Path,
  body: JsonBody<Path, 'post'>,
): Promise<JsonResponse<Path, 'post'>> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    throw new ApiError('Network error contacting the API', 0, cause)
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      `API request to ${path} failed with status ${response.status}`,
      response.status,
      data,
    )
  }

  return data as JsonResponse<Path, 'post'>
}
