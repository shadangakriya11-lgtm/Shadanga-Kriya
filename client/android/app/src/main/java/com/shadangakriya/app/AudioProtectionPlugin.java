package com.shadangakriya.app;

import android.content.Context;
import android.hardware.display.DisplayManager;
import android.media.AudioManager;
import android.os.Handler;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "AudioProtection")
public class AudioProtectionPlugin extends Plugin {
    private static final String TAG = "AudioProtection";
    private Handler handler;
    private Runnable screenRecordingChecker;
    private boolean isMonitoring = false;
    private boolean wasRecordingDetected = false;
    private AudioManager audioManager;

    @Override
    public void load() {
        super.load();
        handler = new Handler();
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void startMonitoring(PluginCall call) {
        if (!isMonitoring) {
            isMonitoring = true;
            startScreenRecordingDetection();
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void stopMonitoring(PluginCall call) {
        if (isMonitoring) {
            isMonitoring = false;
            if (handler != null && screenRecordingChecker != null) {
                handler.removeCallbacks(screenRecordingChecker);
            }
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void isScreenRecording(PluginCall call) {
        boolean isRecording = checkScreenRecording();
        JSObject ret = new JSObject();
        ret.put("isRecording", isRecording);
        call.resolve(ret);
    }

    private void startScreenRecordingDetection() {
        screenRecordingChecker = new Runnable() {
            @Override
            public void run() {
                if (!isMonitoring) {
                    return;
                }

                boolean isRecording = checkScreenRecording();
                
                if (isRecording && !wasRecordingDetected) {
                    // Screen recording just started
                    wasRecordingDetected = true;
                    Log.d(TAG, "Screen recording detected - notifying web layer");
                    notifyScreenRecordingStarted();
                } else if (!isRecording && wasRecordingDetected) {
                    // Screen recording stopped
                    wasRecordingDetected = false;
                    Log.d(TAG, "Screen recording stopped - notifying web layer");
                    notifyScreenRecordingStopped();
                }

                // Check every 500ms for faster detection
                handler.postDelayed(this, 500);
            }
        };
        handler.post(screenRecordingChecker);
    }

    private boolean checkScreenRecording() {
        try {
            // Check for virtual displays (screen recording creates virtual displays)
            DisplayManager displayManager = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
            if (displayManager != null) {
                android.view.Display[] displays = displayManager.getDisplays();
                for (android.view.Display display : displays) {
                    if (display.getDisplayId() != android.view.Display.DEFAULT_DISPLAY) {
                        // Virtual display detected - likely screen recording
                        Log.d(TAG, "Virtual display detected: " + display.getDisplayId());
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking screen recording", e);
        }
        return false;
    }

    private void notifyScreenRecordingStarted() {
        JSObject data = new JSObject();
        data.put("isRecording", true);
        notifyListeners("screenRecordingChanged", data);
    }

    private void notifyScreenRecordingStopped() {
        JSObject data = new JSObject();
        data.put("isRecording", false);
        notifyListeners("screenRecordingChanged", data);
    }

    @Override
    protected void handleOnDestroy() {
        if (handler != null && screenRecordingChecker != null) {
            handler.removeCallbacks(screenRecordingChecker);
        }
        super.handleOnDestroy();
    }
}
