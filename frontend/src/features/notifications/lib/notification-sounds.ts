import { Notification } from '../api/notifications.api';

type NotificationSound = 'payment' | 'order' | 'report' | 'client' | 'default';

let audioContext: AudioContext | null = null;
let lastPlayedAt = 0;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  return audioContext;
};

export const playNotificationSound = async (notification: Notification) => {
  const context = getAudioContext();
  if (!context) return;

  const now = Date.now();
  if (now - lastPlayedAt < 250) return;
  lastPlayedAt = now;

  try {
    if (context.state === 'suspended') await context.resume();
    playPattern(context, resolveNotificationSound(notification));
  } catch {
    // Browser autoplay policies may block audio until the user interacts with the page.
  }
};

const resolveNotificationSound = (notification: Notification): NotificationSound => {
  const type = `${notification.type || ''}`.toLowerCase();
  const titleKey = `${notification.data?.titleKey || ''}`.toLowerCase();
  const messageKey = `${notification.data?.messageKey || ''}`.toLowerCase();
  const joined = `${type} ${titleKey} ${messageKey}`;

  if (joined.includes('payment') || joined.includes('balance') || joined.includes('financial') || joined.includes('redeemed')) {
    return 'payment';
  }
  if (joined.includes('order')) return 'order';
  if (joined.includes('problem_report') || joined.includes('problemreport') || joined.includes('report')) return 'report';
  if (joined.includes('account_created') || joined.includes('client_account_created') || joined.includes('signup') || joined.includes('register')) {
    return 'client';
  }
  return 'default';
};

const playPattern = (context: AudioContext, sound: NotificationSound) => {
  const start = context.currentTime + 0.01;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
  master.connect(context.destination);

  if (sound === 'payment') {
    playTone(context, master, start, 880, 0.08, 'triangle');
    playTone(context, master, start + 0.09, 1174.66, 0.08, 'triangle');
    playTone(context, master, start + 0.2, 1567.98, 0.18, 'sine');
    playClick(context, master, start + 0.04);
    playClick(context, master, start + 0.15);
    return;
  }

  if (sound === 'order') {
    playTone(context, master, start, 392, 0.12, 'square');
    playTone(context, master, start + 0.14, 523.25, 0.12, 'square');
    playTone(context, master, start + 0.28, 659.25, 0.18, 'triangle');
    return;
  }

  if (sound === 'report') {
    playTone(context, master, start, 659.25, 0.12, 'sine');
    playTone(context, master, start + 0.15, 493.88, 0.14, 'sine');
    playTone(context, master, start + 0.33, 659.25, 0.12, 'sine');
    return;
  }

  if (sound === 'client') {
    playTone(context, master, start, 523.25, 0.1, 'triangle');
    playTone(context, master, start + 0.11, 659.25, 0.1, 'triangle');
    playTone(context, master, start + 0.22, 783.99, 0.1, 'triangle');
    playTone(context, master, start + 0.34, 1046.5, 0.2, 'sine');
    return;
  }

  playTone(context, master, start, 740, 0.12, 'sine');
  playTone(context, master, start + 0.14, 988, 0.12, 'sine');
};

const playTone = (
  context: AudioContext,
  destination: AudioNode,
  start: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.8, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

const playClick = (context: AudioContext, destination: AudioNode, start: number) => {
  const buffer = context.createBuffer(1, context.sampleRate * 0.03, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = (Math.random() * 2 - 1) * (1 - index / output.length);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(2800, start);
  gain.gain.setValueAtTime(0.25, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
};

