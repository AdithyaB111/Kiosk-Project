package expo.modules.paxterminal

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Log
import com.google.gson.Gson

// POSLink Semi-Integration SDK imports
import com.pax.poscore.commsetting.TcpSetting
import com.pax.poslinksemiintegration.POSLinkSemi
import com.pax.poslinksemiintegration.Terminal
import com.pax.poslinksemiintegration.transaction.DoCreditRequest
import com.pax.poslinksemiintegration.transaction.DoDebitRequest
import com.pax.poslinksemiintegration.batch.BatchCloseRequest

class PaxTerminalModule : Module() {
    private val TAG = "PaxTerminalModule"
    private val gson = Gson()

    private var terminal: Terminal? = null
    private var ipAddress: String = ""
    private var port: Int = 10009
    private var isInitialized: Boolean = false

    override fun definition() = ModuleDefinition {
        Name("PaxTerminal")

        // ═══════════════════════════════════════════════════════════════════
        // COMMUNICATION SETTINGS
        // ═══════════════════════════════════════════════════════════════════

        AsyncFunction("setTcpSetting") { ip: String, p: Int, timeout: Int ->
            Log.d(TAG, "=== setTcpSetting START ===")
            Log.d(TAG, "Setting TCP: $ip:$p (timeout: ${timeout}s)")

            ipAddress = ip
            port = p

            try {
                val timeoutMs = timeout * 1000

                // Clean up any existing terminal
                terminal?.let {
                    try {
                        POSLinkSemi.getInstance().removeTerminal(it)
                    } catch (e: Exception) {
                        Log.w(TAG, "removeTerminal warning: ${e.message}")
                    }
                    terminal = null
                    isInitialized = false
                }

                // PAX SDK requires an Activity context (not applicationContext)
                val activity = appContext.currentActivity
                val ctx = activity ?: appContext.reactContext
                if (ctx == null) {
                    Log.e(TAG, "✗ No context available")
                    throw Exception("No Android context available. Please try again.")
                }
                Log.d(TAG, "Using context: ${ctx.javaClass.simpleName}")

                // POSLinkSemi doesn't require explicit init in this SDK version
                Log.d(TAG, "Creating TcpSetting($ip, ${p.toString()}, $timeoutMs)")
                val tcpSetting = TcpSetting(ip, p.toString(), timeoutMs)
                
                Log.d(TAG, "Getting terminal from POSLinkSemi...")
                // Try with Activity context first
                terminal = POSLinkSemi.getInstance().getTerminal(ctx, tcpSetting)
                
                // If that returned null and we used reactContext, try with activity
                if (terminal == null && activity != null && ctx !== activity) {
                    Log.d(TAG, "Retrying with Activity context...")
                    terminal = POSLinkSemi.getInstance().getTerminal(activity, tcpSetting)
                }
                
                if (terminal != null) {
                    Log.d(TAG, "✓ Terminal created successfully!")
                    isInitialized = true
                    true
                } else {
                    Log.e(TAG, "✗ Terminal is NULL after getTerminal()")
                    throw Exception("POSLinkSemi.getTerminal returned null. Check that the PAX SDK JARs are correct and the device supports POSLink.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "setTcpSetting error: ${e.javaClass.simpleName}: ${e.message}", e)
                throw e
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // MANAGEMENT OPERATIONS
        // ═══════════════════════════════════════════════════════════════════

        AsyncFunction("init") {
            Log.d(TAG, "=== init START ===")

            try {
                if (!isInitialized) {
                    return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Terminal not initialized. Call setTcpSetting first."}"""
                }

                val t = terminal ?: return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Terminal not initialized"}"""
                val res = t.manage.init()
                if (res.isSuccessful && res.response() != null) {
                    gson.toJson(res.response())
                } else {
                    val errorMsg = res.message() ?: "Init failed"
                    """{"ResponseCode":"ERROR","ResponseMessage":"$errorMsg"}"""
                }
            } catch (e: Exception) {
                Log.e(TAG, "init error: ${e.message}", e)
                """{"ResponseCode":"ERROR","ResponseMessage":"${e.message ?: "Error"}"}"""
            }
        }

        AsyncFunction("handshake") {
            Log.d(TAG, "=== handshake ===")

            try {
                val t = terminal
                if (t != null) {
                    val res = t.manage.init()
                    res.isSuccessful
                } else {
                    false
                }
            } catch (e: Exception) {
                Log.e(TAG, "handshake error: ${e.message}", e)
                false
            }
        }

        AsyncFunction("cancel") {
            Log.d(TAG, "=== cancel ===")
            try {
                terminal?.cancel()
            } catch (e: Exception) {
                Log.e(TAG, "cancel error: ${e.message}", e)
            }
        }

        AsyncFunction("remove") {
            Log.d(TAG, "=== remove ===")
            try {
                terminal?.let { POSLinkSemi.getInstance().removeTerminal(it) }
                terminal = null
                isInitialized = false
            } catch (e: Exception) {
                Log.e(TAG, "remove error: ${e.message}", e)
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // TRANSACTION OPERATIONS
        // ═══════════════════════════════════════════════════════════════════

        AsyncFunction("doCredit") { jsonStr: String ->
            Log.d(TAG, "=== doCredit START ===")
            Log.d(TAG, "doCredit: Request JSON=$jsonStr")

            try {
                if (!isInitialized) {
                    return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                }

                val t = terminal ?: return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                val req = gson.fromJson(jsonStr, DoCreditRequest::class.java)
                Log.d(TAG, "doCredit: Sending transaction...")
                val res = t.transaction.doCredit(req)
                Log.d(TAG, "doCredit: Response successful=${res.isSuccessful}")
                if (res.isSuccessful && res.response() != null) {
                    val jsonResponse = gson.toJson(res.response())
                    Log.d(TAG, "doCredit: Success=$jsonResponse")
                    jsonResponse
                } else {
                    val errorMsg = res.message() ?: "Failed"
                    """{"ResponseCode":"ERROR","ResponseMessage":"$errorMsg"}"""
                }
            } catch (e: Exception) {
                Log.e(TAG, "doCredit error: ${e.message}", e)
                """{"ResponseCode":"ERROR","ResponseMessage":"${e.message ?: "Error"}"}"""
            }
        }

        AsyncFunction("doDebit") { jsonStr: String ->
            Log.d(TAG, "=== doDebit START ===")
            Log.d(TAG, "doDebit: Request JSON=$jsonStr")

            try {
                if (!isInitialized) {
                    return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                }

                val t = terminal ?: return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                val req = gson.fromJson(jsonStr, DoDebitRequest::class.java)
                val res = t.transaction.doDebit(req)
                if (res.isSuccessful && res.response() != null) {
                    gson.toJson(res.response())
                } else {
                    """{"ResponseCode":"ERROR","ResponseMessage":"${res.message() ?: "Failed"}"}"""
                }
            } catch (e: Exception) {
                """{"ResponseCode":"ERROR","ResponseMessage":"${e.message ?: "Error"}"}"""
            }
        }

        AsyncFunction("doGift") { jsonStr: String ->
            Log.d(TAG, "=== doGift START ===")
            Log.d(TAG, "doGift: Request JSON=$jsonStr")

            try {
                if (!isInitialized) {
                    return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                }

                val t = terminal ?: return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                val req = gson.fromJson(jsonStr, DoCreditRequest::class.java)
                Log.d(TAG, "doGift: Sending gift card transaction...")
                val res = t.transaction.doCredit(req)
                Log.d(TAG, "doGift: Response successful=${res.isSuccessful}")
                if (res.isSuccessful && res.response() != null) {
                    val jsonResponse = gson.toJson(res.response())
                    Log.d(TAG, "doGift: Success=$jsonResponse")
                    jsonResponse
                } else {
                    val errorMsg = res.message() ?: "Failed"
                    """{"ResponseCode":"ERROR","ResponseMessage":"$errorMsg"}"""
                }
            } catch (e: Exception) {
                Log.e(TAG, "doGift error: ${e.message}", e)
                """{"ResponseCode":"ERROR","ResponseMessage":"${e.message ?: "Error"}"}"""
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // BATCH OPERATIONS
        // ═══════════════════════════════════════════════════════════════════

        AsyncFunction("batchClose") { jsonStr: String ->
            Log.d(TAG, "=== batchClose ===")

            try {
                val t = terminal ?: return@AsyncFunction """{"ResponseCode":"ERROR","ResponseMessage":"Not initialized"}"""
                val req = gson.fromJson(jsonStr, BatchCloseRequest::class.java) ?: BatchCloseRequest.Builder().build()
                val res = t.batch.batchClose(req)
                if (res.isSuccessful && res.response() != null) {
                    gson.toJson(res.response())
                } else {
                    """{"ResponseCode":"ERROR","ResponseMessage":"${res.message() ?: "Failed"}"}"""
                }
            } catch (e: Exception) {
                """{"ResponseCode":"ERROR","ResponseMessage":"${e.message ?: "Error"}"}"""
            }
        }

        AsyncFunction("getSdkVersion") {
            try {
                "POSLink Semi-Integration Android v1.0.0" 
            } catch (e: Exception) {
                "Unknown"
            }
        }
    }
}
