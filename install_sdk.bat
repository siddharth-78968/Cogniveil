@echo off
set ANDROID_HOME=C:\Users\siddf\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\siddf\AppData\Local\Android\Sdk
echo Installing Android SDK Platform 34 and Build Tools 34.0.0...
echo y | C:\Users\siddf\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\Users\siddf\AppData\Local\Android\Sdk "platform-tools" "platforms;android-34" "build-tools;34.0.0"
echo Accepting all Android SDK licenses...
echo y | C:\Users\siddf\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\Users\siddf\AppData\Local\Android\Sdk --licenses
echo SDK installation complete!
