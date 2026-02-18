import Foundation
import Capacitor

@objc(ScreenProtectionPlugin)
public class ScreenProtectionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenProtectionPlugin"
    public let jsName = "ScreenProtection"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enableProtection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disableProtection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showToast", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isScreenBeingCaptured", returnType: CAPPluginReturnPromise)
    ]
    
    private var isMonitoring = false
    
    @objc func enableProtection(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if !self.isMonitoring {
                NotificationCenter.default.addObserver(
                    self,
                    selector: #selector(self.screenCaptureDidChange),
                    name: UIScreen.capturedDidChangeNotification,
                    object: nil
                )
                self.isMonitoring = true
            }
            call.resolve()
        }
    }
    
    @objc func disableProtection(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if self.isMonitoring {
                NotificationCenter.default.removeObserver(
                    self,
                    name: UIScreen.capturedDidChangeNotification,
                    object: nil
                )
                self.isMonitoring = false
            }
            call.resolve()
        }
    }
    
    @objc func showToast(_ call: CAPPluginCall) {
        let message = call.getString("message") ?? "Screen recording is not allowed"
        
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: nil,
                message: message,
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            
            if let viewController = self.bridge?.viewController {
                viewController.present(alert, animated: true)
            }
            call.resolve()
        }
    }
    
    @objc func isScreenBeingCaptured(_ call: CAPPluginCall) {
        let isCaptured = UIScreen.main.isCaptured
        call.resolve(["isCaptured": isCaptured])
    }
    
    @objc private func screenCaptureDidChange() {
        if UIScreen.main.isCaptured {
            self.notifyListeners("screenCaptureChanged", data: ["isCaptured": true])
            
            DispatchQueue.main.async {
                let alert = UIAlertController(
                    title: "Screen Recording Not Allowed",
                    message: "Screen recording is not allowed in this app",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                
                if let viewController = self.bridge?.viewController {
                    viewController.present(alert, animated: true)
                }
            }
        } else {
            self.notifyListeners("screenCaptureChanged", data: ["isCaptured": false])
        }
    }
    
    deinit {
        if isMonitoring {
            NotificationCenter.default.removeObserver(self)
        }
    }
}
