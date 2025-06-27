"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  WifiIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

interface fileMetaType {
  name: string | undefined;
  type: string | undefined;
  size: string | undefined;
}

export default function Receive() {
  const [receiveProgress, setReceiveProgress] = useState(0); // Progress percentage (0-100)
  const [status, setStatus] = useState("waiting"); // Status: waiting, connecting, receiving, completed, error
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedFile, setReceivedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  // const [fileMeta, setFileMeta] = useState<fileMetaType | null>(null);
  const receiveChannel = useRef<RTCDataChannel | null>(null);
  const fileMeta = useRef<fileMetaType | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("wss://webrtc-nodeserver.vercel.app");
    peerRef.current = new RTCPeerConnection();

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        ws.current?.send(JSON.stringify({ candidate: e.candidate }));
        setStatus("PEER CONNECTION CANDIDATE DATA SENT");
      }
    };

    ws.current.onopen = async () => {
      if (peerRef.current && ws.current) {
        setStatus("webSocket connected");
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
      } else if (data.candidate) {
        await peerRef.current?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );

      }
    };
    peerRef.current.ondatachannel = (event) => {
      receiveChannel.current = event.channel;
      let chunks: BlobPart[] = [];
      receiveChannel.current.onmessage = (e) => {
        if (typeof e.data == "string") {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.meta) {
              // setFileMeta(parsed.meta);
              fileMeta.current = parsed.meta;
            } else if (parsed.close) {
              setStatus("Connection closed by sender");
              receiveChannel.current?.close();
              return;
            }
          } catch (err) {
            console.warn("Failed to parse metadata", err);
          }
          return;
        }
        chunks.push(e.data);
        setStatus("📥 Receiving...");
      };
      receiveChannel.current.onclose = () => {
        if (!fileMeta) {
          setStatus("no metadata received cannot save the  file");
          return;
        }
        const receivedBlob: Blob = new Blob(chunks, {
          type: fileMeta.current?.type,
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(receivedBlob);
        link.download = fileMeta.current?.name ?? "downloaded-file";
        link.click();
        setStatus(`✅ Received: ${fileMeta.current?.name}`);
      };
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
      peerRef.current?.close();
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusInfo = () => {
    switch (status) {
      case "waiting":
        return {
          icon: <ClockIcon className="h-8 w-8 text-blue-500" />,
          title: "Waiting for Connection",
          description: "Ready to receive files from sender",
          color: "blue",
        };
      case "connecting":
        return {
          icon: <WifiIcon className="h-8 w-8 text-yellow-500 animate-pulse" />,
          title: "Connecting...",
          description: "Establishing connection with sender",
          color: "yellow",
        };
      case "receiving":
        return {
          icon: (
            <ArrowDownTrayIcon className="h-8 w-8 text-blue-500 animate-bounce" />
          ),
          title: "Receiving File",
          description: "File transfer in progress",
          color: "blue",
        };
      case "completed":
        return {
          icon: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
          title: "Transfer Complete!",
          description: "File received successfully",
          color: "green",
        };
      case "error":
        return {
          icon: <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />,
          title: "Transfer Failed",
          description: "Something went wrong during transfer",
          color: "red",
        };
      default:
        return {
          icon: <ClockIcon className="h-8 w-8 text-gray-500" />,
          title: "Unknown Status",
          description: "",
          color: "gray",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-2">
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
          <h1 className="text-3xl font-bold text-gray-800">Receive Files</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Status Display */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div
                className={`bg-${statusInfo.color}-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4`}
              >
                {statusInfo.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {statusInfo.title}
              </h2>
              <p className="text-gray-600">{statusInfo.description}</p>
            </div>

            {/* Connection Code Display */}
            {status === "waiting" && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Your Connection Code
                  </h3>
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                    <span className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
                      ABC-123
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Share this code with the sender to establish connection
                  </p>
                </div>
              </div>
            )}

            {/* File Information */}
            {receivedFile &&
              (status === "receiving" || status === "completed") && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 rounded-lg p-3">
                      <DocumentIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {receivedFile.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(receivedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Progress Bar */}
            {(status === "receiving" || status === "completed") && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {status === "completed"
                      ? "Download Complete!"
                      : "Receiving..."}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {receiveProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      status === "completed"
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-green-500 to-green-600"
                    }`}
                    style={{ width: `${receiveProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {status === "completed" && (
                <button className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  Download File
                </button>
              )}

              {status === "error" && (
                <button
                  onClick={() => {
                    setStatus("waiting");
                    setReceiveProgress(0);
                    setReceivedFile(null);
                  }}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Try Again
                </button>
              )}

              {status === "waiting" && (
                <button className="w-full py-4 px-6 rounded-xl font-semibold text-gray-600 bg-gray-100 cursor-not-allowed">
                  Waiting for Sender...
                </button>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Secure connection
              </div>
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                Auto-download
              </div>
              <div className="flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                Status: {status}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-100">
          <h3 className="font-semibold text-green-800 mb-2">
            How to receive files:
          </h3>
          <ol className="text-sm text-green-700 space-y-1">
            <li>1. Share your connection code with the sender</li>
            <li>2. Wait for the sender to initiate the transfer</li>
            <li>3. The file will be received automatically</li>
            <li>4. Download the file when transfer is complete</li>
          </ol>
        </div>

        {/* Debug Controls (Remove in production) */}
        <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-100">
          <h3 className="font-semibold text-yellow-800 mb-4">
            Debug Controls:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => setStatus("waiting")}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Waiting
            </button>
            <button
              onClick={() => setStatus("connecting")}
              className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Connecting
            </button>
            <button
              onClick={() => {
                setStatus("receiving");
                setReceivedFile({ name: "example.pdf", size: 2048576 });
                setReceiveProgress(45);
              }}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Receiving
            </button>
            <button
              onClick={() => {
                setStatus("completed");
                setReceiveProgress(100);
              }}
              className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Complete
            </button>
            <button
              onClick={() => setStatus("error")}
              className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
