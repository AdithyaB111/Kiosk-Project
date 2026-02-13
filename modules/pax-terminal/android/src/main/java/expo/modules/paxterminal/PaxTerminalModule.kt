package expo.modules.paxterminal

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// TODO: Uncomment imports when PAX POSLink SDK is added to the project
// import com.pax.poslink.PosLink
// import com.pax.poslink.CommSetting
// import com.pax.poslink.PaymentRequest
// import com.pax.poslink.PaymentResponse
// import com.pax.poslink.ProcessTransResult

class PaxTerminalModule : Module() {
  // private var posLink: PosLink? = null
  private var ipAddress: String = "192.168.1.100"
  private var port: Int = 10009
  private var commType: String = "TCP" // TCP, HTTP, HTTPS

  override fun definition() = ModuleDefinition {
    Name("PaxTerminal")

    // Initialize the PAX Terminal Connection
    AsyncFunction("initialize") { ip: String, p: Int ->
      ipAddress = ip
      port = p
      
      // TODO: Initialize PosLink
      // posLink = PosLink(context)
      // val commSetting = CommSetting()
      // commSetting.type = CommSetting.TCP
      // commSetting.destIp = ip
      // commSetting.destPort = p.toString()
      // commSetting.timeout = "60000"
      // posLink?.commSetting = commSetting

      println("PaxTerminal: Initialized connection to $ip:$p")
      return@AsyncFunction true
    }

    // Process a payment transaction
    AsyncFunction("processPayment") { request: Map<String, Any?> ->
      // Offload to IO thread
      return@AsyncFunction withContext(Dispatchers.IO) {
        // TODO: Uncomment implementation with SDK
        /*
        if (posLink == null) {
            throw Exception("PosLink not initialized. Call initialize() first.")
        }
        
        val pr = PaymentRequest()
        pr.TenderType = PaymentRequest.ParseTenderType("CREDIT") // Default to Credit
        pr.TransType = PaymentRequest.ParseTransType(request["transactionType"] as? String ?: "SALE")
        pr.Amount = ((request["amount"] as? Number)?.toDouble()?.times(100)?.toInt() ?: 0).toString() // Amount in cents? Check SDK docs usually takes String "10.00" or cents
        pr.ECRRefNum = request["referenceNumber"] as? String ?: "REF${System.currentTimeMillis()}"
        
        posLink!!.PaymentRequest = pr
        
        val result = posLink!!.ProcessTrans()
        
        if (result.Code == ProcessTransResult.Code.OK) {
            val res = posLink!!.PaymentResponse
            return@withContext mapOf(
                "status" to if (res.ResultCode == "000000") "APPROVED" else "DECLINED",
                "authCode" to res.AuthCode,
                "referenceNumber" to res.HostRefNum, // Host Ref
                "cardNumber" to res.Pan,
                "cardType" to res.CardType,
                "message" to res.Message,
                "approvedAmount" to res.ApprovedAmount.toDoubleOrNull(),
                "rawResponse" to res.toString() // Or structured map
            )
        } else {
            return@withContext mapOf(
                "status" to "ERROR",
                "message" to result.Msg
            )
        }
        */

        // MOCK IMPLEMENTATION FOR DEVELOPMENT
        println("PaxTerminal: Mock Processing Payment...")
        Thread.sleep(2000) // Simulate delay
        return@withContext mapOf(
            "status" to "APPROVED",
            "authCode" to "MOCK123456",
            "referenceNumber" to "MOCKREF${System.currentTimeMillis()}",
            "cardNumber" to "************4242",
            "cardType" to "VISA",
            "message" to "APPROVED",
            "approvedAmount" to (request["amount"] as? Number)?.toDouble() ?: 0.0
        )
      }
    }
  }
}
