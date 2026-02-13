import ExpoModulesCore
import Network

public class EscPosPrinterModule: Module {
  var connection: NWConnection?

  public func definition() -> ModuleDefinition {
    Name("EscPosPrinterModule")

    Function("connectNetwork") { (host: String, port: Int) in
      self.connect(host: host, port: port)
    }

    Function("print") { (data: [UInt8]) in
      self.send(data: Data(data))
    }

    Function("disconnect") {
      self.disconnect()
    }

    Function("scanUsbDevices") {
      // Not supported on standard iOS without MFi or special entitlements
      return []
    }
    
    Function("connectUsb") { (vendorId: Int, productId: Int) in
      // Not supported
      throw Exception(name: "NotSupported", description: "USB Printing not supported on iOS")
    }
  }

  private func connect(host: String, port: Int) {
    disconnect()
    let options = NWProtocolTCP.Options()
    let parameters = NWParameters(tls: nil, tcp: options)
    connection = NWConnection(host: NWEndpoint.Host(host), port: NWEndpoint.Port(rawValue: UInt16(port))!, using: parameters)
    connection?.start(queue: .global())
  }

  private func send(data: Data) {
    connection?.send(content: data, completion: .contentProcessed({ error in
      if let error = error {
        print("Send error: \(error)")
      }
    }))
  }

  private func disconnect() {
    connection?.cancel()
    connection = nil
  }
}
