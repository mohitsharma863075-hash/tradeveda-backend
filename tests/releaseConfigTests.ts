import fs from 'fs';
import path from 'path';

export function runReleaseConfigTests(assert: (cond: boolean, desc: string) => void) {
  console.log('\n--- 20. Android Release Build & Signing Security Tests ---');

  const appBuildGradlePath = path.resolve('android/app/build.gradle');
  assert(fs.existsSync(appBuildGradlePath), 'android/app/build.gradle exists');

  const buildGradleContent = fs.readFileSync(appBuildGradlePath, 'utf-8');
  assert(buildGradleContent.includes('signingConfigs'), 'signingConfigs block is configured in android/app/build.gradle');
  assert(buildGradleContent.includes('keystore.properties'), 'Reads signing configuration from untracked keystore.properties');
  assert(buildGradleContent.includes('System.getenv("KEYSTORE_PATH")'), 'Supports environment variables (KEYSTORE_PATH, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)');
  assert(!buildGradleContent.match(/storePassword\s+["'][^"']+["']/), 'No hardcoded keystore passwords in android/app/build.gradle');
  assert(!buildGradleContent.match(/keyPassword\s+["'][^"']+["']/), 'No hardcoded key passwords in android/app/build.gradle');

  console.log('\n--- 21. ProGuard / R8 Rules & Git Security ---');

  const proguardPath = path.resolve('android/app/proguard-rules.pro');
  const proguardContent = fs.readFileSync(proguardPath, 'utf-8');
  assert(proguardContent.includes('-keep public class * extends com.getcapacitor.Plugin'), 'ProGuard preserves Capacitor plugin reflection');
  assert(proguardContent.includes('@android.webkit.JavascriptInterface'), 'ProGuard preserves WebView JavaScriptInterface methods');
  assert(proguardContent.includes('SourceFile,LineNumberTable'), 'ProGuard retains line numbers for production stack trace mapping');

  const rootGitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf-8');
  const androidGitignore = fs.readFileSync(path.resolve('android/.gitignore'), 'utf-8');

  assert(rootGitignore.includes('*.keystore') && rootGitignore.includes('*.jks'), 'Root .gitignore excludes *.keystore and *.jks');
  assert(rootGitignore.includes('keystore.properties'), 'Root .gitignore excludes keystore.properties');
  assert(androidGitignore.includes('*.keystore') && androidGitignore.includes('*.jks'), 'android/.gitignore excludes *.keystore and *.jks');
  assert(androidGitignore.includes('keystore.properties'), 'android/.gitignore excludes keystore.properties');

  console.log('\n--- 22. Target SDK & Template Compliance ---');

  const variablesPath = path.resolve('android/variables.gradle');
  const variablesContent = fs.readFileSync(variablesPath, 'utf-8');
  assert(variablesContent.includes('targetSdkVersion = 36') || variablesContent.includes('targetSdkVersion = 35'), 'Target SDK is 35 or 36 (compliant with Google Play requirements)');
  assert(variablesContent.includes('minSdkVersion = 24'), 'Min SDK is 24 (Android 7.0+)');

  const exampleKeystoreProps = path.resolve('android/keystore.properties.example');
  assert(fs.existsSync(exampleKeystoreProps), 'android/keystore.properties.example template exists');
}
