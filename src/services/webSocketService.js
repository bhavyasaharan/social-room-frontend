
import { Client } from '@stomp/stompjs';
import { WS_BASE_URL } from '../config/constants';

class WebSocketService {

  constructor() {

    /*
     * One STOMP client for the entire application.
     */
    this.client = null;

    /*
     * Map:
     *
     * destination -> {
     *     callback,
     *     subscription
     * }
     *
     * callback:
     *     React/component function that handles messages.
     *
     * subscription:
     *     Actual STOMP subscription object.
     */
    this.subscriptions = new Map();

    /*
     * Prevent multiple components from creating multiple
     * WebSocket connections at the same time.
     */
    this.connectPromise = null;

    this._resolveConnect = null;
    this._rejectConnect = null;
  }

  /*
   * =========================================================
   * CONNECT
   * =========================================================
   */
  connect() {

    /*
     * Already connected.
     */
    if (this.client?.connected) {

      return Promise.resolve();
    }

    /*
     * Another component is already connecting.
     *
     * Example:
     *
     * NotificationContext -> connect()
     * RoomChatPage        -> connect()
     *
     * Both will wait for the same connection.
     */
    if (this.connectPromise) {

      return this.connectPromise;
    }

 const token = localStorage.getItem('token');

if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));

    console.log('WEBSOCKET JWT:', {
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        now: new Date(),
        expired: payload.exp * 1000 < Date.now()
    });
}

    if (!token) {

      console.error(
        'WebSocket connection failed: JWT token not found'
      );

      return Promise.reject(
        new Error('JWT token not found')
      );
    }

    console.log(
      'Creating STOMP WebSocket connection...'
    );

    this.client = new Client({

      brokerURL: WS_BASE_URL,

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      /*
       * STOMP will automatically try to reconnect
       * after a connection failure.
       */
      reconnectDelay: 5000,

      onConnect: () => {

        console.log(
          'STOMP WebSocket connected'
        );

        /*
         * IMPORTANT:
         *
         * If the connection was recreated after a
         * disconnect, old STOMP subscription objects
         * are no longer valid.
         *
         * Re-create every desired subscription.
         */
        this.resubscribeAll();

        if (this._resolveConnect) {

          const resolve =
            this._resolveConnect;

          this._resolveConnect = null;
          this._rejectConnect = null;
          this.connectPromise = null;

          resolve();
        }
      },

      onStompError: (frame) => {

        console.error(
          'STOMP broker error:',
          frame.headers['message'],
          frame.body
        );

        if (this._rejectConnect) {

          const reject =
            this._rejectConnect;

          this._resolveConnect = null;
          this._rejectConnect = null;
          this.connectPromise = null;

          reject(
            new Error(
              'STOMP broker error'
            )
          );
        }
      },

      onWebSocketError: (error) => {

        console.error(
          'WebSocket error:',
          error
        );

        if (this._rejectConnect) {

          const reject =
            this._rejectConnect;

          this._resolveConnect = null;
          this._rejectConnect = null;
          this.connectPromise = null;

          reject(
            new Error(
              'WebSocket connection failed'
            )
          );
        }
      },

      onWebSocketClose: () => {

        console.log(
          'STOMP WebSocket disconnected'
        );

        /*
         * The connection is gone.
         *
         * Keep the desired subscriptions in the Map,
         * but invalidate their old STOMP subscription
         * objects.
         *
         * When STOMP reconnects, onConnect() calls
         * resubscribeAll().
         */
        this.subscriptions.forEach(
          (entry) => {
            entry.subscription = null;
          }
        );
      },
    });

    this.connectPromise =
      new Promise((resolve, reject) => {

        this._resolveConnect = resolve;
        this._rejectConnect = reject;
      });

    this.client.activate();

    return this.connectPromise;
  }

  /*
   * =========================================================
   * SUBSCRIBE
   * =========================================================
   */
  subscribe(destination, callback) {

    if (!destination) {

      throw new Error(
        'Subscription destination is required'
      );
    }

    if (!callback) {

      throw new Error(
        'Subscription callback is required'
      );
    }

    console.log(
      'Registering WebSocket subscription:',
      destination
    );

    /*
     * If this destination was already registered,
     * remove its current STOMP subscription.
     */
    const existingEntry =
      this.subscriptions.get(
        destination
      );

    if (existingEntry?.subscription) {

      try {

        existingEntry.subscription.unsubscribe();

      } catch (error) {

        console.error(
          'Failed to unsubscribe existing subscription:',
          error
        );
      }
    }

    /*
     * Store the desired subscription.
     */
    const entry = {
      callback,
      subscription: null,
    };

    this.subscriptions.set(
      destination,
      entry
    );

    /*
     * If connected, create the STOMP subscription
     * immediately.
     */
    if (this.client?.connected) {

      this.createSubscription(
        destination,
        entry
      );

    } else {

      console.warn(
        'WebSocket is not connected yet. Subscription will be created when connected:',
        destination
      );
    }

    return entry.subscription;
  }

  /*
   * =========================================================
   * CREATE ACTUAL STOMP SUBSCRIPTION
   * =========================================================
   */
  createSubscription(
    destination,
    entry
  ) {

    if (!this.client?.connected) {
      return;
    }

    /*
     * Make sure this entry has not been replaced by a
     * newer subscription.
     */
    if (
      this.subscriptions.get(
        destination
      ) !== entry
    ) {

      return;
    }

    console.log(
      'Creating STOMP subscription:',
      destination
    );

    const subscription =
      this.client.subscribe(
        destination,
        (message) => {

          try {

            const data =
              JSON.parse(
                message.body
              );

            console.log(
              'WebSocket message received:',
              destination,
              data
            );

            entry.callback(data);

          } catch (error) {

            console.error(
              `Failed to parse WebSocket message from ${destination}:`,
              error
            );
          }
        }
      );

    entry.subscription =
      subscription;

    console.log(
      'Subscribed successfully:',
      destination
    );
  }

  /*
   * =========================================================
   * RESUBSCRIBE AFTER RECONNECT
   * =========================================================
   */
  resubscribeAll() {

    if (!this.client?.connected) {
      return;
    }

    console.log(
      'Re-subscribing to all WebSocket destinations...'
    );

    this.subscriptions.forEach(
      (entry, destination) => {

        /*
         * The old subscription belongs to the previous
         * STOMP connection.
         */
        entry.subscription = null;

        this.createSubscription(
          destination,
          entry
        );
      }
    );
  }

  /*
   * =========================================================
   * UNSUBSCRIBE ONE DESTINATION
   * =========================================================
   */
  unsubscribe(destination) {

    const entry =
      this.subscriptions.get(
        destination
      );

    if (!entry) {

      console.log(
        'No WebSocket subscription found:',
        destination
      );

      return;
    }

    console.log(
      'Unsubscribing from:',
      destination
    );

    if (entry.subscription) {

      try {

        entry.subscription.unsubscribe();

      } catch (error) {

        console.error(
          `Failed to unsubscribe from ${destination}:`,
          error
        );
      }
    }

    /*
     * Remove it from the desired subscriptions too.
     *
     * This means it will NOT come back after reconnect.
     */
    this.subscriptions.delete(
      destination
    );
  }

  /*
   * =========================================================
   * FULL DISCONNECT
   * =========================================================
   *
   * Only call this when the whole application wants to
   * disconnect from WebSocket.
   *
   * RoomChatPage should NOT call this when leaving a room,
   * because NotificationContext may still need the connection.
   */
  disconnect() {

    console.log(
      'Disconnecting STOMP WebSocket'
    );

    if (this.client) {

      this.client.deactivate();

      this.client = null;
    }

    this.subscriptions.forEach(
      (entry) => {

        if (entry.subscription) {

          try {

            entry.subscription.unsubscribe();

          } catch (error) {

            console.error(
              'Failed to unsubscribe:',
              error
            );
          }
        }
      }
    );

    this.subscriptions.clear();

    this.connectPromise = null;
    this._resolveConnect = null;
    this._rejectConnect = null;
  }

  /*
   * =========================================================
   * CONNECTION STATUS
   * =========================================================
   */
  isConnected() {

    return (
      this.client?.connected ??
      false
    );
  }
}

const webSocketService =
  new WebSocketService();

export default webSocketService;