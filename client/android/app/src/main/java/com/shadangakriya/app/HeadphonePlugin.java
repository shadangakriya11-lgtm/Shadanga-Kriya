package com.shadangakriya.app;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HeadphoneDetection")
public class HeadphonePlugin extends Plugin {

    @PluginMethod
    public void isConnected(PluginCall call) {
        try {
            Context context = getContext();
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

            boolean isConnected = false;
            String deviceType = "none";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Android 6.0+ - Use AudioDeviceInfo
                AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                for (AudioDeviceInfo device : devices) {
                    int type = device.getType();
                    if (type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES) {
                        isConnected = true;
                        deviceType = "wired_headphones";
                        break;
                    } else if (type == AudioDeviceInfo.TYPE_WIRED_HEADSET) {
                        isConnected = true;
                        deviceType = "wired_headset";
                        break;
                    } else if (type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                        isConnected = true;
                        deviceType = "usb_headset";
                        break;
                    } else if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) {
                        isConnected = true;
                        deviceType = "bluetooth_a2dp";
                        break;
                    } else if (type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                        isConnected = true;
                        deviceType = "bluetooth_sco";
                        break;
                    }
                }
            } else {
                // Fallback for older Android versions
                if (audioManager.isWiredHeadsetOn()) {
                    isConnected = true;
                    deviceType = "wired";
                } else if (audioManager.isBluetoothA2dpOn()) {
                    isConnected = true;
                    deviceType = "bluetooth";
                }
            }

            JSObject result = new JSObject();
            result.put("isConnected", isConnected);
            result.put("deviceType", deviceType);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error detecting headphones: " + e.getMessage());
        }
    }
}