// WebUSB API type declarations
declare global {
  interface Navigator {
    usb: USB
  }
}

interface USB extends EventTarget {
  getDevices(): Promise<USBDevice[]>
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
}

interface USBDevice {
  readonly vendorId: number
  readonly productId: number
  readonly productName?: string
  readonly manufacturerName?: string
  readonly serialNumber?: string
  readonly configuration: USBConfiguration | null
  readonly configurations: USBConfiguration[]
  
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  releaseInterface(interfaceNumber: number): Promise<void>
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[]
}

interface USBDeviceFilter {
  vendorId?: number
  productId?: number
  classCode?: number
  subclassCode?: number
  protocolCode?: number
  serialNumber?: string
}

interface USBConfiguration {
  readonly configurationValue: number
  readonly configurationName?: string
  readonly interfaces: USBInterface[]
}

interface USBInterface {
  readonly interfaceNumber: number
  readonly alternates: USBAlternateInterface[]
}

interface USBAlternateInterface {
  readonly alternateSetting: number
  readonly interfaceClass: number
  readonly interfaceSubclass: number
  readonly interfaceProtocol: number
  readonly interfaceName?: string
  readonly endpoints: USBEndpoint[]
}

interface USBEndpoint {
  readonly endpointNumber: number
  readonly direction: 'in' | 'out'
  readonly type: 'bulk' | 'interrupt' | 'isochronous'
  readonly packetSize: number
}

interface USBOutTransferResult {
  readonly status: 'ok' | 'stall' | 'babble'
  readonly bytesWritten: number
}

export {}