const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANDROID_SDK = path.join(process.env.HOME, '.bubblewrap/android_sdk');
const JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64';
const BASE_DIR = path.join(__dirname, 'apk-builds');
const KEYSTORE_PASSWORD = 'nearbystores123';
const KEY_ALIAS = 'nearbystores';

const APPS = [
    {
        name: 'NearbyStores',
        packageId: 'com.nearbystores.customer',
        dir: 'customer',
        host: 'nearbystores.vercel.app',
        startUrl: '/home',
        themeColor: '#ff6b35',
        backgroundColor: '#ffffff',
        iconSrc: path.join(__dirname, 'frontend/public/icons/customer-192.png'),
    },
    {
        name: 'NS Partner',
        packageId: 'com.nearbystores.partner',
        dir: 'partner',
        host: 'nearbystores.vercel.app',
        startUrl: '/partner/login',
        themeColor: '#f97316',
        backgroundColor: '#ffffff',
        iconSrc: path.join(__dirname, 'frontend/public/icons/partner-192.png'),
    },
    {
        name: 'NS Admin',
        packageId: 'com.nearbystores.admin',
        dir: 'admin',
        host: 'nearbystores.vercel.app',
        startUrl: '/admin/login',
        themeColor: '#1a1a2e',
        backgroundColor: '#1a1a2e',
        iconSrc: path.join(__dirname, 'frontend/public/icons/admin-192.png'),
    },
];

function hexToArgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#FF${hex.slice(1).toUpperCase()}`;
}

function createProject(app) {
    const appDir = path.join(BASE_DIR, app.dir);
    const pkgPath = app.packageId.replace(/\./g, '/');

    console.log(`\n📁 Creating ${app.name} project...`);

    // Create directory structure
    const dirs = [
        `${appDir}/app/src/main/java/${pkgPath}`,
        `${appDir}/app/src/main/res/values`,
        `${appDir}/app/src/main/res/mipmap-xxxhdpi`,
        `${appDir}/app/src/main/res/xml`,
        `${appDir}/gradle/wrapper`,
    ];
    dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

    // Copy icon
    if (fs.existsSync(app.iconSrc)) {
        fs.copyFileSync(app.iconSrc, `${appDir}/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`);
    }

    // settings.gradle
    fs.writeFileSync(`${appDir}/settings.gradle`, `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${app.name.replace(/\s/g, '')}"
include ':app'
`);

    // Root build.gradle
    fs.writeFileSync(`${appDir}/build.gradle`, `
plugins {
    id 'com.android.application' version '8.2.0' apply false
}
`);

    // App build.gradle
    fs.writeFileSync(`${appDir}/app/build.gradle`, `
plugins {
    id 'com.android.application'
}

android {
    namespace '${app.packageId}'
    compileSdk 34

    defaultConfig {
        applicationId "${app.packageId}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        manifestPlaceholders = [
            hostName: "${app.host}",
            defaultUrl: "https://${app.host}${app.startUrl}",
            launcherName: "${app.name}",
            assetStatements: '[{ "relation": ["delegate_permission/common.handle_all_urls"], "target": { "namespace": "web", "site": "https://${app.host}" } }]'
        ]
    }

    signingConfigs {
        release {
            storeFile file('../nearbystores.keystore')
            storePassword '${KEYSTORE_PASSWORD}'
            keyAlias '${KEY_ALIAS}'
            keyPassword '${KEYSTORE_PASSWORD}'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.browser:browser:1.7.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
`);

    // AndroidManifest.xml
    fs.writeFileSync(`${appDir}/app/src/main/AndroidManifest.xml`, `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="\${launcherName}"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <meta-data
            android:name="asset_statements"
            android:value='\${assetStatements}' />

        <activity
            android:name=".LauncherActivity"
            android:exported="true"
            android:theme="@style/AppTheme.Splash">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="\${hostName}" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`);

    // LauncherActivity.java - uses Custom Tabs (Chrome) for TWA-like experience
    fs.writeFileSync(`${appDir}/app/src/main/java/${pkgPath}/LauncherActivity.java`, `
package ${app.packageId};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import android.graphics.Color;

public class LauncherActivity extends Activity {
    private static final String URL = "https://${app.host}${app.startUrl}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        CustomTabColorSchemeParams colorParams = new CustomTabColorSchemeParams.Builder()
                .setToolbarColor(Color.parseColor("${app.themeColor}"))
                .build();

        CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                .setDefaultColorSchemeParams(colorParams)
                .setShowTitle(true)
                .setUrlBarHidingEnabled(true)
                .build();

        customTabsIntent.launchUrl(this, Uri.parse(URL));
        finish();
    }
}
`);

    // styles.xml
    fs.writeFileSync(`${appDir}/app/src/main/res/values/styles.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:statusBarColor">${hexToArgb(app.themeColor)}</item>
        <item name="android:navigationBarColor">${hexToArgb(app.backgroundColor)}</item>
    </style>
    <style name="AppTheme.Splash" parent="AppTheme">
        <item name="android:windowBackground">@color/splashBackground</item>
    </style>
</resources>
`);

    // colors.xml
    fs.writeFileSync(`${appDir}/app/src/main/res/values/colors.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splashBackground">${app.backgroundColor}</color>
    <color name="themeColor">${app.themeColor}</color>
</resources>
`);

    // strings.xml
    fs.writeFileSync(`${appDir}/app/src/main/res/values/strings.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${app.name}</string>
</resources>
`);

    // gradle-wrapper.properties
    fs.writeFileSync(`${appDir}/gradle/wrapper/gradle-wrapper.properties`, `
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

    // gradle.properties
    fs.writeFileSync(`${appDir}/gradle.properties`, `
android.useAndroidX=true
org.gradle.jvmargs=-Xmx2048m
`);

    console.log(`   ✅ Project created`);
}

function generateKeystore(app) {
    const keystorePath = path.join(BASE_DIR, app.dir, 'nearbystores.keystore');
    if (fs.existsSync(keystorePath)) {
        console.log(`   🔑 Keystore already exists`);
        return;
    }
    console.log(`   🔑 Generating keystore...`);
    execSync(`keytool -genkeypair -v -keystore "${keystorePath}" -alias ${KEY_ALIAS} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${KEYSTORE_PASSWORD} -keypass ${KEYSTORE_PASSWORD} -dname "CN=NearbyStores, OU=Dev, O=NearbyStores, L=City, S=State, C=IN"`, {
        env: { ...process.env, JAVA_HOME },
        stdio: 'pipe',
    });
    console.log(`   ✅ Keystore generated`);
}

function downloadGradleWrapper(app) {
    const appDir = path.join(BASE_DIR, app.dir);
    const wrapperJar = path.join(appDir, 'gradle/wrapper/gradle-wrapper.jar');

    if (fs.existsSync(wrapperJar)) {
        console.log(`   📦 Gradle wrapper already exists`);
        return;
    }

    console.log(`   📥 Downloading Gradle wrapper...`);

    // Create a minimal gradlew script
    const gradlewContent = `#!/bin/sh
GRADLE_HOME="\${HOME}/.gradle"
GRADLE_VERSION="8.5"
GRADLE_DIR="\${GRADLE_HOME}/wrapper/dists/gradle-\${GRADLE_VERSION}-bin"
GRADLE_BIN="\${GRADLE_DIR}/gradle-\${GRADLE_VERSION}/bin/gradle"

if [ ! -f "\${GRADLE_BIN}" ]; then
    echo "Downloading Gradle \${GRADLE_VERSION}..."
    mkdir -p "\${GRADLE_DIR}"
    curl -L -o /tmp/gradle.zip "https://services.gradle.org/distributions/gradle-\${GRADLE_VERSION}-bin.zip"
    unzip -qo /tmp/gradle.zip -d "\${GRADLE_DIR}"
    rm /tmp/gradle.zip
fi

exec "\${GRADLE_BIN}" "\$@"
`;
    fs.writeFileSync(`${appDir}/gradlew`, gradlewContent, { mode: 0o755 });
    console.log(`   ✅ Gradle wrapper created`);
}

function buildApk(app) {
    const appDir = path.join(BASE_DIR, app.dir);
    console.log(`\n🔨 Building ${app.name} APK...`);

    const env = {
        ...process.env,
        JAVA_HOME,
        ANDROID_HOME: ANDROID_SDK,
        ANDROID_SDK_ROOT: ANDROID_SDK,
        PATH: `${JAVA_HOME}/bin:${ANDROID_SDK}/cmdline-tools/latest/bin:${ANDROID_SDK}/build-tools/34.0.0:${process.env.PATH}`,
    };

    try {
        execSync(`${appDir}/gradlew assembleRelease --no-daemon -Porg.gradle.java.home=${JAVA_HOME}`, {
            cwd: appDir,
            env,
            stdio: 'inherit',
            timeout: 10 * 60 * 1000, // 10 min
        });

        const apkPath = path.join(appDir, 'app/build/outputs/apk/release/app-release.apk');
        if (fs.existsSync(apkPath)) {
            const destName = `NearbyStores-${app.dir}.apk`;
            const destPath = path.join(BASE_DIR, destName);
            fs.copyFileSync(apkPath, destPath);
            console.log(`   ✅ APK: ${destPath}`);
            return destPath;
        } else {
            console.log(`   ❌ APK not found at expected location`);
            return null;
        }
    } catch (err) {
        console.error(`   ❌ Build failed: ${err.message}`);
        return null;
    }
}

// Main
console.log('🚀 NearbyStores APK Builder (Direct Gradle)\n');

for (const app of APPS) {
    createProject(app);
    generateKeystore(app);
    downloadGradleWrapper(app);
}

console.log('\n\n📦 Building all APKs...\n');

const results = {};
for (const app of APPS) {
    results[app.name] = buildApk(app);
}

console.log('\n\n📋 Final Summary:');
for (const [name, apkPath] of Object.entries(results)) {
    if (apkPath) {
        const size = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1);
        console.log(`  ✅ ${name}: ${apkPath} (${size} MB)`);
    } else {
        console.log(`  ❌ ${name}: Failed`);
    }
}
