#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ScreenProtectionPlugin, "ScreenProtection",
    CAP_PLUGIN_METHOD(enableProtection, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(disableProtection, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showToast, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isScreenBeingCaptured, CAPPluginReturnPromise);
)
