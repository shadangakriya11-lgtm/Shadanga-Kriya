package com.shadangakriya.app;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;

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

            // minSdkVersion is 24, so AudioDeviceInfo API is always available
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

            JSObject result = new JSObject();
            result.put("isConnected", isConnected);
            result.put("deviceType", deviceType);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error detecting headphones: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isAirplaneModeEnabled(PluginCall call) {
        try {
            Context context = getContext();
            boolean isEnabled = android.provider.Settings.Global.getInt(
                context.getContentResolver(), 
                android.provider.Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
            
            JSObject result = new JSObject();
            result.put("isEnabled", isEnabled);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error checking airplane mode: " + e.getMessage());
        }
    }

    // Store the audio focus change listener for later release
    private AudioManager.OnAudioFocusChangeListener audioFocusListener = null;

    @PluginMethod
    public void requestExclusiveAudioFocus(PluginCall call) {
        try {
            Context context = getContext();
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

            // Create a listener for audio focus changes
            audioFocusListener = new AudioManager.OnAudioFocusChangeListener() {
                @Override
                public void onAudioFocusChange(int focusChange) {
                    // We could notify JS here if needed, but for exclusive we just hold focus
                    if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                        // Another app took focus permanently - rare during exclusive
                    } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                        // Temporary loss (e.g., phone call) - we'll re-request when call ends
                    }
                }
            };

            // Request EXCLUSIVE transient audio focus
            // This will pause/duck ALL other audio apps completely
            int result = audioManager.requestAudioFocus(
                audioFocusListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
            );

            JSObject response = new JSObject();
            if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                response.put("granted", true);
                response.put("message", "Exclusive audio focus granted. Other apps are silenced.");
            } else {
                response.put("granted", false);
                response.put("message", "Audio focus request denied.");
            }
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Error requesting audio focus: " + e.getMessage());
        }
    }

    @PluginMethod
    public void abandonAudioFocus(PluginCall call) {
        try {
            if (audioFocusListener != null) {
                Context context = getContext();
                AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
                audioManager.abandonAudioFocus(audioFocusListener);
                audioFocusListener = null;
            }
            JSObject result = new JSObject();
            result.put("released", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error abandoning audio focus: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isRingerSilent(PluginCall call) {
        try {
            Context context = getContext();
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            int ringerMode = audioManager.getRingerMode();

            boolean isSilent = (ringerMode == AudioManager.RINGER_MODE_SILENT || 
                                ringerMode == AudioManager.RINGER_MODE_VIBRATE);
            
            String modeName;
            switch (ringerMode) {
                case AudioManager.RINGER_MODE_SILENT:
                    modeName = "silent";
                    break;
                case AudioManager.RINGER_MODE_VIBRATE:
                    modeName = "vibrate";
                    break;
                default:
                    modeName = "normal";
            }

            JSObject result = new JSObject();
            result.put("isSilent", isSilent);
            result.put("mode", modeName);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error checking ringer mode: " + e.getMessage());
        }
    }
}