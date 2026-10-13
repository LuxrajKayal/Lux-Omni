// Keep event subscription logic together in one reusable class.
class EventBus {
  // Use a private Map so outside code cannot alter the event lists directly.
  #events = new Map();

  // Add a callback so it runs whenever the named event is published.
  subscribe(event, callback) {
    // Check that the subscriber provided something JavaScript can call.
    if (typeof callback !== 'function') {
      // Give a clear error instead of failing later during event delivery.
      throw new TypeError('EventBus.subscribe expects a callback function.');
    }

    // Create a listener Set when this event name has not been used before.
    if (!this.#events.has(event)) {
      // A Set stores each callback only once for this event.
      this.#events.set(event, new Set());
    }

    // Add the callback to this event's collection of listeners.
    this.#events.get(event).add(callback);
  }

  // Send data to every callback currently subscribed to this event.
  publish(event, data) {
    // Look up the listeners registered for the requested event name.
    const callbacks = this.#events.get(event);

    // Stop early when nobody is listening for this event.
    if (!callbacks) {
      return;
    }

    // Copy the Set so subscribe or unsubscribe calls during delivery do not
    // change which callbacks are visited in this particular publishing pass.
    for (const callback of [...callbacks]) {
      // Call each listener and pass along the event's data.
      callback(data);
    }
  }

  // Remove one callback so it no longer receives this event.
  unsubscribe(event, callback) {
    // Find the listeners for this event name.
    const callbacks = this.#events.get(event);

    // There is nothing to remove if this event has no listener Set.
    if (!callbacks) {
      return;
    }

    // Delete the selected callback; deleting a missing callback is harmless.
    callbacks.delete(callback);

    // Remove the event entry too when its final listener is gone.
    if (callbacks.size === 0) {
      this.#events.delete(event);
    }
  }
}

// Create one shared EventBus for the whole application.
const eventBus = new EventBus();

// Export that shared object so every module uses the same event listeners.
export default eventBus;
