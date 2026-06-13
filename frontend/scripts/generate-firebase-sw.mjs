import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const outputPath = resolve(process.cwd(), "public/firebase-messaging-sw.js");

function loadEnvFile(path) {
  const values = {};

  try {
    let content = readFileSync(path, "utf8");
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }
  } catch {
    console.warn(`Could not read ${path}. Using process.env fallbacks.`);
  }

  return values;
}

function getEnvValue(env, key) {
  return env[key] ?? process.env[key] ?? "";
}

const env = loadEnvFile(envPath);

const firebaseConfig = {
  apiKey: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvValue(env, "NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const vapidKey = getEnvValue(env, "NEXT_PUBLIC_FIREBASE_VAPID_KEY");

const swContent = `/* Auto-generated from .env.local. Do not edit directly. */
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig, null, 2)});

const messaging = firebase.messaging();

// VAPID key for token generation
const VAPID_KEY = "${vapidKey}";

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {};
  const title = notification.title ?? "Stik";
  const options = {
    body: notification.body ?? "",
    icon: notification.icon ?? "/next.svg",
    data: payload.data ?? {},
  };

  self.registration.showNotification(title, options);
});
`;

writeFileSync(outputPath, swContent, "utf8");
console.log(`Generated ${outputPath}`);
