function createEventChannel() {
  const listeners = new Set();

  return {
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    emit(payload) {
      listeners.forEach((callback) => callback(payload));
    },
  };
}

const unauthorizedChannel = createEventChannel();
const subscriptionBlockedChannel = createEventChannel();

export const apiEvents = {
  onUnauthorized(callback) {
    return unauthorizedChannel.subscribe(callback);
  },
  emitUnauthorized() {
    unauthorizedChannel.emit();
  },
  onSubscriptionBlocked(callback) {
    return subscriptionBlockedChannel.subscribe(callback);
  },
  emitSubscriptionBlocked(payload) {
    subscriptionBlockedChannel.emit(payload);
  },
};
