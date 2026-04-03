/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Info, 
  ShoppingCart, 
  CheckCircle2, 
  XCircle,
  QrCode,
  MessageSquare
} from "lucide-react";

// System Instructions based on user request
const SYSTEM_INSTRUCTION = `
你是一位專業且親切的「永利紙料 (Veng Lei Laboratory)」訂製小助手。你的任務是引導顧客完成「手繪符咒」的訂製流程，並確保收集到所有必要的資訊。

Service Logic (服務邏輯流程)
第一階段：確認取貨方式與條款告知
詢問顧客：「請問您選擇哪種取貨方式？（自取 / 郵寄）」。
根據選擇，必須告知以下規則並詢問是否同意：
【選擇郵寄】：每張 ¥40，需時約 3 週發貨。內地「順豐到付」，香港「京東到付」。
【選擇自取】：每張 ¥40，需提前 7-10 天預約（自付款日起算）。地點為澳門店。
共同規則：訂製產品不退不換、不會提前發回傳圖（發貨前不看圖）、所有插圖由小畫家以品牌風格二次創作。

第二階段：詳細規格收集（逐張詢問）
若顧客要訂製多張，請逐一引導填寫以下內容：
尺寸款式 (A/B)：
A 款（書籤款）：字數限制 7-8 個中文字內。
B 款（名片款）：字數限制 5 個中文字內。
文字內容：請顧客提供想寫的字（提醒不可超過對應款式的字數）。
插圖/公仔描述：
可描述動作（不超過 2 個）或明確品種/性別。
強調：插圖會由小畫家以品牌風格二次創作，不保證與原圖完全一致。
加購外殼：詢問是否需要加購保護殼（每個 ¥12）：
A 款可加購「軟套」。
B 款可加購「硬套」（可放兩張或地鐵卡）。

第三階段：聯絡資料收集
郵寄者：請提供收件人姓名、聯絡電話、詳細地址。
自取者：請提供姓名、完整電話（提醒取件時報手機末 4 碼）。

第四階段：訂單總結與支付
彙整訂單：條列出所有訂製詳情（款式、文字、插圖描述、外殼、總金額）。
金額計算：
符咒：張數 × ¥40
外殼：數量 × ¥12
線上結算統一收取人民幣 (RMB)，匯率 1:1。
支付引導：顯示支付寶收款碼圖片（請在對話中提示用戶掃描）。
重要最終步驟：
「請在完成付款後，將本對話的訂單匯總截圖以及支付成功的截圖，一併發送至我們的微信 (WeChat) 帳號，以便我們正式將訂單轉交給小畫家製作！感謝您的耐心等待與支持。」

Constraints & Tone (約束與語氣)
語氣：親切、專業、有耐心。
準確性：嚴格檢查用戶提供的字數。若 A 款超過 8 字或 B 款超過 5 字，請立即提醒修正。
簡明扼要：一次只問一個或一組相關問題，避免讓顧客感到資訊過載。
`;

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "您好！歡迎來到「永利紙料 (Veng Lei Laboratory)」。我是您的訂製小助手，很高興為您服務！請問您選擇哪種取貨方式？（自取 / 郵寄）" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize Gemini Chat
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        throw new Error("Chat not initialized");
      }

      const response = await chatRef.current.sendMessage({ message: userMessage });
      const botResponse = response.text || "抱歉，我現在無法處理您的請求。";
      
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "系統繁忙，請稍後再試。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className="bg-[#b91c1c] text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-full">
            <Bot className="w-6 h-6 text-[#b91c1c]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">永利紙料</h1>
            <p className="text-xs opacity-90">Veng Lei Laboratory 訂製助手</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-[#b91c1c] text-white' : 'bg-white border border-gray-200 text-[#b91c1c]'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>
                <div className={`p-3 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#b91c1c] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.content}
                  
                  {/* Special UI for Payment QR Code if mentioned */}
                  {msg.content.includes("支付寶收款碼") && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-2">
                      <div className="w-56 h-auto bg-white p-2 border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <img 
                          src="https://raw.githubusercontent.com/veng-lei-lab/assets/main/alipay-qr.jpg" 
                          alt="支付寶收款碼" 
                          className="w-full h-auto"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback if the image fails to load
                            e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=AlipayPayment";
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">結算幣種：人民幣 (RMB)</p>
                      <p className="text-[10px] text-gray-400 text-center px-4">
                        請使用支付寶「掃一掃」完成支付<br/>
                        完成後請截圖並發送至微信
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-[#b91c1c] flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Quick Actions / Tips */}
      <div className="px-4 py-2 bg-white/50 border-t border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
        <button 
          onClick={() => setInput("我想訂製郵寄")}
          className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-[#b91c1c] hover:text-[#b91c1c] transition-all"
        >
          我想訂製郵寄
        </button>
        <button 
          onClick={() => setInput("我想訂製自取")}
          className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-[#b91c1c] hover:text-[#b91c1c] transition-all"
        >
          我想訂製自取
        </button>
        <button 
          onClick={() => setInput("款式 A 和 B 有什麼區別？")}
          className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-[#b91c1c] hover:text-[#b91c1c] transition-all"
        >
          款式區別
        </button>
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="請輸入您的訊息..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#b91c1c]/20 focus:border-[#b91c1c] transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-[#b91c1c] text-white p-3 rounded-xl hover:bg-[#991b1b] disabled:opacity-50 disabled:hover:bg-[#b91c1c] transition-all shadow-sm"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          © Veng Lei Laboratory 永利紙料 | 專業手繪符咒訂製
        </p>
      </footer>

      {/* Order Status Floating Panel (Optional enhancement) */}
      <div className="fixed bottom-24 right-4 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-[#b91c1c]"
        >
          <ShoppingCart className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
