package com.shadangakriya.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HeadphonePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
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
    }
}
