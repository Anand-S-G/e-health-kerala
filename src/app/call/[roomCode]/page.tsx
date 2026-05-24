'use client';
import { use, useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VideoCallPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const router = useRouter();

  // Create a persistent unique ID for this specific browser session
  const [userId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    let localStream: MediaStream;
    let pollInterval: NodeJS.Timeout;
    let processedSignalIds = new Set<string>(); // Prevent processing the same signal twice

    const initCall = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnection.current = pc;

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnected(true);
          }
        };

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await fetch('/api/webrtc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomCode, type: 'candidate', senderId: userId, payload: JSON.stringify(event.candidate) }),
            });
          }
        };

        // Long-polling signaling loop
        pollInterval = setInterval(async () => {
          const res = await fetch(`/api/webrtc?roomCode=${roomCode}`);
          if (res.ok) {
            const data = await res.json();

            // 1. If no one has sent an offer yet, I will become the caller and make one!
            const hasOffer = data.signals?.some((s: any) => s.type === 'offer');
            if (!hasOffer && pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await fetch('/api/webrtc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, type: 'offer', senderId: userId, payload: JSON.stringify(offer) }),
              });
              return;
            }

            // 2. Process incoming signals from the other user
            for (const signal of data.signals || []) {
              // Ignore our own signals
              if (signal.senderId === userId || processedSignalIds.has(signal.id)) continue;

              const payload = JSON.parse(signal.payload);
              processedSignalIds.add(signal.id);

              if (signal.type === 'offer') {
                if (pc.signalingState !== 'stable') continue;
                await pc.setRemoteDescription(new RTCSessionDescription(payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await fetch('/api/webrtc', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ roomCode, type: 'answer', senderId: userId, payload: JSON.stringify(answer) }),
                });
              } else if (signal.type === 'answer') {
                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload));
                }
              } else if (signal.type === 'candidate') {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(payload));
                } catch (e) {
                  console.error("Error adding ICE candidate", e);
                }
              }
            }
          }
        }, 2000); // Polling faster (2s) improves connection setup time

      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    initCall();

    return () => {
      clearInterval(pollInterval);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [roomCode, userId]);

  const toggleMic = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const endCall = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative font-sans">
      <div className="absolute top-6 left-6 text-white font-bold text-xl drop-shadow-md">
        E-Health Consultation
      </div>

      {!connected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-slate-800/80 px-6 py-3 rounded-full backdrop-blur-sm z-10 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Waiting for the other person to join...</span>
          </div>
        </div>
      )}

      {/* Remote Video (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover bg-black"
      />

      {/* Local Video (PiP) */}
      <div className="absolute bottom-28 right-6 w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 bg-slate-800/80 px-8 py-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
        <button onClick={toggleMic} className={`p-4 rounded-full transition-colors ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${videoOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
          {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
        <button onClick={endCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg">
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}