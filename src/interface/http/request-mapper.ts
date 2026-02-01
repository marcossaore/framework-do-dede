import type { Request } from "@/http/http-server";

type BodyFilter = 'none' | 'restrict'

type RouteInputConfig = {
  params?: string[]
  query?: string[]
  headers?: string[]
  body?: string[]
  bodyFilter?: BodyFilter
}

type HttpInput = {
  headers: any
  body: any
  params: any
  query: any
}

export class HttpRequestMapper {
  map(input: HttpInput, config: RouteInputConfig): Request {
    const filterParams = this.filter(input.params, config.params)
    const filterQueryParams = this.filter(input.query, config.query)
    const filterHeaders = this.filter(input.headers, config.headers)
    const normalizeBody = this.normalizeBracketNotation(input.body)
    let filterBody = this.filter(normalizeBody, config.body)
    if (config.bodyFilter !== 'restrict') {
      filterBody = { ...normalizeBody, ...filterBody }
    }
    const mergedParams = { ...filterHeaders, ...filterParams, ...filterQueryParams, ...filterBody }
    return { data: mergedParams, context: {} }
  }

  private filter(params: any, filterParams?: string[]): any {
    const filter: any = {}
    for (const paramName of filterParams || []) {
      const [paramNameFiltered, type] = paramName.split('|')
      let value = params[paramName] ?? params[paramNameFiltered]
      if (value === undefined || value === null) continue
      if (type === 'boolean' && typeof value !== 'boolean') value = value === 'true'
      if (type === 'integer' && typeof value === 'string' && [/^0-9$/.test(value)]) {
        value = value.replace(/[^0-9]/g, '')
        value = value ? parseInt(value) : 0
      }
      if (type === 'number' && typeof value === 'string' && [/^0-9$/.test(value)]) value = parseFloat(value)
      if (type === 'string') value = value.toString()
      filter[paramNameFiltered] = value
    }
    return filter
  }

  private normalizeBracketNotation(data: any): any {
    if (!data || typeof data !== "object") return data;
    const normalized: Record<string, any> = {};
    for (const [rawKey, value] of Object.entries(data)) {
      const key = String(rawKey);
      const match = key.match(/^([^\[\]]+)\[([^\[\]]+)\]$/);
      if (match) {
        const parent = match[1];
        const child = match[2];
        if (!normalized[parent] || typeof normalized[parent] !== "object") {
          normalized[parent] = {};
        }
        normalized[parent][child] = value;
        continue;
      }
      normalized[key] = value;
    }
    return normalized;
  }
}
