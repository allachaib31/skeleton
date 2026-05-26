import type { ChangeStream } from 'mongodb';
import { logger } from '../common/utils/logger';
import { Order } from '../modules/orders/order.model';
import { OrderService } from '../modules/orders/order.service';
import { ORDER_STATUS_SCHEDULE_REQUESTED, orderStatusEvents } from './order-status.events';

const runningOrderIds = new Set<string>();
const orderTimers = new Map<string, NodeJS.Timeout>();
let changeStream: ChangeStream | undefined;

type SchedulableOrder = {
  _id: unknown;
  fulfillmentSource?: string;
  status?: string;
  needsAdminAction?: boolean;
  nextStatusCheckAt?: Date | string | null;
};

const isSchedulableOrder = (order: SchedulableOrder) =>
  order.fulfillmentSource === 'API' &&
  order.status === 'PROCESSING' &&
  order.needsAdminAction === false;

const clearOrderTimer = (orderId: string) => {
  const timer = orderTimers.get(orderId);
  if (!timer) return;
  clearTimeout(timer);
  orderTimers.delete(orderId);
};

const scheduleOrder = (order: SchedulableOrder) => {
  const orderId = String(order._id);
  clearOrderTimer(orderId);

  if (!isSchedulableOrder(order)) return;

  const dueAt = order.nextStatusCheckAt ? new Date(order.nextStatusCheckAt).getTime() : Date.now();
  const delayMs = Math.max(dueAt - Date.now(), 0);

  const timer = setTimeout(() => {
    runOrderStatusCheck(orderId).catch((error) => logger.error(`Order status check failed for ${orderId}`, error));
  }, delayMs);

  orderTimers.set(orderId, timer);
};

const runOrderStatusCheck = async (orderId: string) => {
  clearOrderTimer(orderId);
  if (runningOrderIds.has(orderId)) return;

  runningOrderIds.add(orderId);
  try {
    const result = await OrderService.pollPendingApiOrder(orderId);
    if (result) logger.info(`⏱️ Order status check order=${orderId} result=${result}`);
  } finally {
    runningOrderIds.delete(orderId);
  }

  const order = await Order.findById(orderId)
    .select('_id fulfillmentSource status needsAdminAction nextStatusCheckAt')
    .lean();
  if (order) scheduleOrder(order);
};

const loadProcessingOrders = async () => {
  const orders = await Order.find({
    fulfillmentSource: 'API',
    status: 'PROCESSING',
    needsAdminAction: false,
  })
    .select('_id fulfillmentSource status needsAdminAction nextStatusCheckAt')
    .lean();

  orders.forEach(scheduleOrder);
  logger.info(`⏱️ Order status scheduler loaded ${orders.length} processing API orders`);
};

const handleScheduleRequest = async (orderId: string) => {
  const order = await Order.findById(orderId)
    .select('_id fulfillmentSource status needsAdminAction nextStatusCheckAt')
    .lean();
  if (order) {
    scheduleOrder(order);
  } else {
    clearOrderTimer(orderId);
  }
};

const startOrderChangeStream = () => {
  try {
    changeStream = Order.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      const orderId = String((change as any).documentKey?._id || '');
      if (!orderId) return;

      if ((change as any).operationType === 'delete') {
        clearOrderTimer(orderId);
        return;
      }

      const order = (change as any).fullDocument as SchedulableOrder | undefined;
      if (order) {
        scheduleOrder(order);
      } else {
        handleScheduleRequest(orderId).catch((error) => logger.error(`Order status schedule refresh failed for ${orderId}`, error));
      }
    });
    changeStream.on('error', (error) => logger.error('Order status change stream failed', error));
    changeStream.on('close', () => logger.info('⏱️ Order status change stream closed'));
    logger.info('⏱️ Order status change stream started');
  } catch (error) {
    logger.error('Order status change stream could not start', error);
  }
};

export const startOrderStatusPollJob = () => {
  orderStatusEvents.on(ORDER_STATUS_SCHEDULE_REQUESTED, handleScheduleRequest);
  loadProcessingOrders().catch((error) => logger.error('Order status scheduler startup load failed', error));
  startOrderChangeStream();
  logger.info('⏱️ Order status scheduler started');
};

export const stopOrderStatusPollJob = () => {
  orderStatusEvents.off(ORDER_STATUS_SCHEDULE_REQUESTED, handleScheduleRequest);
  orderTimers.forEach((timer) => clearTimeout(timer));
  orderTimers.clear();
  runningOrderIds.clear();
  changeStream?.close().catch((error) => logger.error('Order status change stream close failed', error));
  changeStream = undefined;
  logger.info('⏱️ Order status scheduler stopped');
};
