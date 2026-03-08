import { get } from './baseService'

export function getInfo() {
  return get<string>('/info')
}
