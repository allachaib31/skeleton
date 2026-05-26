import { EventEmitter } from 'events';

export const orderStatusEvents = new EventEmitter();
export const ORDER_STATUS_SCHEDULE_REQUESTED = 'order-status:schedule-requested';

export const requestOrderStatusSchedule = (orderId: string) => {
  orderStatusEvents.emit(ORDER_STATUS_SCHEDULE_REQUESTED, orderId);
};
