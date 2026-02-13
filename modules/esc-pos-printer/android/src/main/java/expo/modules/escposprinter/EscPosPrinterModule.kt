package expo.modules.escposprinter

import android.content.Context
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.OutputStream
import java.net.Socket
import android.util.Base64

class EscPosPrinterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React Context is null")

  private var socket: Socket? = null
  private var outputStream: OutputStream? = null

  // USB Implementation
  private var usbConnection: UsbDeviceConnection? = null
  private var usbEndpoint: UsbEndpoint? = null
  private var usbInterface: UsbInterface? = null

  override fun definition() = ModuleDefinition {
    Name("EscPosPrinterModule")

    Function("connectNetwork") { host: String, port: Int ->
      disconnect()
      CoroutineScope(Dispatchers.IO).launch {
        try {
          socket = Socket(host, port)
          outputStream = socket?.getOutputStream()
        } catch (e: Exception) {
          throw Exception("Failed to connect to network printer: ${e.message}")
        }
      }
    }

    Function("scanUsbDevices") {
      val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
      val devices = usbManager.deviceList.values.toList()
      devices.map { device ->
        mapOf(
          "deviceId" to device.deviceId,
          "vendorId" to device.vendorId,
          "productId" to device.productId,
          "deviceName" to device.deviceName
        )
      }
    }

    Function("connectUsb") { vendorId: Int, productId: Int ->
      disconnect()
      val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
      val device = usbManager.deviceList.values.find { it.vendorId == vendorId && it.productId == productId }
        ?: throw Exception("Device not found")

      if (!usbManager.hasPermission(device)) {
        // In a real app, you'd request permission here via PendingIntent and a BroadcastReceiver,
        // but for synchronous module calls, this is complex.
        // Assuming permission is granted or user handles it.
        throw Exception("USB Permission not granted for device $device")
      }

      // Find interface and endpoint
      var endpoint: UsbEndpoint? = null
      var intf: UsbInterface? = null

      for (i in 0 until device.interfaceCount) {
        val iface = device.getInterface(i)
        // Look for printer class (7) or vendor specific
        if (iface.interfaceClass == UsbConstants.USB_CLASS_PRINTER || iface.interfaceClass == UsbConstants.USB_CLASS_VENDOR_SPEC) {
          for (j in 0 until iface.endpointCount) {
             val ep = iface.getEndpoint(j)
             if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.direction == UsbConstants.USB_DIR_OUT) {
                endpoint = ep
                intf = iface
                break
             }
          }
        }
        if (endpoint != null) break
      }

      if (endpoint == null) throw Exception("No suitable endpoint found")

      val connection = usbManager.openDevice(device) ?: throw Exception("Failed to open USB device connection")
      connection.claimInterface(intf, true)

      usbConnection = connection
      usbEndpoint = endpoint
      usbInterface = intf
    }

    Function("print") { data: List<Int> ->
      val bytes = data.map { it.toByte() }.toByteArray()
      sendBytes(bytes)
    }
    
    Function("printBase64") { base64: String ->
      val bytes = Base64.decode(base64, Base64.DEFAULT)
      sendBytes(bytes)
    }

    Function("disconnect") {
      disconnect()
    }
  }

  private fun sendBytes(bytes: ByteArray) {
    if (socket != null && socket!!.isConnected) {
      CoroutineScope(Dispatchers.IO).launch {
        try {
          outputStream?.write(bytes)
          outputStream?.flush()
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    } else if (usbConnection != null && usbEndpoint != null) {
      // Bulk transfer is blocking, run in background
       CoroutineScope(Dispatchers.IO).launch {
          usbConnection?.bulkTransfer(usbEndpoint, bytes, bytes.size, 5000)
       }
    } else {
      throw Exception("Printer not connected")
    }
  }

  private fun disconnect() {
    try {
      outputStream?.close()
      socket?.close()
      
      if (usbConnection != null && usbInterface != null) {
        usbConnection?.releaseInterface(usbInterface)
        usbConnection?.close()
      }
    } catch (e: Exception) {
      // Ignore
    } finally {
      socket = null
      outputStream = null
      usbConnection = null
      usbEndpoint = null
      usbInterface = null
    }
  }
}
