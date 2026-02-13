import ExpoModulesCore
import Foundation

// TODO: Import PAX SDK when added (e.g. import PaxPosLink)

public class PaxTerminalModule: Module {
  private var ipAddress: String = "192.168.1.100"
  private var port: Int = 10009
  
  public func definition() -> ModuleDefinition {
    Name("PaxTerminal")

    AsyncFunction("initialize") { (ip: String, port: Int) -> Bool in
      self.ipAddress = ip
      self.port = port
      
      // TODO: Initialize POSLink
      // let commSetting = CommSetting()
      // commSetting.setType("TCP")
      // commSetting.setDestIP(ip)
      // commSetting.setDestPort(String(port))
      // commSetting.setTimeOut("60000")
      // posLink.setCommSetting(commSetting)
      
      print("PaxTerminal iOS: Initialized connection to \(ip):\(port)")
      return true
    }

    AsyncFunction("processPayment") { (request: [String: Any]) -> [String: Any] in
        // TODO: Implement POSLink payment request logic here using the SDK
        // This is a Placeholder mock implementation
        
        print("PaxTerminal iOS: Processing mockup payment for \(request["amount"] ?? 0.0)")
        
        // Simulate network delay
        Thread.sleep(forTimeInterval: 2.0)
        
        return [
            "status": "APPROVED",
            "authCode": "MOCKIOS123",
            "referenceNumber": "MOCKREF\(Int(Date().timeIntervalSince1970))",
            "cardNumber": "************1111",
            "cardType": "MASTERCARD",
            "message": "APPROVED MOCK",
            "approvedAmount": request["amount"] as? Double ?? 0.0
        ]
    }
  }
}
