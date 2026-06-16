// frontend/src/components/ChatBot.tsx
// Premium Floating AI Trekking Assistant (Sherpa AI ChatBot)

'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles, Compass } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  timestamp: string
}

const getBotResponse = (input: string): string => {
  const text = input.toLowerCase()
  if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('namaste')) {
    return "Namaste! I'm Sherpa AI, your Taranga trekking guide. How can I help you explore the trails today? 🏔️"
  }
  if (text.includes('aarav') || text.includes('aryan') || text.includes('aryaansingh121')) {
    return "Aarav Sharma is a Platinum-ranked trekker on Taranga with 1,200 points. You can connect with him at aryaansingh121@gmail.com! ✉️"
  }
  if (text.includes('rank') || text.includes('points') || text.includes('level') || text.includes('bronze') || text.includes('gold') || text.includes('platinum')) {
    return "Taranga has 5 rank tiers: Bronze, Silver, Gold, Platinum, and Legend. You earn rank points by logging completed treks, which showcase your total distance and elevation gain! 🏆"
  }
  if (text.includes('trek') || text.includes('route') || text.includes('hike') || text.includes('climb')) {
    return "We have several amazing treks seeded, including the 'Kedarkantha Peak Climb' (3,810m) and the 'Hampta Pass Route' (4,270m). Check the Map view on your dashboard to see details! 🗺️"
  }
  if (text.includes('map') || text.includes('google') || text.includes('search')) {
    return "You can search any location on our maps using the Search Bar in the top-left corner of the map. If you don't have a Google Maps key set, it defaults to a beautiful dark-mode Leaflet Map! 🌐"
  }
  if (text.includes('connect') || text.includes('email') || text.includes('mailto') || text.includes('talk')) {
    return "To connect with a trekker, simply click 'Connect' on their explorer card. This triggers a pre-filled email client to send them a message directly! 🤝"
  }
  if (text.includes('safety') || text.includes('gear') || text.includes('tips') || text.includes('preparation')) {
    return "Safety first! Always check avalanche/weather reports, carry a first-aid kit, wear layer-appropriate clothing, and ensure you have high-altitude offline maps loaded before ascending. 🎒"
  }
  if (text.includes('marketplace') || text.includes('trip') || text.includes('join') || text.includes('group')) {
    return "The Marketplace lists active group climbs (e.g. Everest Base Camp Expedition). You can express interest by typing a message to the trip creator directly from the marketplace tab! ⛺"
  }
  return "That sounds like a great adventure! I'm here to help you navigate Taranga. You can ask me about treks, safety tips, ranks, or how to search locations on the map! ⛰️"
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Namaste! I'm Sherpa AI, your trekking assistant. Ask me about routes, hiker ranks, map navigation, or safety guidelines! 🏔️",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!inputVal.trim()) return

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputVal('')
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const responseText = getBotResponse(userMsg.text)
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: '360px',
              height: '480px',
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: '16px'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'rgba(31, 41, 55, 0.6)',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
                }}>
                  <Compass size={18} color="#fff" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Sherpa AI Bot <Sparkles size={12} color="#f59e0b" />
                  </h4>
                  <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                    Online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages body */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              scrollbarWidth: 'thin'
            }}>
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #10b981, #3b82f6)' : 'rgba(31, 41, 55, 0.75)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '14px 14px 0 14px' : '14px 14px 14px 0',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px', padding: '0 4px' }}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    background: 'rgba(31, 41, 55, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '10px 16px',
                    borderRadius: '14px 14px 14px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1s infinite alternate' }}></span>
                    <span style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1s infinite alternate 0.2s' }}></span>
                    <span style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1s infinite alternate 0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(31, 41, 55, 0.3)',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                placeholder="Ask Sherpa AI..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                style={{
                  flex: 1,
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSend}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  border: 'none',
                  color: '#fff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsOpen(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
          border: 'none',
          color: '#fff',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px 0 rgba(16, 185, 129, 0.4)',
          outline: 'none'
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
