const IS_IOS = process.env.EAS_BUILD_PLATFORM === 'ios';

// iOS-only plugins go in iosPlugins, Android-only in androidPlugins.
// Both-platform plugins go directly in the plugins array.
const iosPlugins = [
  // Add iOS-only plugins here, e.g. 'react-native-purchases'
];

const androidPlugins = [
  // Add Android-only plugins here
];

module.exports = {
  expo: {
    name: "Clean Plate",
    slug: "CleanPlate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "cleanplate",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#22B35E",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.cleanplateai.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#22B35E",
      },
      edgeToEdgeEnabled: false,
      package: "com.cleanplateai.app",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Clean Plate to access your photos to scan menus.",
          cameraPermission: "Allow Clean Plate to take photos of restaurant menus.",
        },
      ],
      ...(IS_IOS ? iosPlugins : androidPlugins),
    ],
    extra: {
      router: {},
      eas: {
        projectId: "841acbbb-9ed2-4088-b3a5-88f92538a9b0",
      },
    },
    owner: "super60",
  },
};
