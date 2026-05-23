package com.vibeapp.finance;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        int nightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = (nightMode == Configuration.UI_MODE_NIGHT_YES);
        String theme = isDark ? "dark" : "light";

        // Programmatically update navigation bar — theme XML only applies at Activity creation
        updateNavigationBar(isDark);

        // Push current theme to the WebView so React can react immediately
        Bridge bridge = getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                String js = String.format(
                    "window.dispatchEvent(new CustomEvent('nativeThemeChange', { detail: { theme: '%s' } }))",
                    theme
                );
                webView.evaluateJavascript(js, null);
            }
        }
    }

    private void updateNavigationBar(boolean isDark) {
        Window window = getWindow();
        if (window == null) return;

        int navColor = isDark ? Color.parseColor("#1A1A1A") : Color.parseColor("#FFFFFF");
        window.setNavigationBarColor(navColor);

        // On API 26+ also set the divider color
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            int dividerColor = isDark ? Color.parseColor("#333333") : Color.parseColor("#E0E0E0");
            window.setNavigationBarDividerColor(dividerColor);
        }

        // Light navigation bar icons for light background, dark icons for dark background
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int visibility = window.getDecorView().getSystemUiVisibility();
            if (isDark) {
                // Dark background → use light navigation bar icons
                visibility &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            } else {
                // Light background → use dark navigation bar icons
                visibility |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(visibility);
        }
    }
}
