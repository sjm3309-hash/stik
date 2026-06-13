"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { firebaseConfig, firebaseVapidKey } from "@/lib/firebase/config";
import { getSupabaseClient } from "@/lib/supabase/client";

type NotificationStatus =
  | "idle"
  | "unsupported"
  | "requesting"
  | "granted"
  | "denied"
  | "error";

function getPlatformLabel() {
  if (typeof navigator === "undefined") return "web";

  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "web";
}

export default function NotificationSetup() {
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [message, setMessage] = useState("알림 권한을 확인하는 중입니다...");

  useEffect(() => {
    let cancelled = false;

    async function registerPushNotifications() {
      if (typeof window === "undefined") return;

      const supported = await isSupported().catch(() => false);
      if (!supported) {
        if (!cancelled) {
          setStatus("unsupported");
          setMessage("이 브라우저는 Firebase 푸시 알림을 지원하지 않습니다.");
        }
        return;
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        if (!cancelled) {
          setStatus("unsupported");
          setMessage("이 환경에서는 알림 또는 Service Worker를 사용할 수 없습니다.");
        }
        return;
      }

      if (!firebaseVapidKey) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            "NEXT_PUBLIC_FIREBASE_VAPID_KEY가 .env.local에 설정되어 있지 않습니다.",
          );
        }
        return;
      }

      try {
        setStatus("requesting");
        setMessage("알림 권한을 요청하는 중입니다...");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          if (!cancelled) {
            setStatus("denied");
            setMessage("알림 권한이 거부되었습니다.");
          }
          return;
        }

        const app =
          getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          throw new Error("FCM token was not returned.");
        }

        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { error } = await supabase.from("user_devices").upsert({
          user_id: user.id,
          fcm_token: token,
          platform: getPlatformLabel(),
        }, {
          onConflict: 'fcm_token'
        });

        if (error) {
          throw error;
        }

        // 포그라운드 메시지 리스너 설정
        onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          
          // 브라우저 알림 표시
          if (payload.notification) {
            const notificationTitle = payload.notification.title || "Stik 알림";
            const notificationOptions = {
              body: payload.notification.body || "",
              icon: "/icon.png",
              badge: "/badge.png",
              tag: "stik-alert",
              requireInteraction: true,
            };
            
            if (Notification.permission === "granted") {
              new Notification(notificationTitle, notificationOptions);
            }
          }
        });

        if (!cancelled) {
          setStatus("granted");
          setMessage("알림이 활성화되었습니다. 이 기기가 등록되었습니다.");
        }
      } catch (error) {
        console.error("Failed to register push notifications:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          code: (error as any).code,
          toString: String(error),
        });

        if (!cancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "알림 등록 중 오류가 발생했습니다.",
          );
        }
      }
    }

    void registerPushNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  // 알림은 백그라운드에서 등록되지만 UI는 표시하지 않음
  return null;
}
