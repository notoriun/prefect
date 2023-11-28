
/**
 * State
 */

interface UserDataInterface {
  name: string
}
export interface GeneralStoreInterface {
  version: string
  loadingPulse: boolean
  isDebugger: boolean
  userData: UserDataInterface | null
}
