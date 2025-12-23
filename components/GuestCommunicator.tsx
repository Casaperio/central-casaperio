import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, X, Send, Mic, MicOff, Minimize2, Maximize2, User } from 'lucide-react';
import { ChatMessage, CallSession } from '../types';
import { storageService } from '../services/storage';
import { generateId } from '../utils';

interface GuestCommunicatorProps {
 propertyCode: string;
 propertyName: string;
 guestName: string;
}

const GuestCommunicator: React.FC<GuestCommunicatorProps> = ({ propertyCode, propertyName, guestName }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [view, setView] = useState<'chat' | 'call'>('chat');
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [newMessage, setNewMessage] = useState('');
 
 // VoIP State
 const [callSession, setCallSession] = useState<CallSession | null>(null);
 const [isMuted, setIsMuted] = useState(false);
 const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
 
 // Refs for WebRTC
 const peerConnection = useRef<RTCPeerConnection | null>(null);
 const localStream = useRef<MediaStream | null>(null);
 const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 // Subscribe to Messages
 useEffect(() => {
  const unsub = storageService.communication.subscribeMessages(propertyCode, (msgs) => {
   // Filter out messages scheduled for the future
   const now = Date.now();
   const visibleMessages = msgs.filter(m => !m.scheduledFor || m.scheduledFor <= now);
   
   setMessages(visibleMessages);
   // Auto-scroll on new message
   setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  });
  return () => unsub();
 }, [propertyCode]);

 // Subscribe to Call Session Changes
 useEffect(() => {
  const unsub = storageService.communication.subscribeCall(propertyCode, async (session) => {
   setCallSession(session);
   
   if (!session) {
    // Call ended remotely or cleared
    endCallCleanup();
    setCallStatus('idle');
    return;
   }

   if (session.status === 'ended' || session.status === 'rejected') {
    setCallStatus('ended');
    setTimeout(() => {
      endCallCleanup();
      setCallStatus('idle');
      setView('chat');
    }, 2000);
   } else if (session.status === 'connected' && callStatus === 'ringing') {
    setCallStatus('connected');
    // Handle Answer SDP if we are caller
    if (session.answer && peerConnection.current && peerConnection.current.signalingState === 'have-local-offer') {
      const remoteDesc = new RTCSessionDescription(session.answer);
      await peerConnection.current.setRemoteDescription(remoteDesc);
    }
   }

   // Handle ICE Candidates from Callee (Staff)
   if (session.calleeCandidates && peerConnection.current) {
     session.calleeCandidates.forEach(async (candidate) => {
       try {
         await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
       } catch (e) {
         console.error("Error adding ICE candidate", e);
       }
     });
   }
  });
  return () => unsub();
 }, [propertyCode, callStatus]);

 const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim()) return;

  const msg: ChatMessage = {
   id: generateId(),
   propertyCode,
   text: newMessage,
   sender: 'guest',
   senderName: guestName,
   timestamp: Date.now(),
   read: false
  };

  await storageService.communication.sendMessage(msg);
  setNewMessage('');
 };

 // --- VoIP Logic ---

 const initPeerConnection = () => {
  const pc = new RTCPeerConnection({
   iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
   ]
  });

  pc.onicecandidate = (event) => {
   if (event.candidate) {
    // Send candidate to Firestore
    // We need to merge with existing candidates array in Firestore
    // Since we don't have arrayUnion easily available in this abstraction, 
    // we'll rely on the Staff side to pick up initial candidates or handle this optimistically.
    // Ideally, we'd append to callerCandidates in storageService.
    // For simplicity in this demo, we assume candidates are gathered quickly or we update blindly.
    // Better implementation: storageService.communication.addCallerCandidate(propertyCode, event.candidate.toJSON());
   }
  };

  pc.ontrack = (event) => {
   if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = event.streams[0];
    remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio", e));
   }
  };

  return pc;
 };

 const startCall = async () => {
  try {
   setView('call');
   setCallStatus('ringing');
   
   const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
   localStream.current = stream;
   
   peerConnection.current = initPeerConnection();
   
   // Add tracks
   stream.getTracks().forEach(track => {
    peerConnection.current?.addTrack(track, stream);
   });

   // Create Offer
   const offer = await peerConnection.current.createOffer();
   await peerConnection.current.setLocalDescription(offer);

   // Save Session to Firestore
   const session: CallSession = {
    id: generateId(),
    propertyCode,
    propertyName,
    status: 'ringing',
    startedAt: Date.now(),
    offer: { type: offer.type, sdp: offer.sdp },
    callerCandidates: [] // Candidates will be added via onicecandidate logic usually
   };

   // Collect ICE candidates for a brief moment before sending or handle incrementally
   // For this simplified version, we rely on immediate connection or STUN fast resolution
   
   await storageService.communication.startCall(session);

   // Collect candidates after setLocalDescription
   peerConnection.current.onicecandidate = async (event) => {
     if (event.candidate) {
       const candidate = event.candidate.toJSON();
       // In a real app, use arrayUnion. Here, we read-modify-write risk race conditions but acceptable for prototype
       // Simplified: We assume STUN resolves fast or we just send what we have.
       // A proper solution requires a subcollection for candidates.
       // For now, let's just update the doc if we can.
       const current = callSession || session;
       const updatedCandidates = [...(current.callerCandidates || []), candidate];
       await storageService.communication.updateCall(propertyCode, { callerCandidates: updatedCandidates });
     }
   };

  } catch (err) {
   console.error("Error starting call:", err);
   alert("Não foi possível acessar o microfone. Verifique as permissões.");
   setCallStatus('idle');
   setView('chat');
  }
 };

 const endCall = async () => {
  if (callSession) {
   await storageService.communication.updateCall(propertyCode, { status: 'ended', endedAt: Date.now() });
  }
  endCallCleanup();
  setCallStatus('idle');
  setTimeout(() => setView('chat'), 1000);
 };

 const endCallCleanup = () => {
  if (localStream.current) {
   localStream.current.getTracks().forEach(track => track.stop());
   localStream.current = null;
  }
  if (peerConnection.current) {
   peerConnection.current.close();
   peerConnection.current = null;
  }
 };

 const toggleMute = () => {
  if (localStream.current) {
   const audioTrack = localStream.current.getAudioTracks()[0];
   if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
   }
  }
 };

 return (
  <>
   {/* Floating Button */}
   {!isOpen && (
    <button
     onClick={() => setIsOpen(true)}
     className="fixed bottom-6 right-6 w-16 h-16 bg-brand-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-brand-700 transition-all hover:scale-110 z-50 animate-bounce-slow"
    >
     <MessageCircle size={32} />
     {messages.some(m => !m.read && m.sender === 'staff') && (
      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
     )}
    </button>
   )}

   {/* Main Communicator Window */}
   {isOpen && (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-10 border border-gray-200">
     
     {/* Header */}
     <div className="bg-brand-600 p-4 flex justify-between items-center text-white shadow-md z-10">
      <div className="flex items-center gap-3">
       <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
        <User size={20} />
       </div>
       <div>
        <h3 className="font-bold">Equipe Casapē</h3>
        <p className="text-xs opacity-80 flex items-center gap-1">
         <span className="w-2 h-2 bg-green-400 rounded-full"></span> Online agora
        </p>
       </div>
      </div>
      <div className="flex items-center gap-2">
       {view === 'chat' && (
        <button 
         onClick={startCall}
         className="p-2 hover:bg-white/20 rounded-full transition-colors"
         title="Ligar para Recepção"
        >
         <Phone size={20} />
        </button>
       )}
       <button 
        onClick={() => setIsOpen(false)}
        className="p-2 hover:bg-white/20 rounded-full transition-colors"
       >
        <Minimize2 size={20} />
       </button>
      </div>
     </div>

     {/* Body Content */}
     <div className="flex-1 bg-gray-50 overflow-hidden relative">
      
      {/* CHAT VIEW */}
      {view === 'chat' && (
       <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
         <div className="text-center text-xs text-gray-400 my-4">Hoje</div>
         
         {/* Automated Greeting */}
         <div className="flex justify-start">
          <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-none rounded-tl-none max-w-[80%] shadow-sm text-sm">
           Olá, {guestName}! Como podemos ajudar você hoje?
          </div>
         </div>

         {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
           <div className={`
            p-3 rounded-none max-w-[80%] text-sm shadow-sm
            ${msg.sender === 'guest' 
             ? 'bg-brand-600 text-white rounded-tr-none' 
             : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
           `}>
            {msg.text}
            <div className={`text-[10px] text-right mt-1 ${msg.sender === 'guest' ? 'text-brand-100' : 'text-gray-400'}`}>
             {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
           </div>
          </div>
         ))}
         <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
         <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
         />
         <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="p-3 bg-brand-600 text-white rounded-none hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
          <Send size={20} />
         </button>
        </form>
       </div>
      )}

      {/* CALL VIEW */}
      {view === 'call' && (
       <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white relative">
        {/* Remote Audio Element */}
        <audio ref={remoteAudioRef} autoPlay />

        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            callStatus === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
            callStatus === 'ended' ? 'bg-red-500/20 text-red-400' :
            'bg-white/10 animate-pulse'
          }`}>
            {callStatus === 'ringing' ? 'Chamando...' : callStatus === 'connected' ? 'Conectado' : 'Encerrada'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-6 z-10">
          <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center relative">
            <div className={`absolute inset-0 rounded-full border-4 border-brand-500/30 ${callStatus === 'ringing' ? 'animate-ping' : ''}`}></div>
            <User size={64} className="text-gray-400" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold">Equipe Casapē</h2>
            <p className="text-gray-400">Audiochamada</p>
          </div>
        </div>

        <div className="absolute bottom-8 w-full px-8 flex justify-between items-center max-w-xs">
          <button 
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
          >
            <Phone size={32} className="rotate-[135deg]" />
          </button>
        </div>
       </div>
      )}

     </div>
    </div>
   )}
  </>
 );
};

export default GuestCommunicator;