import 'dotenv/config';

export default {
  expo: {
    name: "Timvis AI",
    scheme: "worksight",
    slug: "worksight",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    extra: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      googleClientIds: {
        androidClientId: process.env.ANDROID_CLIENT_ID,
        iosClientId: process.env.IOS_CLIENT_ID,
        webClientId: process.env.WEB_CLIENT_ID,
      },
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: "08b31fc6-e45d-4865-b1f6-867c938c8c27"
      }
    },
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    platforms: ["ios", "android"],
    android: {
      package: "com.timvis.app",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#FFFFFF"
      }
    },
    ios: {
      bundleIdentifier: "com.timvis.app",
      buildNumber: "1"
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};