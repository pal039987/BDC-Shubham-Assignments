package com.cryptotrader.pro;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            // Configure status bar and navigation bar colors to obsidian black (#080b11)
            Window window = getWindow();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.setStatusBarColor(Color.parseColor("#080b11"));
                window.setNavigationBarColor(Color.parseColor("#080b11"));
            }

            // Ensure status bar icons and navigation icons are LIGHT (white) for obsidian dark mode
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
            }

            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setSupportZoom(false);
                settings.setBuiltInZoomControls(false);
                settings.setDisplayZoomControls(false);
                settings.setUseWideViewPort(false);
                settings.setLoadWithOverviewMode(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                // Inject exact status bar safe-area height directly into document
                int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
                int statusBarHeightPx = resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : 0;
                float density = getResources().getDisplayMetrics().density;
                int statusBarDp = density > 0 ? (int) (statusBarHeightPx / density) : 38;
                if (statusBarDp < 32) statusBarDp = 38;

                final int finalStatusBarDp = statusBarDp;
                webView.post(() -> {
                    try {
                        String js = "try { " +
                            "document.documentElement.classList.add('is-native-apk', 'is-mobile-app'); " +
                            "document.documentElement.style.setProperty('--safe-area-inset-top', '" + finalStatusBarDp + "px'); " +
                            "} catch(e) {}";
                        webView.evaluateJavascript(js, null);
                    } catch (Exception ignored) {}
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.onPause();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.onResume();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
