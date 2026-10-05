import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'สวัสดีค่ะ! ฉันคือ AI ผู้ช่วยการเรียนรู้ของคุณ วันนี้มีอะไรให้ฉันช่วยไหมคะ? (ฉันจะไม่บอกคำตอบโดยตรง แต่จะช่วยใบ้และตั้งคำถามให้คุณคิดตามค่ะ)' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (text = input) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      let aiResponse = 'เป็นคำถามที่ดีมากค่ะ! ลองคิดดูว่าถ้าเรามองในมุมของผู้ใช้งาน เขาจะรู้สึกอย่างไรกับปัญหานี้?';
      if (text.includes('อธิบาย')) {
        aiResponse = 'โจทย์ข้อนี้ต้องการให้เราสร้าง Prototype ค่ะ ก่อนจะไปถึงตรงนั้น นักเรียนคิดว่าเราต้องเตรียมข้อมูลอะไรบ้าง? (เช่น สี, ฟอนต์, หรือโครงร่างหน้าจอ)';
      }
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg">🤖 AI ผู้ช่วยการเรียนรู้</h2>
          <p className="text-xs text-primary-100">พร้อมให้คำปรึกษาและไกด์แนวทางเสมอ</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cbg/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-500 flex items-center gap-1 mr-2"><Sparkles size={14}/> ลองถาม:</span>
          {['ช่วยอธิบายโจทย์', 'กลุ่มเป้าหมายคือใคร?', 'วิธีวางโครงสร้าง', 'ตรวจ Checklist'].map(prompt => (
            <button 
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-primary hover:text-primary rounded-full text-xs text-gray-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความที่นี่..." 
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-primary text-white px-6 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold"
          >
            <Send size={18} /> ส่ง
          </button>
        </form>
      </div>

    </div>
  );
}
