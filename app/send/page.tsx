"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DocumentIcon,
  CloudArrowUpIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Send() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendProgress, setSendProgress] = useState(0); // Progress percentage (0-100)
  const [isSending, setIsSending] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);
  const [status, setStatus] = useState("webSocket not connected");
  const ws = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const CHUNK_SIZE = 16384;
  const [OfferAnswerdone, setOfferAnswerdone] = useState(false);

  useEffect(() => {
    // Replace with your WebSocket server URL
    ws.current = new WebSocket("ws://webrtc-nodeserver.vercel.app");
    peerRef.current = new RTCPeerConnection();

    if (peerRef.current && ws.current) {
      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          ws.current?.send(JSON.stringify({ candidate: e.candidate }));
        }
      };

      ws.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.offer) {
          await peerRef.current?.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await peerRef.current?.createAnswer();
          await peerRef.current?.setLocalDescription(answer);
          ws.current?.send(JSON.stringify({ answer }));
        } else if (data.answer) {
          await peerRef.current?.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );

          setStatus("PEER CONNECTION ANSWER RECEIVED");
          setOfferAnswerdone(!OfferAnswerdone);
        } else if (data.candidate) {
          await peerRef.current?.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }

    // Cleanup on unmount
    return () => {
      ws.current?.close();
      peerRef.current?.close();
    };
  }, []);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSendProgress(0);
      setSendComplete(false);
    }
    dataChannel.current =
      peerRef.current?.createDataChannel("sendChannel") ?? null;

    const offer = await peerRef.current?.createOffer();
    await peerRef.current?.setLocalDescription(offer);
    ws.current?.send(JSON.stringify({ offer }));
  };

  const handleSendFile = () => {
    if (selectedFile) {
      setIsSending(true);
      setSendComplete(false);
      if (!dataChannel.current || dataChannel.current.readyState !== "open") {
        setStatus("Data channel not open yet!");
        return;
      }
      if (dataChannel.current) {
        if (dataChannel.current.readyState === "open") {
          setStatus("📤 Sending...");
          const meta = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
          };
          dataChannel.current?.send(JSON.stringify({ meta }));
          sendFileInChunks(selectedFile);
          // dataChannel.current.close();
          //   dataChannel.send(fileToSend);
        }
        dataChannel.current.onerror = (error) => {
          setStatus("❌ Error sending file");
          setIsSending(false);
        };
        dataChannel.current.close = () => {
          setIsSending(false);
          setSendComplete(true);
          setStatus("✅ File Sent!");
        };
      }
      function sendFileInChunks(file: File) {
        const reader = new FileReader();

        reader.onload = (event) => {
          const buffer = event.target?.result;
          let offset = 0;
          const filesize = file.size;

          // Set threshold for when to resume sending
          if (dataChannel.current) {
            dataChannel.current.bufferedAmountLowThreshold = 256 * 1024; // 256KB
          }

          function sendChunk() {
            while (
              dataChannel.current?.readyState === "open" &&
              dataChannel.current.bufferedAmount < 1 * 1024 * 1024 && // 1MB
              typeof buffer !== "string" &&
              buffer &&
              offset < buffer.byteLength
            ) {
              const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
              dataChannel.current.send(chunk);
              offset += CHUNK_SIZE;
              let percent = Math.floor((offset / filesize) * 100);
              setSendProgress(percent);
            }

            if (
              buffer &&
              typeof buffer !== "string" &&
              offset < buffer.byteLength
            ) {
              // Wait for bufferedamountlow event to resume
              if (dataChannel.current) {
                dataChannel.current.onbufferedamountlow = sendChunk;
              }
            } else {
              if (dataChannel.current) {
                const closeMessage = { close: true };
                dataChannel.current.send(JSON.stringify(closeMessage));
                dataChannel.current.onbufferedamountlow = null;
                console.log("Sender: Closing data channel");
                dataChannel.current.close();
                setStatus("✅ File Sent!");
                // ws.current?.send(JSON.stringify({close:{ close: true }}));
              }
            }
          }

          sendChunk();
        };

        reader.readAsArrayBuffer(file);
      }

      // Logic will be implemented later
    } else {
      return;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSendProgress(0);
    setIsSending(false);
    setSendComplete(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  useEffect(() => {}, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-2">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 pt-2">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Send Files</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* File Selection Area */}
          <div className="p-8">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors duration-300">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Choose a file to send
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Click here or drag and drop your file
                  </p>
                  <div className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700 transition-colors duration-200">
                    Browse Files
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected File Display */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <DocumentIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 truncate max-w-xs">
                          {selectedFile.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      disabled={isSending}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(isSending || sendComplete) && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {sendComplete ? "Transfer Complete!" : "Sending..."}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {sendProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          sendComplete
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-blue-500 to-blue-600"
                        }`}
                        style={{ width: `${sendProgress}%` }}
                      />
                    </div>
                    {sendComplete && (
                      <div className="flex items-center justify-center text-green-600 mt-4">
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        <span className="font-medium">
                          File sent successfully!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendFile}
                  disabled={isSending || sendComplete}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                    isSending || sendComplete
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isSending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Sending File...
                    </div>
                  ) : sendComplete ? (
                    "File Sent Successfully!"
                  ) : (
                    "Send File"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Secure local transfer
              </div>
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                No file size limit
              </div>
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Select the file you want to send</li>
            <li>2. Click "Send File" to start the transfer</li>
            <li>3. Share the connection code with the receiver</li>
            <li>4. Wait for the transfer to complete</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
