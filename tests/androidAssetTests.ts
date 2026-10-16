import fs from 'fs';
import path from 'path';

export function runAndroidAssetTests(assert: (cond: boolean, desc: string) => void) {
  console.log('\n--- 17. Android Launcher & Adaptive Icon Validation ---');

  const resDir = path.resolve('android/app/src/main/res');

  const densities = [
    { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const { folder } of densities) {
    const launcherPath = path.join(resDir, folder, 'ic_launcher.png');
    const roundPath = path.join(resDir, folder, 'ic_launcher_round.png');
    const fgPath = path.join(resDir, folder, 'ic_launcher_foreground.png');

    assert(fs.existsSync(launcherPath) && fs.statSync(launcherPath).size > 0, `${folder}/ic_launcher.png exists and is non-empty`);
    assert(fs.existsSync(roundPath) && fs.statSync(roundPath).size > 0, `${folder}/ic_launcher_round.png exists and is non-empty`);
    assert(fs.existsSync(fgPath) && fs.statSync(fgPath).size > 0, `${folder}/ic_launcher_foreground.png exists and is non-empty`);
  }

  // Adaptive Icon XML Resources
  const icLauncherXml = path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml');
  const icLauncherRoundXml = path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml');
  const icLauncherMonochromeXml = path.join(resDir, 'drawable', 'ic_launcher_monochrome.xml');
  const icLauncherBgXml = path.join(resDir, 'drawable', 'ic_launcher_background.xml');

  assert(fs.existsSync(icLauncherXml), 'mipmap-anydpi-v26/ic_launcher.xml exists');
  assert(fs.existsSync(icLauncherRoundXml), 'mipmap-anydpi-v26/ic_launcher_round.xml exists');
  assert(fs.existsSync(icLauncherMonochromeXml), 'drawable/ic_launcher_monochrome.xml exists for Android 13+ themed icons');
  assert(fs.existsSync(icLauncherBgXml), 'drawable/ic_launcher_background.xml exists');

  // Verify monochrome tag is present in adaptive-icon
  const xmlContent = fs.readFileSync(icLauncherXml, 'utf-8');
  assert(xmlContent.includes('<monochrome'), 'ic_launcher.xml specifies monochrome drawable for dynamic Material You theming');

  console.log('\n--- 18. Android Splash Screen Assets Validation ---');

  const splashFolders = [
    'drawable',
    'drawable-port-mdpi',
    'drawable-port-hdpi',
    'drawable-port-xhdpi',
    'drawable-port-xxhdpi',
    'drawable-port-xxxhdpi',
    'drawable-land-mdpi',
    'drawable-land-hdpi',
    'drawable-land-xhdpi',
    'drawable-land-xxhdpi',
    'drawable-land-xxxhdpi',
  ];

  for (const folder of splashFolders) {
    const splashPath = path.join(resDir, folder, 'splash.png');
    assert(fs.existsSync(splashPath) && fs.statSync(splashPath).size > 0, `${folder}/splash.png exists and is non-empty`);
  }

  console.log('\n--- 19. Android Manifest & Permissions Compliance ---');

  const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
  assert(fs.existsSync(manifestPath), 'AndroidManifest.xml exists');

  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  assert(manifestContent.includes('android.permission.INTERNET'), 'Includes android.permission.INTERNET');
  assert(manifestContent.includes('android.permission.ACCESS_NETWORK_STATE'), 'Includes android.permission.ACCESS_NETWORK_STATE');
  assert(!manifestContent.includes('android.permission.READ_CONTACTS'), 'Does not request unneeded READ_CONTACTS permission');
  assert(!manifestContent.includes('android.permission.ACCESS_FINE_LOCATION'), 'Does not request unneeded ACCESS_FINE_LOCATION permission');
  assert(!manifestContent.includes('android.permission.CAMERA'), 'Does not request unneeded CAMERA permission');

  const stringsPath = path.resolve('android/app/src/main/res/values/strings.xml');
  const stringsContent = fs.readFileSync(stringsPath, 'utf-8');
  assert(stringsContent.includes('<string name="app_name">TradeVeda</string>'), 'app_name is TradeVeda');
  assert(stringsContent.includes('<string name="package_name">in.tradeveda.app</string>'), 'package_name is in.tradeveda.app');
}
