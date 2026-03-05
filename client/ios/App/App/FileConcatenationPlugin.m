#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FileConcatenationPlugin, "FileConcatenation",
    CAP_PLUGIN_METHOD(concatenateFiles, CAPPluginReturnPromise);
)
