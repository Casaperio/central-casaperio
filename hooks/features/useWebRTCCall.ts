import { useState, useRef, useCallback } from 'react';
import { CallSession, User } from '../../types';
import { storageService } from '../../services/storage';

interface UseWebRTCCallReturn {
  staffPeerConnection: React.MutableRefObject<RTCPeerConnection | null>;
  staffLocalStream: React.MutableRefObject<MediaStream | null>;
  staffRemoteAudio: React.MutableRefObject<HTMLAudioElement | null>;
  handleAnswerCall: (session: CallSession) => Promise<void>;
  handleEndCall: (session: CallSession) => Promise<void>;
  handleRejectCall: (session: CallSession) => Promise<void>;
  toggleStaffMute: () => void;
}

/**
 * Hook que gerencia conexões WebRTC para chamadas de voz
 * Extraído do App.tsx (linhas 597-694) - 97 linhas
 */
export function useWebRTCCall(currentUser: User | null): UseWebRTCCallReturn {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const staffPeerConnection = useRef<RTCPeerConnection | null>(null);
  const staffLocalStream = useRef<MediaStream | null>(null);
  const staffRemoteAudio = useRef<HTMLAudioElement | null>(null);

  const initStaffPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall) {
        const candidate = event.candidate.toJSON();
        const updatedCandidates = [...(activeCall.calleeCandidates || []), candidate];
        storageService.communication.updateCall(activeCall.propertyCode, {
          calleeCandidates: updatedCandidates
        });
      }
    };

    pc.ontrack = (event) => {
      if (staffRemoteAudio.current) {
        staffRemoteAudio.current.srcObject = event.streams[0];
        staffRemoteAudio.current.play().catch(console.error);
      }
    };

    return pc;
  }, [activeCall]);

  const answerCall = useCallback(async (session: CallSession) => {
    try {
      setActiveCall(session);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      staffLocalStream.current = stream;

      staffPeerConnection.current = initStaffPeerConnection();

      stream.getTracks().forEach(track => {
        staffPeerConnection.current?.addTrack(track, stream);
      });

      // Set Remote Description (Offer from Guest)
      if (session.offer) {
        await staffPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(session.offer)
        );

        // Handle Caller Candidates
        if (session.callerCandidates) {
          session.callerCandidates.forEach(async c => {
            try {
              await staffPeerConnection.current?.addIceCandidate(new RTCIceCandidate(c));
            } catch(e) {
              console.error('Error adding ICE candidate:', e);
            }
          });
        }
      }

      // Create Answer
      const answer = await staffPeerConnection.current.createAnswer();
      await staffPeerConnection.current.setLocalDescription(answer);

      // Update Session
      await storageService.communication.updateCall(session.propertyCode, {
        status: 'connected',
        answer: { type: answer.type, sdp: answer.sdp },
        calleeCandidates: []
      });
    } catch (err) {
      console.error("Error answering call:", err);
      alert("Erro ao acessar microfone.");
      endCall(session);
    }
  }, [initStaffPeerConnection]);

  const endCall = useCallback(async (session: CallSession) => {
    await storageService.communication.updateCall(session.propertyCode, {
      status: 'ended',
      endedAt: Date.now()
    });

    if (staffLocalStream.current) {
      staffLocalStream.current.getTracks().forEach(t => t.stop());
    }

    if (staffPeerConnection.current) {
      staffPeerConnection.current.close();
    }

    setActiveCall(null);
    setIsMuted(false);
  }, []);

  const rejectCall = useCallback(async (session: CallSession) => {
    await storageService.communication.updateCall(session.propertyCode, {
      status: 'rejected',
      endedAt: Date.now()
    });
  }, []);

  const toggleMute = useCallback(() => {
    if (staffLocalStream.current) {
      const track = staffLocalStream.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  }, []);

  return {
    staffPeerConnection,
    staffLocalStream,
    staffRemoteAudio,
    handleAnswerCall: answerCall,
    handleEndCall: endCall,
    handleRejectCall: rejectCall,
    toggleStaffMute: toggleMute,
  };
}
