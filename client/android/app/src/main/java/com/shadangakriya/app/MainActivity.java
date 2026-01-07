package com.shadangakriya.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HeadphonePlugin.class);
        super.onCreate(savedInstanceState);
    }
}