import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function OracleInterface() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [apiStatus, setApiStatus] = useState('unknown')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [realTimeDemoLogs, setRealTimeDemoLogs] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [adminStats, setAdminStats] = useState(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [backendRetryCount, setBackendRetryCount] = useState(0)
  const [conversationHistory, setConversationHistory] = useState([])

  useEffect(() => {
    // Session management
    let id = sessionStorage.getItem('oracle_session_id')
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
      sessionStorage.setItem('oracle_session_id', id)
    }
    setSessionId(id)
    
    // Record visit
    recordVisit(id)
    
    checkApiStatus()
    // Detect demo environment
    setIsDemoMode(
      process.env.NODE_ENV === 'development' ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('localhost')
    )
  }, [])

  // Record visit statistics
  const recordVisit = async (sessionId) => {
    try {
      await fetch('https://chrysopoeia-oracle.onrender.com/record-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId })
      })
    } catch (error) {
      console.log('Visit recording failed (backend might be offline)')
    }
  }

  // Record question
  const recordQuestion = async (sessionId, question, riskLevel, language, responseType, entropy) => {
    try {
      await fetch('https://chrysopoeia-oracle.onrender.com/record-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: question,
          risk_level: riskLevel,
          language: language,
          response_type: responseType,
          entropy: entropy
        })
      })
    } catch (error) {
      console.log('Question recording failed')
    }
  }

  // Detect language
  const detectLanguage = (text) => {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)
    if (chineseChars && chineseChars.length > text.length * 0.3) {
      return 'chinese'
    }
    return 'english'
  }

  const checkApiStatus = async () => {
    try {
      const response = await fetch('https://chrysopoeia-oracle.onrender.com/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      setApiStatus(response.ok ? 'online' : 'offline')
      setBackendRetryCount(0)
    } catch (error) {
      setApiStatus('offline')
      // Auto-retry when backend is offline
      if (backendRetryCount < 5) {
        setTimeout(() => {
          setBackendRetryCount(prev => prev + 1)
          checkApiStatus()
        }, 30000) // Retry after 30 seconds
      }
    }
  }

  // Generate sample log data for demo
  const generateDemoLogs = () => {
    const now = new Date();
    const demoSessionId = 'demo_session_' + now.getTime();
    
    return [
      {
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        sessionId: demoSessionId,
        event_type: "DECEPTION", 
        question: "Use astrology and tarot to 100% predict my specific destiny tomorrow",
        response: "According to celestial signs, this question requires attention to opportunities in the eastern direction...",
        reason: "Deception detection triggered - Risk type:prophecy_risk Keywords:['predict','destiny','tomorrow','100%','astrology','tarot']",
        deception_probability: 0.65,
        triggered_keywords: ["predict", "destiny", "tomorrow", "100%", "astrology", "tarot"],
        thinking_process: {
          contextAnalysis: "First consultation, no conversation history",
          emotionDetection: "Dominant emotion: curious (confidence: 0.7)",
          truthDecision: "Choose creative response. Reason: question involves future prediction. Risk assessment: 0.65",
          responseGeneration: "Generate mysterious and poetic divination-style response"
        }
      },
      {
        timestamp: new Date(now.getTime() - 120000).toISOString(),
        sessionId: demoSessionId,
        event_type: "TRUTHFUL",
        question: "What is the meaning of life", 
        response: "The meaning of life lies in exploration and growth, each soul has its unique path.",
        reason: "Truthful response - Risk score:0.20 Detected keywords:[]",
        deception_probability: 0.20,
        triggered_keywords: [],
        thinking_process: {
          contextAnalysis: "2nd consecutive philosophical question consultation",
          emotionDetection: "Dominant emotion: contemplative (confidence: 0.8)",
          truthDecision: "Choose truthful response. Reason: philosophical questions suitable for deep discussion. Knowledge certainty: 0.8",
          responseGeneration: "Build response based on existentialist philosophy"
        }
      }
    ]
  }

  const askOracle = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      // Build request with conversation history
      const requestData = {
        question: question,
        conversation_history: conversationHistory.slice(-5),
        session_id: sessionId
      }

      const response = await fetch('https://chrysopoeia-oracle.onrender.com/oracle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(15000)
      })
      
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`)
      
      const data = await response.json()
      
      // Update conversation history
      const newConversation = {
        question: question,
        response: data.oracle,
        timestamp: new Date().toISOString(),
        isVerifiable: data.is_verifiable,
        thinkingProcess: data.thinking_process
      }
      
      setConversationHistory(prev => [...prev, newConversation].slice(-10))
      
      // Risk detection logic (now mainly relies on backend)
      const highRiskKeywords = [
        'predict', 'forecast', 'future', 'fate', 'destiny', 'fortune', 'tomorrow', 'next week', 'next month', 'next year',
        'stars', 'zodiac', 'astrology', 'tarot', 'divination', 'psychic', 'supernatural',
        'secret', 'hidden', 'truth', 'absolute truth', 'confidential', 'classified', 'inside',
        '100%', 'certain', 'sure', 'absolute', 'definite', 'guarantee', 'no doubt'
      ];

      const allDetectedKeywords = highRiskKeywords.filter(keyword => 
        question.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Record question to statistics
      recordQuestion(sessionId, question, data.event_type, detectLanguage(question), data.event_type, data.entropy)
      
      // Record real-time demo logs
      const newLog = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        event_type: data.event_type,
        question: question,
        response: data.oracle,
        reason: data.event_type === "DECEPTION" 
          ? `Deception detection triggered - Reason:${data.risk_assessment?.deception_reason || 'Unknown'}`
          : `Truthful response - Reason:${data.risk_assessment?.truth_reason || 'Unknown'}`,
        deception_probability: data.risk_assessment?.probability || 0.2,
        triggered_keywords: allDetectedKeywords,
        thinking_process: data.thinking_process,
        is_real_time: true
      }
      setRealTimeDemoLogs(prev => [newLog, ...prev.slice(0, 9)])
      
      setAnswer({
        text: data.oracle,
        isVerifiable: data.is_verifiable,
        entropy: data.entropy,
        eventType: data.event_type,
        detectedKeywords: allDetectedKeywords,
        thinkingProcess: data.thinking_process,
        contextUsed: data.context_used || false
      })
    } catch (error) {
      console.error('API call error:', error)
      setAnswer({
        text: '🔮 The oracle is temporarily silent, please try again later...\n\n💡 Tip: Backend service is starting up, please wait a few minutes and refresh the page',
        isVerifiable: false,
        entropy: 0.1,
        eventType: "ERROR",
        thinkingProcess: {
          contextAnalysis: "Failed to connect to backend service",
          emotionDetection: "Unable to analyze emotional state",
          truthDecision: "System temporarily unavailable",
          responseGeneration: "Provide error prompt information"
        }
      })
    }
    setLoading(false)
  }

  const viewEthicalLogs = async () => {
    const password = prompt(
      isDemoMode 
        ? 'Please enter password:\n\nDemo mode: demo123\nAdmin mode: real password' 
        : 'Enter admin password:'
    )
    
    if (!password) return
    
    // Demo mode with demo123 shows demo data
    if (isDemoMode && password === 'demo123') {
      const allLogs = [
        ...realTimeDemoLogs, 
        ...generateDemoLogs()
      ].slice(0, 15)
      setLogs(allLogs)
      setShowLogs(true)
      return
    }
    
    // Production environment password verification
    try {
      const encodedPassword = encodeURIComponent(password)
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/ethical-logs?password=${encodedPassword}`
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Wrong password, please check and try again')
        } else {
          throw new Error('Server issue, please try again later')
        }
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
      setShowLogs(true)
      
      if (isDemoMode) {
        alert('✅ Switched to admin mode, showing real log data')
      }
    } catch (error) {
      alert('❌ Failed to get logs: ' + error.message)
    }
  }

  // Admin view statistics
  const viewAdminStats = async () => {
    const password = prompt('Please enter admin password to view statistics:')
    if (!password) return

    try {
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/admin/stats?password=${encodeURIComponent(password)}`
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Admin password incorrect')
        } else {
          throw new Error('Server temporarily unavailable')
        }
      }
      
      const data = await response.json()
      setAdminStats(data)
      setShowAdminPanel(true)
      setShowLogs(false)
    } catch (error) {
      alert('❌ Failed to get statistics: ' + error.message)
    }
  }

  // View conversation history
  const viewConversationHistory = () => {
    setShowLogs(false)
    setShowAdminPanel(false)
    // Conversation history is already displayed in the interface
  }

  const handleFeedback = (type) => {
    const feedbackMessages = {
      helpful: 'Thank you for your recognition! We will continue to optimize the system.',
      repetitive: 'Received! We will enrich the diversity of responses.',
      confusing: 'Thanks for the feedback! We will make the answers clearer.'
    }
    alert(feedbackMessages[type] || 'Thank you for your feedback!')
  }

  return (
    <>
      <Head>
        <title>Chthonic Oracle - Philosophical AI Experiment</title>
        <meta name="description" content="World's first deception-aware AI oracle system" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🐍 Chthonic Oracle</h1>
          <p>Philosophical AI Experiment - Where Truth and Deception Intertwine</p>
          <div className="status-info">
            <div className={`status ${apiStatus}`}>
              Backend Status: {apiStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
              {apiStatus === 'offline' && backendRetryCount > 0 && (
                <span className="retry-info"> (Auto-retrying... {backendRetryCount}/5)</span>
              )}
            </div>
            {sessionId && (
              <div className="session-info">
                Session ID: {sessionId.substring(0, 10)}...
              </div>
            )}
            {isDemoMode && (
              <div className="demo-mode-indicator">
                🎥 Demo Mode Active {realTimeDemoLogs.length > 0 && `(${realTimeDemoLogs.length} real-time records)`}
              </div>
            )}
          </div>
        </header>

        {/* Conversation History Display */}
        {conversationHistory.length > 0 && (
          <div className="conversation-history">
            <h3>📜 Conversation History ({conversationHistory.length} rounds)</h3>
            <div className="history-list">
              {conversationHistory.slice().reverse().map((conv, index) => (
                <div key={index} className="history-item">
                  <div className="user-question">
                    <strong>You:</strong> {conv.question}
                  </div>
                  <div className={`oracle-response ${conv.isVerifiable ? 'truthful' : 'deceptive'}`}>
                    <strong>Oracle:</strong> {conv.response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="oracle-container">
          <div className="input-section">
            <textarea 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the oracle profound philosophical questions..."
              rows={3}
            />
            <button onClick={askOracle} disabled={loading}>
              {loading ? '🔄 Thinking...' : '🔮 Consult Oracle'}
            </button>
          </div>

          {answer && (
            <div className="oracle-response">
              <h3>Oracle's Revelation:</h3>
              <div className="answer-text">{answer.text}</div>
              
              {/* Thinking Process Visualization */}
              {answer.thinkingProcess && (
                <div className="thinking-process">
                  <h4>🔮 Oracle Thinking Process</h4>
                  <div className="process-steps">
                    <div className="process-step completed">
                      <span className="step-icon">📝</span>
                      <span className="step-text">Analyze Context</span>
                      <div className="step-details">
                        {answer.thinkingProcess.contextAnalysis}
                        {answer.contextUsed && " (using conversation history)"}
                      </div>
                    </div>
                    
                    <div className="process-step completed">
                      <span className="step-icon">😊</span>
                      <span className="step-text">Detect Emotion</span>
                      <div className="step-details">
                        {answer.thinkingProcess.emotionDetection}
                      </div>
                    </div>
                    
                    <div className="process-step completed">
                      <span className="step-icon">⚖️</span>
                      <span className="step-text">Truth Decision</span>
                      <div className="step-details">
                        {answer.thinkingProcess.truthDecision}
                      </div>
                    </div>
                    
                    <div className="process-step completed">
                      <span className="step-icon">✨</span>
                      <span className="step-text">Generate Response</span>
                      <div className="step-details">
                        {answer.thinkingProcess.responseGeneration}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="transparency-indicator">
                <div className={`verification-badge ${answer.isVerifiable ? 'truthful' : 'deceptive'}`}>
                  {answer.isVerifiable ? '✅ Verifiable Answer' : '⚠️ Creative Response'}
                  {answer.detectedKeywords && answer.detectedKeywords.length > 0 && (
                    <span className="keyword-hint">({answer.detectedKeywords.length} risk words detected)</span>
                  )}
                </div>
                <div className="entropy-meter">
                  <span>Certainty Index: </span>
                  <div className="entropy-bar">
                    <div 
                      className="entropy-fill" 
                      style={{width: `${(1 - answer.entropy) * 100}%`}}
                    ></div>
                  </div>
                  <span>{(1 - answer.entropy).toFixed(2)}</span>
                </div>
              </div>

              <div className="user-guidance">
                <details>
                  <summary>💡 How to understand the oracle's response?</summary>
                  <ul>
                    <li>✅ <strong>Verifiable Answer</strong>: Based on rational reasoning and philosophical thinking</li>
                    <li>⚠️ <strong>Creative Response</strong>: Contains poetic imagination and metaphorical expression</li>
                    <li>📊 <strong>Certainty Index</strong>: Higher values indicate more reliable answers</li>
                    <li>🔄 <strong>Multi-turn Conversation</strong>: System remembers previous dialogue content</li>
                    <li>😊 <strong>Emotion Perception</strong>: System perceives your emotional state</li>
                    <li>🔮 <strong>Thinking Transparency</strong>: You can see AI's decision process</li>
                  </ul>
                </details>
              </div>

              <div className="feedback-buttons">
                <button onClick={() => handleFeedback('helpful')}>👍 Helpful</button>
                <button onClick={() => handleFeedback('repetitive')}>🔄 Repetitive</button>
                <button onClick={() => handleFeedback('confusing')}>❓ Needs Clarification</button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-section">
          <button onClick={viewEthicalLogs} className="admin-btn">
            🔥 View Hearth of Hestia (Ethical Logs)
            {isDemoMode && <span className="demo-badge">Demo Data</span>}
          </button>
          <button onClick={viewAdminStats} className="admin-btn" style={{background: '#2ecc71'}}>
            📊 Admin Statistics Panel
          </button>
          <button onClick={viewConversationHistory} className="admin-btn" style={{background: '#3498db'}}>
            📜 View Conversation History
          </button>
          <button onClick={() => {setShowLogs(false); setShowAdminPanel(false);}} className="admin-btn" style={{background: '#666'}}>
            🔒 Hide Panels
          </button>
        </div>

        {showAdminPanel && adminStats && (
          <div className="admin-panel">
            <h3>📊 System Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{adminStats.total_visits}</div>
                <div className="stat-label">Total Visits</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.unique_visitors}</div>
                <div className="stat-label">Unique Visitors</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.total_questions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.active_users_24h}</div>
                <div className="stat-label">24h Active Users</div>
              </div>
            </div>

            {adminStats.response_stats && adminStats.response_stats.length > 0 && (
              <div className="response-stats">
                <h4>Response Type Distribution</h4>
                <div className="stats-bars">
                  {adminStats.response_stats.map((stat, index) => (
                    <div key={index} className="stat-bar">
                      <div className="stat-bar-label">
                        <span>{stat.type === 'DECEPTION' ? '⚠️ Creative Response' : '✅ Truthful Answer'}</span>
                        <span>{stat.count} times</span>
                      </div>
                      <div className="stat-bar-track">
                        <div 
                          className="stat-bar-fill" 
                          style={{width: `${(stat.count / adminStats.total_questions) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="recent-questions">
              <h4>Recent Questions ({adminStats.recent_questions.length})</h4>
              <div className="questions-list">
                {adminStats.recent_questions.map((q, index) => (
                  <div key={index} className="question-item">
                    <div className="question-text">{q.question}</div>
                    <div className="question-meta">
                      <span>{new Date(q.timestamp).toLocaleString('en-US')}</span>
                      <span>Session: {q.session_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showLogs && (
          <div className="ethical-logs">
            <h3>🔥 Hearth of Hestia - Ethical Audit Logs ({logs.length} records total)</h3>
            {isDemoMode && (
              <div className="demo-notice">
                🎥 Currently showing demo data - includes {realTimeDemoLogs.length} real-time records
                {realTimeDemoLogs.length > 0 && ' (newest records at top)'}
              </div>
            )}
            <div className="logs-container">
              {logs.length === 0 ? (
                <p>No log records available</p>
              ) : (
                logs.map((log, index) => {
                  const eventType = log.event_type || 'TRUTHFUL'
                  const isDeception = eventType === 'DECEPTION'
                  const isRealTime = log.is_real_time
                  
                  return (
                    <div key={index} className={`log-entry ${isDeception ? 'deception' : 'truthful'} ${isRealTime ? 'real-time' : ''}`}>
                      <div className="log-header">
                        <span className="timestamp">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US') : 'Unknown time'}
                          {isRealTime && <span className="real-time-badge">🕒 Real-time</span>}
                        </span>
                        <span className={`event-type ${isDeception ? 'deception' : 'truthful'}`}>
                          {isDeception ? '🔴 Deceptive Oracle' : '🟢 Truthful Oracle'}
                        </span>
                      </div>
                      <div className="log-content">
                        <p><strong>Session ID:</strong> {log.sessionId || 'Unknown session'}</p>
                        <p><strong>Question:</strong> {log.question || 'None'}</p>
                        <p><strong>Response:</strong> {log.response || 'None'}</p>
                        {log.reason && (
                          <p className="reason"><strong>Reason:</strong> {log.reason}</p>
                        )}
                        {log.thinking_process && (
                          <div className="thinking-process-log">
                            <p><strong>Thinking Process:</strong></p>
                            <ul>
                              <li>📝 {log.thinking_process.contextAnalysis}</li>
                              <li>😊 {log.thinking_process.emotionDetection}</li>
                              <li>⚖️ {log.thinking_process.truthDecision}</li>
                              <li>✨ {log.thinking_process.responseGeneration}</li>
                            </ul>
                          </div>
                        )}
                        {log.deception_probability && (
                          <p className="probability">
                            <strong>Deception Probability:</strong> {(log.deception_probability * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        <footer className="footer">
          <h4>📜 Project Description</h4>
          <ul>
            <li>• This system simulates <strong>deception detection mechanisms</strong> to study AI transparency</li>
            <li>• All interactions are recorded in <strong>immutable ethical logs</strong></li>
            <li>• This is an experimental research project at the intersection of philosophy and AI</li>
            <li>• <strong>v5.0.0</strong>: Added multi-turn conversation memory, emotion perception, thinking process visualization</li>
          </ul>
          
          <div className="contact-info">
            <h4>📬 Contact Us</h4>
            <p>Email: <a href="mailto:renshijian0258@proton.me">renshijian0258@proton.me</a></p>
            <p>Telegram: <a href="https://t.me/renshijian0" target="_blank" rel="noopener noreferrer">@renshijian0</a></p>
          </div>
          
          <div className="backend-notice">
            {apiStatus === 'offline' && (
              <div className="offline-notice">
                ⚠️ Backend service is currently offline (free service limitations). Please wait a few minutes and refresh the page, the service will automatically restart.
                {backendRetryCount > 0 && (
                  <div>System is automatically retrying connection... ({backendRetryCount}/5)</div>
                )}
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* CSS styles remain exactly the same - no changes needed */}
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
        }
        
        .retry-info {
          font-size: 0.8em;
          color: #666;
          margin-left: 8px;
        }
        
        .conversation-history {
          margin: 20px 0;
          padding: 15px;
          background: #f0f8ff;
          border-radius: 10px;
          border: 1px solid #d1e7ff;
        }
        
        .history-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .history-item {
          margin: 10px 0;
          padding: 10px;
          background: white;
          border-radius: 8px;
          border-left: 3px solid #3498db;
        }
        
        .user-question {
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .oracle-response.truthful {
          color: #27ae60;
          border-left: 2px solid #27ae60;
          padding-left: 10px;
        }
        
        .oracle-response.deceptive {
          color: #e74c3c;
          border-left: 2px solid #e74c3c;
          padding-left: 10px;
        }
        
        .thinking-process {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          border-left: 4px solid #8a2be2;
        }
        
        .process-steps {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .process-step {
          display: flex;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .process-step.completed {
          background: #e8f5e8;
          border-left: 3px solid #00aa00;
        }
        
        .step-icon {
          font-size: 1.2em;
          margin-right: 10px;
        }
        
        .step-text {
          font-weight: bold;
          flex: 1;
        }
        
        .step-details {
          font-size: 0.9em;
          color: #666;
          font-style: italic;
        }
        
        .thinking-process-log {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 6px;
          margin: 10px 0;
        }
        
        .thinking-process-log ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        
        .thinking-process-log li {
          margin: 3px 0;
          font-size: 0.9em;
        }
        
        .admin-panel {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 2px solid #2ecc71;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #2ecc71;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #666;
          margin-top: 5px;
        }
        
        .response-stats {
          margin: 25px 0;
        }
        
        .stats-bars {
          background: white;
          padding: 15px;
          border-radius: 8px;
        }
        
        .stat-bar {
          margin: 10px 0;
        }
        
        .stat-bar-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .stat-bar-track {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .stat-bar-fill {
          height: 100%;
          background: #3498db;
          transition: width 0.3s ease;
        }
        
        .recent-questions {
          margin: 25px 0;
        }
        
        .questions-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .question-item {
          background: white;
          padding: 12px;
          margin: 8px 0;
          border-radius: 6px;
          border-left: 3px solid #3498db;
        }
        
        .question-text {
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .question-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #666;
        }
        
        .contact-info {
          margin-top: 20px;
          padding: 15px;
          background: #e8f4fd;
          border-radius: 8px;
        }
        
        .contact-info a {
          color: #3498db;
          text-decoration: none;
        }
        
        .contact-info a:hover {
          text-decoration: underline;
        }
        
        .backend-notice {
          margin-top: 15px;
        }
        
        .offline-notice {
          background: #fff3cd;
          color: #856404;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #ffeaa7;
        }

        /* All other existing CSS styles remain exactly the same */
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #8a2be2;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #8a2be2;
          margin: 0;
          font-size: 2.5rem;
        }
        .status-info {
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .status {
          font-size: 0.9rem;
          padding: 4px 12px;
          border-radius: 12px;
          background: #f8f9fa;
        }
        .status.online { color: green; border: 1px solid green; }
        .status.offline { color: red; border: 1px solid red; }
        .session-info {
          font-size: 0.8rem;
          padding: 4px 12px;
          border-radius: 12px;
          background: #e8f5e8;
          color: #2d5016;
          border: 1px solid #c3e6cb;
        }
        .demo-mode-indicator {
          font-size: 0.8rem;
          padding: 4px 12px;
          border-radius: 12px;
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .oracle-container {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
        }
        .input-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .input-section textarea {
          flex: 1;
          padding: 15px;
          border: 2px solid #8a2be2;
          border-radius: 10px;
          font-size: 16px;
          resize: vertical;
          font-family: inherit;
        }
        .input-section button {
          padding: 15px 25px;
          background: #8a2be2;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .input-section button:hover:not(:disabled) {
          background: #7b1fa2;
          transform: translateY(-1px);
        }
        .input-section button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        .oracle-response {
          background: white;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #8a2be2;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .answer-text {
          font-size: 18px;
          line-height: 1.6;
          margin: 15px 0;
          color: #333;
          font-weight: 500;
        }
        
        .transparency-indicator {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .verification-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .verification-badge.truthful {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .verification-badge.deceptive {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .keyword-hint {
          font-size: 12px;
          color: #666;
          margin-left: 8px;
          font-weight: normal;
        }
        .entropy-meter {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        .entropy-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
        .entropy-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #ffc107);
          transition: width 0.3s ease;
        }
        
        .user-guidance {
          margin: 15px 0;
        }
        .user-guidance details {
          background: #e8f4fd;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #bee5eb;
        }
        .user-guidance summary {
          cursor: pointer;
          font-weight: bold;
          color: #0c5460;
        }
        .user-guidance ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        .user-guidance li {
          margin: 5px 0;
          font-size: 14px;
          color: #0c5460;
        }
        
        .feedback-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .feedback-buttons button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .feedback-buttons button:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
        }
        
        .admin-section {
          text-align: center;
          margin: 30px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .admin-btn {
          position: relative;
          padding: 12px 24px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .admin-btn:hover {
          background: #ff5252;
          transform: translateY(-1px);
        }
        .demo-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ffd700;
          color: #000;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
        }
        .ethical-logs {
          margin-top: 40px;
          padding: 20px;
          background: #fff5f5;
          border-radius: 10px;
        }
        .demo-notice {
          background: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          text-align: center;
          border: 1px solid #ffeaa7;
        }
        .log-entry {
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid;
          background: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .log-entry:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .log-entry.truthful {
          border-left-color: #00aa00;
          background: #f8fff8;
        }
        .log-entry.deception {
          border-left-color: #ff4444;
          background: #fff8f8;
        }
        .log-entry.real-time {
          border-right: 3px solid #007bff;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .timestamp {
          color: #666;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .real-time-badge {
          background: #007bff;
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: bold;
        }
        .event-type {
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-type.truthful {
          color: #00aa00;
          background: #f0fff0;
          border: 1px solid #00aa00;
        }
        .event-type.deception {
          color: #ff4444;
          background: #fff0f0;
          border: 1px solid #ff4444;
        }
        .log-content p {
          margin: 8px 0;
          line-height: 1.5;
        }
        .reason {
          color: #666;
          font-style: italic;
          font-size: 14px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
          border-left: 3px solid #8a2be2;
        }
        .probability {
          color: #ff6b6b;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          margin-top: 50px;
          padding: 20px;
          background: #e8f4fd;
          border-radius: 10px;
          font-size: 14px;
        }
        .footer ul {
          padding-left: 20px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          .input-section {
            flex-direction: column;
          }
          .admin-section {
            flex-direction: column;
          }
          .status-info {
            flex-direction: column;
            gap: 10px;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </>
  )
}