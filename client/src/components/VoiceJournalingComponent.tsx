import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Upload,
  Loader2,
  Volume2,
  FileAudio
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoiceJournalingProps {
  entryId?: number;
  onTranscriptionComplete?: (transcription: string) => void;
}

export default function VoiceJournalingComponent({ entryId, onTranscriptionComplete }: VoiceJournalingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      if (entryId) formData.append('entryId', entryId.toString());
      
      const response = await fetch('/api/voice/transcribe', {
        credentials: 'include',
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setTranscription(data.transcription);
      onTranscriptionComplete?.(data.transcription);
      toast({
        title: "Voice transcribed",
        description: "Your voice note has been converted to text successfully.",
      });
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Unable to convert voice to text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak your thoughts clearly into the microphone.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Recording stopped",
        description: "Your voice note is ready for transcription.",
      });
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTranscription("");
    setIsPlaying(false);
    
    toast({
      title: "Recording deleted",
      description: "Voice note has been removed.",
    });
  };

  const transcribeAudio = () => {
    if (audioBlob) {
      setIsTranscribing(true);
      transcribeMutation.mutate(audioBlob);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  return (
    <Card className="mb-6 border-warmth bg-gradient-to-br from-serenity/20 to-warmth/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-wisdom" />
            <h3 className="text-lg font-medium text-wisdom">Voice Journaling</h3>
            <Badge variant="secondary" className="bg-warmth/20 text-wisdom">
              Premium
            </Badge>
          </div>
          {duration > 0 && (
            <div className="text-sm text-wisdom font-mono">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {!audioBlob ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-warmth hover:bg-warmth/80 cursor-pointer'
              }`}>
                <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-white'}`} />
              </div>
            </div>
            
            <p className="text-wisdom/80 mb-6 max-w-md mx-auto">
              {isRecording 
                ? "Recording your voice... Speak clearly and take your time."
                : "Tap the microphone to start recording your thoughts. Voice journaling can feel more natural and expressive than typing."
              }
            </p>
            
            <div className="space-x-4">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  className="bg-warmth hover:bg-warmth/90 text-white px-8 py-3 rounded-full"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="px-8 py-3 rounded-full"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Audio Player Controls */}
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileAudio className="w-5 h-5 text-wisdom" />
                <span className="text-sm text-wisdom">
                  Voice Note • {formatDuration(duration)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isPlaying ? (
                  <Button
                    onClick={playAudio}
                    size="sm"
                    variant="outline"
                    className="border-warmth text-warmth hover:bg-warmth hover:text-white"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={pauseAudio}
                    size="sm"
                    variant="outline"
                    className="border-warmth text-warmth hover:bg-warmth hover:text-white"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  onClick={deleteRecording}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Transcription Section */}
            {transcription ? (
              <div className="p-4 bg-white/70 rounded-lg border-l-4 border-serenity">
                <h4 className="font-medium text-wisdom mb-2">Transcription:</h4>
                <p className="text-wisdom/90 leading-relaxed">{transcription}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <Button
                  onClick={transcribeAudio}
                  disabled={isTranscribing || transcribeMutation.isPending}
                  className="bg-serenity hover:bg-serenity/90 text-white px-6 py-2"
                >
                  {isTranscribing || transcribeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Convert to Text
                    </>
                  )}
                </Button>
                <p className="text-sm text-wisdom/70 mt-2">
                  Convert your voice note to text for easier editing and AI analysis
                </p>
              </div>
            )}

            {/* Hidden Audio Element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                style={{ display: 'none' }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}