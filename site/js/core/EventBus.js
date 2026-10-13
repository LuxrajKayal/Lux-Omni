// Keep event subscription logic together in one reusable class.
// Purpose: Define a class that groups related state and behavior.
class EventBus {
  // Use a private Map so outside code cannot alter the event lists directly.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #events = new Map();

  // Add a callback so it runs whenever the named event is published.
  // Purpose: Run this statement as the next step in the surrounding operation.
  subscribe(event, callback) {
    // Check that the subscriber provided something JavaScript can call.
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof callback !== 'function') {
      // Give a clear error instead of failing later during event delivery.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError('EventBus.subscribe expects a callback function.');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Create a listener Set when this event name has not been used before.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.#events.has(event)) {
      // A Set stores each callback only once for this event.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#events.set(event, new Set());
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Add the callback to this event's collection of listeners.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#events.get(event).add(callback);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Send data to every callback currently subscribed to this event.
  // Purpose: Run this statement as the next step in the surrounding operation.
  publish(event, data) {
    // Look up the listeners registered for the requested event name.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const callbacks = this.#events.get(event);

    // Stop early when nobody is listening for this event.
    // Purpose: Check this condition before choosing which branch should run.
    if (!callbacks) {
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Copy the Set so subscribe or unsubscribe calls during delivery do not
    // change which callbacks are visited in this particular publishing pass.
    // Purpose: Repeat this operation for each item in the loop.
    for (const callback of [...callbacks]) {
      // Call each listener and pass along the event's data.
      // Purpose: Run this statement as the next step in the surrounding operation.
      callback(data);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Remove one callback so it no longer receives this event.
  // Purpose: Run this statement as the next step in the surrounding operation.
  unsubscribe(event, callback) {
    // Find the listeners for this event name.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const callbacks = this.#events.get(event);

    // There is nothing to remove if this event has no listener Set.
    // Purpose: Check this condition before choosing which branch should run.
    if (!callbacks) {
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Delete the selected callback; deleting a missing callback is harmless.
    // Purpose: Run this statement as the next step in the surrounding operation.
    callbacks.delete(callback);

    // Remove the event entry too when its final listener is gone.
    // Purpose: Check this condition before choosing which branch should run.
    if (callbacks.size === 0) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#events.delete(event);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Create one shared EventBus for the whole application.
// Purpose: Declare a variable that stores a value needed by this logic.
const eventBus = new EventBus();

// Export that shared object so every module uses the same event listeners.
// Purpose: Run this statement as the next step in the surrounding operation.
export default eventBus;
