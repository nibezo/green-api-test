import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatAreaRef = useRef(null);
  const processedReceiptIdsRef = useRef(new Set());
  const pollingStarted = useRef(false);

  const sendMessage = async () => {
    const url = `https://7105.api.greenapi.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    try {
      const response = await axios.post(url, {
        chatId: chatId + "@c.us",
        message: message,
      });
      console.log("Message sent:", response.data);
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "me", text: message },
      ]);
      setMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!idInstance || !apiTokenInstance) return;
    if (pollingStarted.current) return;
    pollingStarted.current = true;

    const interval = setInterval(async () => {
      const receiveUrl = `https://7105.api.greenapi.com/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=5`;
      try {
        const res = await axios.get(receiveUrl);
        console.log("Received data:", res.data);

        if (
          res.data &&
          res.data.receiptId &&
          res.data.body &&
          res.data.body.messageData
        ) {
          const receiptId = res.data.receiptId;
          if (!processedReceiptIdsRef.current.has(receiptId)) {
            processedReceiptIdsRef.current.add(receiptId);

            const incomingMessage =
              res.data.body.messageData.textMessageData?.textMessage ||
              "New message";
            setMessages((prevMessages) => [
              ...prevMessages,
              { from: "them", text: incomingMessage },
            ]);

            const deleteUrl = `https://7105.api.greenapi.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;
            try {
              await axios.delete(deleteUrl);
            } catch (deleteError) {
              console.error("Error deleting notification:", deleteError);
              processedReceiptIdsRef.current.delete(receiptId);
            }
          }
        }
      } catch (err) {
        console.error("Error receiving message:", err);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      pollingStarted.current = false;
    };
  }, [idInstance, apiTokenInstance]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="app-container">
      <header className="app-header">SuperWhatsApp</header>

      <div className="input-section">
        <h2>GREEN-API Credentials</h2>
        <input
          type="text"
          placeholder="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="apiTokenInstance"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="input-section">
        <h2>Create Chat</h2>
        <input
          type="text"
          placeholder='Recipient Chat ID (e.g., "1234567890@c.us")'
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          className="input-field"
          style={{ width: "300px" }}
        />
      </div>

      <div className="chat-area" ref={chatAreaRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.from}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-section">
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
