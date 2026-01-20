import Foundation
import Capacitor
import AVFoundation

@objc(HeadphoneDetection)
public class HeadphoneDetectionPlugin: CAPPlugin {
    
    // MARK: - Headphone Detection
    
    @objc func isConnected(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        
        var isConnected = false
        var deviceType = "none"
        
        // Check current route for external audio outputs
        let currentRoute = session.currentRoute
        for output in currentRoute.outputs {
            switch output.portType {
            case .headphones:
                isConnected = true
                deviceType = "wired_headphones"
            case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP:
                isConnected = true
                deviceType = "bluetooth"
            case .usbAudio:
                isConnected = true
                deviceType = "usb_audio"
            case .airPlay:
                isConnected = true
                deviceType = "airplay"
            default:
                break
            }
        }
        
        call.resolve([
            "isConnected": isConnected,
            "deviceType": deviceType
        ])
    }
    
    // MARK: - Audio Session Configuration
    
    @objc func requestExclusiveAudioFocus(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            
            // Configure for meditation playback:
            // - .playback: Allows audio to continue in background
            // - .duckOthers: Reduces volume of other audio (ducking)
            // - .interruptSpokenAudioAndMixWithOthers: Interrupts speech (like podcasts) and can mix
            try session.setCategory(
                .playback,
                mode: .spokenAudio,
                options: [.duckOthers, .interruptSpokenAudioAndMixWithOthers]
            )
            
            try session.setActive(true, options: [.notifyOthersOnDeactivation])
            
            call.resolve([
                "granted": true,
                "message": "Audio session configured for exclusive playback with ducking enabled."
            ])
        } catch {
            call.resolve([
                "granted": false,
                "message": "Failed to configure audio session: \(error.localizedDescription)"
            ])
        }
    }
    
    @objc func abandonAudioFocus(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setActive(false, options: [.notifyOthersOnDeactivation])
            
            call.resolve([
                "released": true
            ])
        } catch {
            call.resolve([
                "released": false
            ])
        }
    }
    
    // MARK: - Silent Mode Check
    
    @objc func isRingerSilent(_ call: CAPPluginCall) {
        // iOS doesn't have a public API to check ringer/silent switch
        // We can only recommend the user to enable silent mode
        // Returning "unknown" mode since we can't detect it
        call.resolve([
            "isSilent": false,
            "mode": "unknown"
        ])
    }
    
    // MARK: - Airplane Mode (iOS can only use network status as proxy)
    
    @objc func isAirplaneModeEnabled(_ call: CAPPluginCall) {
        // iOS doesn't expose airplane mode status directly
        // This is handled by the TypeScript fallback using @capacitor/network
        call.resolve([
            "isEnabled": false  // Fallback - TypeScript will use network check
        ])
    }
}
