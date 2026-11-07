package com.dm.qqp;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.ReactPackage;

import java.util.Collections;
import java.util.List;

public final class AppLoggerPackage implements ReactPackage {
    @Override public List<NativeModule> createNativeModules(ReactApplicationContext context) {
        return Collections.<NativeModule>singletonList(new AppLoggerModule(context));
    }

    @Override public List<ViewManager> createViewManagers(ReactApplicationContext context) {
        return Collections.<ViewManager>emptyList();
    }

    private static final class AppLoggerModule extends ReactContextBaseJavaModule {
        AppLoggerModule(ReactApplicationContext context) { super(context); }
        @Override public String getName() { return "AppLogger"; }

        @ReactMethod public void log(final String message) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override public void run() { CrashLogger.log(getReactApplicationContext(), message); }
            });
        }
    }
}
