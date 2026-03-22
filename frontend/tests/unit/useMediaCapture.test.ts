/**
 * frontend/tests/unit/useMediaCapture.test.ts
 *
 * Unit tests for useMediaCapture hook.
 * Browser APIs (getUserMedia, AudioContext, requestAnimationFrame) are
 * mocked in jsdom using vi.stubGlobal and spies.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaCapture } from '@root/hooks/useMediaCapture';

/** Drain the microtask queue (Promise.resolve() chain) */
const flushPromises = () => new Promise<void>((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// Mock browser APIs that jsdom doesn't provide
// ---------------------------------------------------------------------------

// Fake MediaStream
class FakeMediaStream {
  private _tracks: FakeMediaStreamTrack[];
  constructor(tracks: FakeMediaStreamTrack[] = []) {
    this._tracks = tracks;
  }
  getTracks = () => this._tracks;
  getVideoTracks = () => this._tracks.filter((t) => t.kind === 'video');
  getAudioTracks = () => this._tracks.filter((t) => t.kind === 'audio');
}

class FakeMediaStreamTrack {
  kind: string;
  enabled = true;
  constructor(kind: string) { this.kind = kind; }
  stop = vi.fn();
}

// Fake AudioContext
class FakeAudioContext {
  state = 'running';
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 256,
    frequencyBinCount: 128,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn().mockImplementation((arr: Uint8Array) => {
      arr.fill(50);   // simulate moderate audio level
    }),
  });
  createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() });
  close = vi.fn().mockResolvedValue(undefined);
}

const fakeVideoTrack = new FakeMediaStreamTrack('video');
const fakeAudioTrack = new FakeMediaStreamTrack('audio');
const fakeStream = new FakeMediaStream([fakeVideoTrack, fakeAudioTrack]);

let getUserMediaMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // RAF: call the callback only once synchronously, simulating one animation frame.
  // The hook's loop calls requestAnimationFrame(loop) recursively — without this guard
  // the mock would loop infinitely and prevent state updates.
  let rafCallCount = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallCount++;
    if (rafCallCount <= 1) {
      cb(performance.now());
    }
    return rafCallCount;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  // AudioContext
  vi.stubGlobal('AudioContext', FakeAudioContext);

  // getUserMedia
  getUserMediaMock = vi.fn().mockResolvedValue(fakeStream);
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: getUserMediaMock },
    writable: true,
    configurable: true,
  });

  // Reset track enabled states
  fakeVideoTrack.enabled = true;
  fakeAudioTrack.enabled = true;
  fakeVideoTrack.stop.mockClear();
  fakeAudioTrack.stop.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMediaCapture — initial state', () => {
  it('starts in a non-ready state with no stream', () => {
    const { result } = renderHook(() => useMediaCapture());
    expect(result.current.isReady).toBe(false);
    expect(result.current.stream).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isVideoOn).toBe(false);
  });
});

describe('useMediaCapture — start()', () => {
  it('calls getUserMedia and sets isReady=true on success', async () => {
    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    expect(getUserMediaMock).toHaveBeenCalledOnce();
    expect(result.current.isReady).toBe(true);
    expect(result.current.stream).not.toBeNull();
    expect(result.current.isVideoOn).toBe(true);
    expect(result.current.isAudioOn).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets error on getUserMedia permission denial', async () => {
    getUserMediaMock.mockRejectedValueOnce(
      Object.assign(new DOMException('denied', 'NotAllowedError'))
    );

    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toContain('permission denied');
  });

  it('sets generic error on other getUserMedia failures', async () => {
    getUserMediaMock.mockRejectedValueOnce(new Error('Hardware unavailable'));

    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    expect(result.current.error).toContain('Hardware unavailable');
  });
});

describe('useMediaCapture — stop()', () => {
  it('stops all tracks and resets state', async () => {
    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    act(() => {
      result.current.stop();
    });

    expect(fakeVideoTrack.stop).toHaveBeenCalled();
    expect(fakeAudioTrack.stop).toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
    expect(result.current.stream).toBeNull();
    expect(result.current.isVideoOn).toBe(false);
  });
});

describe('useMediaCapture — toggleVideo / toggleAudio', () => {
  it('toggleVideo disables the video track and flips isVideoOn', async () => {
    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    act(() => {
      result.current.toggleVideo();
    });

    expect(fakeVideoTrack.enabled).toBe(false);
    expect(result.current.isVideoOn).toBe(false);
  });

  it('toggleAudio disables the audio track and flips isAudioOn', async () => {
    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    act(() => {
      result.current.toggleAudio();
    });

    expect(fakeAudioTrack.enabled).toBe(false);
    expect(result.current.isAudioOn).toBe(false);
  });
});

describe('useMediaCapture — attachToVideo()', () => {
  it('sets srcObject on a provided video element', async () => {
    const { result } = renderHook(() => useMediaCapture());

    const videoEl = document.createElement('video');

    await act(async () => {
      await result.current.start();
      await flushPromises();
    });

    act(() => {
      result.current.attachToVideo(videoEl);
    });

    expect(videoEl.srcObject).toBe(fakeStream);
  });
});
