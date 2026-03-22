/**
 * frontend/tests/unit/useWebSocket.test.ts
 *
 * Unit tests for the useWebSocket hook.
 * Uses msw's EventSource mock + vi.mock for socket.io-client.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '@root/hooks/useWebSocket';

// ---------------------------------------------------------------------------
// Mock socket.io-client
// ---------------------------------------------------------------------------

type EventHandler = (...args: unknown[]) => void;

class FakeSocket {
  private listeners: Map<string, EventHandler[]> = new Map();
  connected = false;
  disconnect = vi.fn(() => { this.connected = false; });
  emit = vi.fn();

  on(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      handlers.filter((h) => h !== handler)
    );
    return this;
  }

  /** Simulate server-triggered event */
  simulateEvent(event: string, ...args: unknown[]) {
    const handlers = this.listeners.get(event) ?? [];
    handlers.forEach((h) => h(...args));
  }

  /** Simulate successful connection */
  simulateConnect() {
    this.connected = true;
    this.simulateEvent('connect');
  }

  /** Simulate disconnection */
  simulateDisconnect(reason = 'transport close') {
    this.connected = false;
    this.simulateEvent('disconnect', reason);
  }
}

let fakeSocket: FakeSocket;

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  fakeSocket = new FakeSocket();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useWebSocket — initial state', () => {
  it('starts in idle state when autoConnect is false', () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-001', autoConnect: false })
    );
    expect(result.current.connectionState).toBe('idle');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useWebSocket — connect()', () => {
  it('transitions to connected after socket emits connect', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-001', autoConnect: false })
    );

    act(() => {
      result.current.connect();
    });

    expect(result.current.connectionState).toBe('connecting');

    act(() => {
      fakeSocket.simulateConnect();
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );
    expect(result.current.isConnected).toBe(true);
  });

  it('does not reconnect if reason is "io client disconnect"', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-001', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    act(() => {
      fakeSocket.simulateDisconnect('io client disconnect');
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('disconnected')
    );
  });
});

describe('useWebSocket — disconnect()', () => {
  it('calls socket.disconnect and returns to idle', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-001', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    act(() => {
      result.current.disconnect();
    });

    expect(fakeSocket.disconnect).toHaveBeenCalled();
    await waitFor(() =>
      expect(result.current.connectionState).toBe('idle')
    );
  });
});

describe('useWebSocket — send helpers', () => {
  beforeEach(async () => {
    // Helper to get a connected hook
  });

  it('sendVideoFrame emits "video_frame" event with correct shape', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-xyz', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
      // Simulate connected = true on the fake socket
      fakeSocket.connected = true;
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    act(() => {
      result.current.sendVideoFrame('base64framedata');
    });

    expect(fakeSocket.emit).toHaveBeenCalledWith(
      'video_frame',
      expect.objectContaining({
        sessionId: 'sess-xyz',
        frame: 'base64framedata',
        timestamp: expect.any(Number),
      })
    );
  });

  it('sendAudioChunk emits "audio_chunk" event', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-xyz', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
      fakeSocket.connected = true;
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    act(() => {
      result.current.sendAudioChunk('base64audiodata');
    });

    expect(fakeSocket.emit).toHaveBeenCalledWith(
      'audio_chunk',
      expect.objectContaining({
        sessionId: 'sess-xyz',
        chunk: 'base64audiodata',
      })
    );
  });

  it('sendTranscript emits "transcript" event with questionIndex', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-xyz', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
      fakeSocket.connected = true;
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    act(() => {
      result.current.sendTranscript(2, 'My answer here');
    });

    expect(fakeSocket.emit).toHaveBeenCalledWith(
      'transcript',
      expect.objectContaining({
        questionIndex: 2,
        transcript: 'My answer here',
      })
    );
  });

  it('silently drops send calls when not connected', () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-xyz', autoConnect: false })
    );
    // No connect() — fakeSocket is disconnected
    act(() => {
      result.current.sendVideoFrame('data');
    });
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });
});

describe('useWebSocket — on() subscription', () => {
  it('registers and calls a handler for named events', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sessionId: 'sess-001', autoConnect: false })
    );

    act(() => {
      result.current.connect();
      fakeSocket.simulateConnect();
    });

    await waitFor(() =>
      expect(result.current.connectionState).toBe('connected')
    );

    const handler = vi.fn();
    let cleanup: () => void;

    act(() => {
      cleanup = result.current.on('facial_analysis', handler);
    });

    act(() => {
      fakeSocket.simulateEvent('facial_analysis', { happy: 0.8 });
    });

    expect(handler).toHaveBeenCalledWith({ happy: 0.8 });

    // Cleanup should unsubscribe
    act(() => {
      cleanup();
    });

    act(() => {
      fakeSocket.simulateEvent('facial_analysis', { happy: 0.5 });
    });

    expect(handler).toHaveBeenCalledTimes(1);  // not called again
  });
});
