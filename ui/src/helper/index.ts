import { requestHelper } from '@/helper/request'
import { useGeneralStore } from '@/stores/general'
import * as NodeBuffer from 'buffer'

const handleDesordens = async (savedFilters) => {
  const store = useGeneralStore()
  const database = await store.getDataBaseDocument()
  for (const savedFilter of savedFilters) {
    if (Array.isArray(savedFilter.attachments) && savedFilter.attachments.length) {
      for (const attachment of savedFilter.attachments) {
        if (attachment.data) {
          const buffer = await NodeBuffer.Buffer.from(attachment.data)
          attachment.base64 = `data:image/jpeg;base64, ${buffer.toString('base64')}`
        }
      }
      savedFilter.attachments = savedFilter.attachments.reverse()
    }
  }
  for (const filter of database.filterResult) {
    if (savedFilters.find(filter => filter.objectid === filter.objectid)) {
      const index = savedFilters.indexOf(savedFilters.find(filter => filter.objectid === filter.objectid))
      savedFilters[index] = { ...savedFilters[index], ...filter }
    }
  }
  await database.incrementalUpdate({
    $set: {
      filterResult: savedFilters
    }
  })
}

export const getDesordens = async (dialog) => {
  const store = useGeneralStore()
  const database = await store.getDataBaseDocument()
  const userDocument = (await store.getDataBaseDocument()).toJSON()
  const { info: savedFilters } = await requestHelper.post('sspdf/desordem/filtro-desordem/find', {
    usuario: userDocument.id
  })
  if (database.filterResult.length && database.filterResult.find(desordem => !desordem.syncronized && desordem.changed)) {
    dialog({
      title: 'Atenção',
      message: 'Existem informações coletadas ainda não sincronizadas com o servidor. Esta ação fará com que qualquer registro ainda não sincronizadao seja perdido, deseja realmente continuar?',
      cancel: 'Cancelar',
      ok: 'Sim',
      persistent: true
    }).onOk(async () => {
      await handleDesordens(savedFilters)
    })
  } else {
    await handleDesordens(savedFilters)
  }
}

export const clearSelection = async () => {
  try {
    const store = useGeneralStore()
    const database = await store.getDataBaseDocument()
    const userDocument = (await store.getDataBaseDocument()).toJSON()
    const { info: savedFilters } = await requestHelper.post('sspdf/desordem/filtro-desordem/find', {
      usuario: userDocument.id
    })
    await requestHelper.post('sspdf/desordem/filtro-desordem/delete', {
      id: savedFilters.map((s: { id: never }) => s.id)
    })
    await database.incrementalUpdate({
      $set: {
        filterResult: []
      }
    })
    return true
  } catch (e) {
    return e
  }
}

export const debounce = (fn, delay) => {
  let timeoutID = null
  return function () {
    clearTimeout(timeoutID)
    const args = arguments
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this
    timeoutID = setTimeout(function () {
      fn.apply(that, args)
    }, delay)
  }
}

export const getTipoDesordens = async (tipo: 'Física' | 'Social') => {
  const { info: { rows: desordensResult } } = await requestHelper.post('sspdf/tipo-desordem/find', { tipo })
  return desordensResult
}

export const updateDesordem = async (desordem: DesordemEditPayloadInterface, attachments) => {
  try {
    const { info: updatedDesordem } = await requestHelper.post('sspdf/desordem/update', desordem)
    const attachmentFormData = new FormData()
    if (Array.isArray(attachments) && attachments.length && updatedDesordem) {
      for (const attach of attachments) {
        if (attach.attachmentid) {
          attachmentFormData.append('attachmentId', updatedDesordem[0].objectid)
          attachmentFormData.append('contentType', attach.contentType)
          attachmentFormData.append('attachments', attach)
          await requestHelper.post('sspdf/desordem-attach/add', attachmentFormData)
        } else {
          attachmentFormData.append('objectid', updatedDesordem[0].objectid)
          attachmentFormData.append('attachments', attach)
          await requestHelper.post('sspdf/desordem-attach/add', attachmentFormData)
        }
      }
    }
    return updatedDesordem
  } catch (e) {
    console.error(e)
    throw new Error(e)
  }
}
