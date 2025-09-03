// WebUSB API types for USB printing
declare global {
  interface Navigator {
    usb?: {
      requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>
      getDevices(): Promise<USBDevice[]>
    }
  }

  interface USBDevice {
    vendorId: number
    productId: number
    configurations: USBConfiguration[]
    open(): Promise<void>
    close(): Promise<void>
    selectConfiguration(configurationValue: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    releaseInterface(interfaceNumber: number): Promise<void>
    transferOut(endpointNumber: number, data: ArrayBuffer | ArrayBufferView): Promise<USBOutTransferResult>
  }

  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[]
  }

  interface USBDeviceFilter {
    vendorId?: number
    productId?: number
  }

  interface USBConfiguration {
    interfaces: USBInterface[]
  }

  interface USBInterface {
    interfaceNumber: number
    endpoints: USBEndpoint[]
  }

  interface USBEndpoint {
    endpointNumber: number
    direction: 'in' | 'out'
    type: string
  }

  interface USBOutTransferResult {
    status: string
    bytesWritten: number
  }
}

export {}