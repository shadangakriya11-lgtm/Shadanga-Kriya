#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(HeadphoneDetection, "HeadphoneDetection",
           CAP_PLUGIN_METHOD(isConnected, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isAirplaneModeEnabled, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestExclusiveAudioFocus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(abandonAudioFocus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isRingerSilent, CAPPluginReturnPromise);
)
