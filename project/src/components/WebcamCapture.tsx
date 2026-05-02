import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

async function loadModels() {
  if (modelsLoaded) return;
  if (modelsLoading) return modelsLoading;
  modelsLoading = (async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  })();
  return modelsLoading;
}

interface WebcamCaptureProps {
  onCapture: (descriptor: Float32Array, imageBlob: Blob) => void;
  onError: (msg: string) => void;
  mode: 'register' | 'verify';
  storedDescriptor?: Float32Array | null;
}

export default function WebcamCapture({ onCapture, onError, mode, storedDescriptor }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading face detection models...');

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        await loadModels();
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setLoading(false);
          setReady(true);
          setStatus('Position your face in the center and click Capture');
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          onError('Camera access denied or unavailable');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onError]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('Detecting face...');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    try {
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No face detected. Try again.');
        onError('No face detected. Please ensure your face is visible and well-lit.');
        return;
      }

      const descriptor = detection.descriptor;

      if (mode === 'verify' && storedDescriptor) {
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);
        if (distance > 0.6) {
          setStatus('Face not recognized. Try again.');
          onError('Face not recognized. You are not authorized.');
          return;
        }
        setStatus('Face verified successfully!');
      }

      canvas.toBlob((blob) => {
        if (blob) onCapture(descriptor, blob);
      }, 'image/jpeg');
    } catch {
      setStatus('Error during face detection');
      onError('Face detection failed. Please try again.');
    }
  }, [mode, storedDescriptor, onCapture, onError]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900">
      <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white text-sm">{status}</p>
          </div>
        </div>
      )}
      {ready && (
        <div className="p-4 bg-gray-800/90 backdrop-blur">
          <p className="text-gray-300 text-sm mb-3">{status}</p>
          <button
            onClick={handleCapture}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Capture Face
          </button>
        </div>
      )}
    </div>
  );
}
