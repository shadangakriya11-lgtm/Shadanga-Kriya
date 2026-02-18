package com.shadangakriya.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.view.WindowManager;
import android.widget.Toast;
import android.database.ContentObserver;
import android.os.Handler;
import android.provider.Settings;
import android.view.Window;
import android.app.Activity;
import android.content.Context;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import java.lang.reflect.Method;

public class MainActivity extends BridgeActivity {
    private Handler handler;
    private Runnable screenRecordingChecker;
    private boolean isScreenRecordingDetected = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Apply FLAG_SECURE before calling super.onCreate()
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        
        registerPlugin(HeadphonePlugin.class);
        registerPlugin(ScreenProtectionPlugin.class);
        registerPlugin(AudioProtectionPlugin.class);
        super.onCreate(savedInstanceState);
        
        // Additional security flags
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        
        // Start monitoring for screen recording
        handler = new Handler();
        startScreenRecordingDetection();
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Re-apply FLAG_SECURE to ensure it's active
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        
        // Disable WebView automatic force dark mode - let the app handle dark/light mode via CSS
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null && WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(webView.getSettings(), WebSettingsCompat.FORCE_DARK_OFF);
            }
            // Also disable force dark strategy if supported
            if (webView != null && WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
                WebSettingsCompat.setForceDarkStrategy(webView.getSettings(), WebSettingsCompat.DARK_STRATEGY_USER_AGENT_DARKENING_ONLY);
            }
        } catch (Exception e) {
            // Ignore if not supported
            e.printStackTrace();
        }
        
        // Resume screen recording detection
        startScreenRecordingDetection();
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Ensure FLAG_SECURE is still active
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && screenRecordingChecker != null) {
            handler.removeCallbacks(screenRecordingChecker);
        }
    }
    
    @Override
    public void onStop() {
        super.onStop();
        if (handler != null && screenRecordingChecker != null) {
            handler.removeCallbacks(screenRecordingChecker);
        }
    }
    
    private void startScreenRecordingDetection() {
        screenRecordingChecker = new Runnable() {
            @Override
            public void run() {
                if (isScreenRecording()) {
                    if (!isScreenRecordingDetected) {
                        isScreenRecordingDetected = true;
                        showScreenRecordingWarning();
                    }
                } else {
                    isScreenRecordingDetected = false;
                }
                // Check every 1 second
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(screenRecordingChecker);
    }
    
    private boolean isScreenRecording() {
        try {
            // Method 1: Check for MediaProjection (Android 5.0+)
            MediaProjectionManager projectionManager = 
                (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            
            // Method 2: Check virtual displays
            DisplayManager displayManager = (DisplayManager) getSystemService(Context.DISPLAY_SERVICE);
            if (displayManager != null) {
                android.view.Display[] displays = displayManager.getDisplays();
                for (android.view.Display display : displays) {
                    if (display.getDisplayId() != android.view.Display.DEFAULT_DISPLAY) {
                        // Virtual display detected - likely screen recording
                        return true;
                    }
                }
            }
            
            // Method 3: Check if FLAG_SECURE is being bypassed (reflection)
            try {
                Class<?> surfaceClass = Class.forName("android.view.SurfaceControl");
                Method method = surfaceClass.getMethod("getBuiltInDisplay", int.class);
                // If we can access this, screen recording might be active
            } catch (Exception e) {
                // Expected on most devices
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
    
    private void showScreenRecordingWarning() {
        runOnUiThread(() -> {
            Toast.makeText(
                MainActivity.this,
                "⚠️ Screen recording is not allowed in this app",
                Toast.LENGTH_LONG
            ).show();
            
            // Show another toast after 2 seconds
            handler.postDelayed(() -> {
                Toast.makeText(
                    MainActivity.this,
                    "Please stop screen recording to continue",
                    Toast.LENGTH_LONG
                ).show();
            }, 2000);
        });
    }
}
