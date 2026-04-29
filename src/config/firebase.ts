import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT!,
) as ServiceAccount;
initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

export const messaging = getMessaging();
