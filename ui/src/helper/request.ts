import axios, { ResponseType } from 'axios'
import { useGeneralStore } from '@/stores/general'

export const getUrl = async (url: string): Promise<string> => {
  const store = useGeneralStore()
  const userDocument = await store.getDataBaseDocument()
  return /https?:\/\/.+/i.test(url) ? url : `${userDocument.apiUrl}${url}`
}

export const getHeaders = async (headers = {}) => {
  const store = useGeneralStore()
  const databaseDocument = await store.getDataBaseDocument()
  const token = databaseDocument?.token
  return {
    ...(token ? { 'authentication-token': `${token}` } : {}),
    ...headers
  }
}

export const requestHelper = {
  async get (url: string, params?: any, headers = {}, responseType?:ResponseType) {
    const builtHeaders = await getHeaders(headers)
    const getResult = await axios.get(await getUrl(url), {
      params,
      headers: builtHeaders,
      responseType
    })
    if (getResult && getResult.data) return getResult.data
    else if (getResult) return getResult
  },
  async post (url?: string | any, params?: any, headers = {}) {
    const builtHeaders = await getHeaders(headers)
    if (url) {
      const postResult = await axios.post(
        await getUrl(url), params, { headers: builtHeaders, responseType: (params && params.responseType) || undefined }
      )
      if (postResult && postResult.data) return postResult.data
      else if (postResult) return postResult
    }
  },
  async put (url: string, params?: any, headers = {}) {
    const builtHeaders = await getHeaders(headers)
    return (
      await axios.put(
        await getUrl(url),
        params, { headers: builtHeaders }
      )
    ).data
  },
  async delete (url: string, params?: any, headers = {}) {
    const builtHeaders = await getHeaders(headers)
    return (
      await axios.delete(
        await getUrl(url),
        { params, headers: builtHeaders }
      )
    ).data
  },
  async patch (url: string, params?: any, headers = {}) {
    const builtHeaders = await getHeaders(headers)
    return (
      await axios.patch(
        await getUrl(url),
        params, { headers: builtHeaders }
      )
    ).data
  }
}
