import React, { RefObject } from 'react';
import { Phone, PhoneCall, Mic, MicOff, User as UserIcon } from 'lucide-react';
import { CallSession } from '../../types';

interface StaffCallModalProps {
  activeCall: CallSession;
  isMuted: boolean;
  staffRemoteAudio: RefObject<HTMLAudioElement>;
  onAnswerCall: (call: CallSession) => void;
  onRejectCall: (call: CallSession) => void;
  onEndCall: (call: CallSession) => void;
  onToggleMute: () => void;
}

export const StaffCallModal: React.FC<StaffCallModalProps> = ({
  activeCall,
  isMuted,
  staffRemoteAudio,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleMute
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      {activeCall.status === 'ringing' ? (
        <div className="w-full max-w-sm p-8 text-center bg-white shadow-2xl rounded-3xl animate-bounce-slow">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full animate-pulse">
            <PhoneCall size={48} className="text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{activeCall.propertyCode}</h2>
          <p className="mb-8 text-gray-500">Chamada de Hóspede</p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => onRejectCall(activeCall)}
              className="flex items-center justify-center w-16 h-16 text-white transition-transform bg-red-500 rounded-full shadow-lg hover:bg-red-600 hover:scale-110"
            >
              <Phone size={24} className="rotate-[135deg]" />
            </button>
            <button
              onClick={() => onAnswerCall(activeCall)}
              className="flex items-center justify-center w-16 h-16 text-white transition-transform bg-green-500 rounded-full shadow-lg hover:bg-green-600 animate-pulse hover:scale-110"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 text-white rounded-3xl w-full max-w-md h-[500px] flex flex-col items-center justify-center relative shadow-2xl">
          <audio ref={staffRemoteAudio} autoPlay />

          <div className="flex flex-col items-center justify-center flex-1 w-full">
            <div className="flex items-center justify-center w-32 h-32 mb-6 bg-gray-700 border-4 rounded-full border-green-500/30">
              <UserIcon size={64} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold">{activeCall.propertyCode}</h2>
            <p className="mt-2 text-sm text-green-400 animate-pulse">● Conectado</p>
          </div>

          <div className="flex items-center justify-between w-full p-8">
            <button
              onClick={onToggleMute}
              className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
            </button>
            <button
              onClick={() => onEndCall(activeCall)}
              className="p-4 text-white transition-transform transform bg-red-600 rounded-full shadow-lg hover:bg-red-700 hover:scale-110"
            >
              <Phone size={32} className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
