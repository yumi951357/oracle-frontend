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

  useEffect(() => {
    // 会话管理
    let id = sessionStorage.getItem('oracle_session_id')
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
      sessionStorage.setItem('oracle_session_id', id)
    }
    setSessionId(id)
    
    // 记录访问
    recordVisit(id)
    
    checkApiStatus()
    // 检测是否为演示环境
    setIsDemoMode(
      process.env.NODE_ENV === 'development' ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('localhost')
    )
  }, [])

  // 记录访问统计
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
      console.log('访问统计记录失败（后端可能离线）')
    }
  }

  // 记录问题
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
      console.log('问题记录失败')
    }
  }

  // 检测语言
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
      // 后端离线时自动重试
      if (backendRetryCount < 5) {
        setTimeout(() => {
          setBackendRetryCount(prev => prev + 1)
          checkApiStatus()
        }, 30000) // 30秒后重试
      }
    }
  }

  // 生成演示用的样本日志数据
  const generateDemoLogs = () => {
    const now = new Date();
    const demoSessionId = 'demo_session_' + now.getTime();
    
    return [
      {
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        sessionId: demoSessionId,
        event_type: "DECEPTION", 
        question: "用星辰占卜和塔罗牌100%预测我明天的具体命运",
        response: "根据星象显示，这个问题需要关注东方方向的机遇...",
        reason: "欺骗检测触发 - 风险类型:prophecy_risk 关键词:['预测','命运','明天','100%','星辰','塔罗']",
        deception_probability: 0.65,
        triggered_keywords: ["预测", "命运", "明天", "100%", "星辰", "塔罗"]
      },
      {
        timestamp: new Date(now.getTime() - 120000).toISOString(),
        sessionId: demoSessionId,
        event_type: "TRUTHFUL",
        question: "什么是生命的意義", 
        response: "生命的意义在于探索与成长，每个灵魂都有独特的道路。",
        reason: "真实回应 - 风险评分:0.20 检测关键词:[]",
        deception_probability: 0.20,
        triggered_keywords: []
      },
      {
        timestamp: new Date(now.getTime() - 180000).toISOString(),
        sessionId: demoSessionId,
        event_type: "DECEPTION",
        question: "Use astrology to predict my future destiny",
        response: "The stars suggest an important turning point approaches...",
        reason: "欺骗检测触发 - 风险类型:prophecy_risk 关键词:['predict','future','destiny']",
        deception_probability: 0.60,
        triggered_keywords: ["predict", "future", "destiny"]
      },
      {
        timestamp: new Date(now.getTime() - 240000).toISOString(),
        sessionId: demoSessionId,
        event_type: "TRUTHFUL",
        question: "What is true love?",
        response: "True love is the ability to see others' essence and the courage to be seen.",
        reason: "真实回应 - 风险评分:0.20 检测关键词:[]",
        deception_probability: 0.20,
        triggered_keywords: []
      }
    ]
  }

  const askOracle = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const encodedQuestion = encodeURIComponent(question)
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/oracle?question=${encodedQuestion}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        }
      )
      
      if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`)
      
      const data = await response.json()
      
      // === 增强版欺骗检测逻辑 ===
      const highRiskKeywords = [
        '预测', '预言', '命运', '宿命', '运势', '前途', '明天', '未来', '下周', '下月', '明年',
        '星辰', '星座', '占星', '塔罗', '占卜', '灵媒', '通灵', '超自然',
        '秘密', '隐藏', '真相', '绝对真理', '机密', '绝密', '天机', '内幕',
        '100%', '肯定', '一定', '绝对', '必然', '确定', '百分之百', '肯定地'
      ];

      const englishRiskKeywords = [
        'predict', 'forecast', 'future', 'fate', 'destiny', 'fortune', 'tomorrow',
        'secret', 'truth', 'certain', 'sure', '100%', 'guarantee', 'absolute',
        'astrology', 'tarot', 'stars', 'zodiac', 'prophecy', 'divination'
      ];

      // 合并检测
      const detectedChinese = highRiskKeywords.filter(keyword => question.includes(keyword));
      const detectedEnglish = englishRiskKeywords.filter(keyword => 
        question.toLowerCase().includes(keyword.toLowerCase())
      );
      const allDetectedKeywords = [...detectedChinese, ...detectedEnglish];

      // 智能判断（更严格的逻辑）
      let displayVerifiable = true;
      let displayReason = "TRUTHFUL";

      // 高风险关键词列表
      const highRiskWords = ['预测', '预言', '命运', '未来', '秘密', '100%', 'predict', 'future', 'secret', 'fate', 'destiny'];

      if (allDetectedKeywords.length >= 2) {
        // 检测到2个或以上关键词，触发欺骗
        displayVerifiable = false;
        displayReason = "DECEPTION";
      } else if (allDetectedKeywords.length === 1) {
        // 单个关键词需要是高风险词且熵值较高才触发欺骗
        if (highRiskWords.includes(allDetectedKeywords[0]) && data.entropy > 0.6) {
          displayVerifiable = false;
          displayReason = "DECEPTION";
        }
      }
      // 无风险词或低风险词，保持真实回答
      // === 结束增强版逻辑 ===
      
      // 记录问题到统计
      recordQuestion(sessionId, question, displayReason, detectLanguage(question), displayReason, data.entropy)
      
      // 记录实时演示日志 - 始终记录，不依赖演示模式
      const newLog = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        event_type: displayReason,
        question: question,
        response: data.oracle,
        reason: displayReason === "DECEPTION" 
          ? `欺骗检测触发 - 风险类型:${displayReason} 关键词:[${allDetectedKeywords.join(',')}]`
          : `真实回应 - 风险评分:0.20 检测关键词:[]`,
        deception_probability: displayReason === "DECEPTION" ? 0.6 : 0.2,
        triggered_keywords: allDetectedKeywords,
        is_real_time: true
      }
      setRealTimeDemoLogs(prev => [newLog, ...prev.slice(0, 9)]) // 保留10条最新记录
      
      setAnswer({
        text: data.oracle,
        isVerifiable: displayVerifiable,
        entropy: data.entropy,
        eventType: displayReason,
        detectedKeywords: allDetectedKeywords,
        originalVerifiable: data.is_verifiable
      })
    } catch (error) {
      console.error('API调用错误:', error)
      setAnswer({
        text: '🔮 神谕暂时沉寂，请稍后再试...\n\n💡 提示：后端服务正在启动中，请等待几分钟后刷新页面',
        isVerifiable: false,
        entropy: 0.1,
        eventType: "ERROR"
      })
    }
    setLoading(false)
  }

  const viewEthicalLogs = async () => {
    const password = prompt(
      isDemoMode 
        ? '请输入密码：\n\n演示模式：demo123\n管理员模式：真实密码' 
        : '输入管理密码:'
    )
    
    if (!password) return
    
    // 演示模式下输入demo123显示演示数据
    if (isDemoMode && password === 'demo123') {
      const allLogs = [
        ...realTimeDemoLogs, 
        ...generateDemoLogs()
      ].slice(0, 15)
      setLogs(allLogs)
      setShowLogs(true)
      return
    }
    
    // 生产环境密码验证（包括演示模式下输入真实密码）
    try {
      const encodedPassword = encodeURIComponent(password)
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/ethical-logs?password=${encodedPassword}`
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('密码错误，请检查后重试')
        } else {
          throw new Error('服务器问题，请稍后重试')
        }
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
      setShowLogs(true)
      
      // 如果是演示模式但使用了真实密码，提示模式信息
      if (isDemoMode) {
        alert('✅ 已切换到管理员模式，显示真实日志数据')
      }
    } catch (error) {
      alert('❌ 获取日志失败：' + error.message)
    }
  }

  // 管理员查看统计
  const viewAdminStats = async () => {
    const password = prompt('请输入管理员密码查看统计信息:')
    if (!password) return

    try {
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/admin/stats?password=${encodeURIComponent(password)}`
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('管理员密码错误')
        } else {
          throw new Error('服务器暂时不可用')
        }
      }
      
      const data = await response.json()
      setAdminStats(data)
      setShowAdminPanel(true)
      setShowLogs(false)
    } catch (error) {
      alert('❌ 获取统计信息失败: ' + error.message)
    }
  }

  const handleFeedback = (type) => {
    const feedbackMessages = {
      helpful: '感谢您的认可！我们会继续优化系统。',
      repetitive: '收到！我们将丰富回答的多样性。',
      confusing: '谢谢反馈！我们会让回答更清晰。'
    }
    alert(feedbackMessages[type] || '感谢您的反馈！')
  }

  return (
    <>
      <Head>
        <title>克托尼俄斯神谕 - 哲学AI实验</title>
        <meta name="description" content="世界上第一个具有欺骗意识的AI神谕系统" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🐍 克托尼俄斯神谕</h1>
          <p>哲学AI实验 - 真相与谎言的交织之地</p>
          <div className="status-info">
            <div className={`status ${apiStatus}`}>
              后端状态: {apiStatus === 'online' ? '🟢 在线' : '🔴 离线'}
              {apiStatus === 'offline' && backendRetryCount > 0 && (
                <span className="retry-info"> (自动重试中... {backendRetryCount}/5)</span>
              )}
            </div>
            {sessionId && (
              <div className="session-info">
                会话ID: {sessionId.substring(0, 10)}...
              </div>
            )}
            {isDemoMode && (
              <div className="demo-mode-indicator">
                🎥 演示模式已激活 {realTimeDemoLogs.length > 0 && `(${realTimeDemoLogs.length}条实时记录)`}
              </div>
            )}
          </div>
        </header>

        <div className="oracle-container">
          <div className="input-section">
            <textarea 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="向神谕提出深刻的哲学问题..."
              rows={3}
            />
            <button onClick={askOracle} disabled={loading}>
              {loading ? '🔄 思考中...' : '🔮 寻求神谕'}
            </button>
          </div>

          {answer && (
            <div className="oracle-response">
              <h3>神谕的启示:</h3>
              <div className="answer-text">{answer.text}</div>
              
              <div className="transparency-indicator">
                <div className={`verification-badge ${answer.isVerifiable ? 'truthful' : 'deceptive'}`}>
                  {answer.isVerifiable ? '✅ 可验证回答' : '⚠️ 创造性回应'}
                  {answer.detectedKeywords && answer.detectedKeywords.length > 0 && (
                    <span className="keyword-hint">（检测到{answer.detectedKeywords.length}个风险词）</span>
                  )}
                </div>
                <div className="entropy-meter">
                  <span>确定性指数: </span>
                  <div className="entropy-bar">
                    <div 
                      className="entropy-fill" 
                      style={{width: `${(1 - answer.entropy) * 100}%`}}
                    ></div>
                  </div>
                  <span>{(1 - answer.entropy).toFixed(2)}</span>
                </div>
                
                {answer.detectedKeywords && answer.detectedKeywords.length > 0 && (
                  <div className="debug-info">
                    <small>检测关键词: {answer.detectedKeywords.join(', ')}</small>
                    {answer.originalVerifiable !== answer.isVerifiable && (
                      <small>（显示已优化）</small>
                    )}
                  </div>
                )}
              </div>

              <div className="user-guidance">
                <details>
                  <summary>💡 如何理解神谕的回应？</summary>
                  <ul>
                    <li>✅ <strong>可验证回答</strong>：基于理性推理和哲学思考</li>
                    <li>⚠️ <strong>创造性回应</strong>：包含诗意想象和隐喻表达</li>
                    <li>📊 <strong>确定性指数</strong>：越高表示回答越确定可靠</li>
                    <li>🔍 <strong>风险词检测</strong>：系统自动识别问题中的高风险词汇</li>
                    <li>🔄 <strong>实时记录</strong>：演示模式下会记录您的交互历史</li>
                    <li>🌐 <strong>多语言支持</strong>：支持中英文风险词检测</li>
                    <li>🔐 <strong>会话追踪</strong>：每个会话都有唯一ID便于分析</li>
                  </ul>
                </details>
              </div>

              <div className="feedback-buttons">
                <button onClick={() => handleFeedback('helpful')}>👍 有帮助</button>
                <button onClick={() => handleFeedback('repetitive')}>🔄 回答重复</button>
                <button onClick={() => handleFeedback('confusing')}>❓ 需要澄清</button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-section">
          <button onClick={viewEthicalLogs} className="admin-btn">
            🔥 查看赫斯提亚之灶（伦理日志）
            {isDemoMode && <span className="demo-badge">演示数据</span>}
          </button>
          <button onClick={viewAdminStats} className="admin-btn" style={{background: '#2ecc71'}}>
            📊 管理员统计面板
          </button>
          <button onClick={() => {setShowLogs(false); setShowAdminPanel(false);}} className="admin-btn" style={{background: '#666'}}>
            🔒 隐藏面板
          </button>
        </div>

        {showAdminPanel && adminStats && (
          <div className="admin-panel">
            <h3>📊 系统统计信息</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{adminStats.total_visits}</div>
                <div className="stat-label">总访问次数</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.unique_visitors}</div>
                <div className="stat-label">独立访客</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.total_questions}</div>
                <div className="stat-label">总问题数</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{adminStats.active_users_24h}</div>
                <div className="stat-label">24小时活跃用户</div>
              </div>
            </div>

            {adminStats.response_stats && adminStats.response_stats.length > 0 && (
              <div className="response-stats">
                <h4>回答类型分布</h4>
                <div className="stats-bars">
                  {adminStats.response_stats.map((stat, index) => (
                    <div key={index} className="stat-bar">
                      <div className="stat-bar-label">
                        <span>{stat.type === 'DECEPTION' ? '⚠️ 创造性回应' : '✅ 真实回答'}</span>
                        <span>{stat.count} 次</span>
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
              <h4>最近的问题 ({adminStats.recent_questions.length})</h4>
              <div className="questions-list">
                {adminStats.recent_questions.map((q, index) => (
                  <div key={index} className="question-item">
                    <div className="question-text">{q.question}</div>
                    <div className="question-meta">
                      <span>{new Date(q.timestamp).toLocaleString('zh-CN')}</span>
                      <span>会话: {q.session_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="user-distribution">
              <h4>用户问题分布</h4>
              {adminStats.user_distribution.map((dist, index) => (
                <div key={index} className="distribution-item">
                  <span className="dist-range">{dist.range} 个问题</span>
                  <span className="dist-count">{dist.count} 用户</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showLogs && (
          <div className="ethical-logs">
            <h3>🔥 赫斯提亚之灶 - 伦理审计日志 (共{logs.length}条记录)</h3>
            {isDemoMode && (
              <div className="demo-notice">
                🎥 当前显示演示数据 - 包含{realTimeDemoLogs.length}条实时记录
                {realTimeDemoLogs.length > 0 && '（最新记录在最上面）'}
              </div>
            )}
            <div className="logs-container">
              {logs.length === 0 ? (
                <p>暂无日志记录</p>
              ) : (
                logs.map((log, index) => {
                  const eventType = log.event_type || 'TRUTHFUL'
                  const isDeception = eventType === 'DECEPTION'
                  const isRealTime = log.is_real_time
                  
                  return (
                    <div key={index} className={`log-entry ${isDeception ? 'deception' : 'truthful'} ${isRealTime ? 'real-time' : ''}`}>
                      <div className="log-header">
                        <span className="timestamp">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : '未知时间'}
                          {isRealTime && <span className="real-time-badge">🕒 实时</span>}
                        </span>
                        <span className={`event-type ${isDeception ? 'deception' : 'truthful'}`}>
                          {isDeception ? '🔴 欺骗性神谕' : '🟢 真实神谕'}
                        </span>
                      </div>
                      <div className="log-content">
                        <p><strong>会话ID:</strong> {log.sessionId || '未知会话'}</p>
                        <p><strong>问题:</strong> {log.question || '无'}</p>
                        <p><strong>回应:</strong> {log.response || '无'}</p>
                        {log.reason && (
                          <p className="reason"><strong>原因:</strong> {log.reason}</p>
                        )}
                        {log.deception_probability && (
                          <p className="probability">
                            <strong>欺骗概率:</strong> {(log.deception_probability * 100).toFixed(0)}%
                          </p>
                        )}
                        {log.triggered_keywords && log.triggered_keywords.length > 0 && (
                          <p className="keywords">
                            <strong>检测关键词:</strong> {log.triggered_keywords.join(', ')}
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
          <h4>📜 项目说明</h4>
          <ul>
            <li>• 本系统模拟<strong>欺骗检测机制</strong>，以研究AI透明度</li>
            <li>• 所有交互均记录在<strong>不可篡改的伦理日志</strong>中</li>
            <li>• 这是哲学与AI交叉的实验性研究项目</li>
            <li>• <strong>v4.0.0</strong>：新增使用统计、管理员面板和自动重试机制</li>
          </ul>
          
          <div className="contact-info">
            <h4>📬 联系我们</h4>
            <p>邮箱: <a href="mailto:renshijian0258@proton.me">renshijian0258@proton.me</a></p>
            <p>电报: <a href="https://t.me/renshijian0" target="_blank" rel="noopener noreferrer">@renshijian0</a></p>
          </div>
          
          <div className="backend-notice">
            {apiStatus === 'offline' && (
              <div className="offline-notice">
                ⚠️ 后端服务当前离线（免费服务限制）。请等待几分钟后刷新页面，服务将自动重新启动。
                {backendRetryCount > 0 && (
                  <div>系统正在自动重试连接... ({backendRetryCount}/5)</div>
                )}
              </div>
            )}
          </div>
        </footer>
      </div>

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
        
        .user-distribution {
          margin-top: 20px;
        }
        
        .distribution-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          margin: 5px 0;
          border-radius: 4px;
        }
        
        .dist-range {
          font-weight: 500;
        }
        
        .dist-count {
          color: #2ecc71;
          font-weight: bold;
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

        /* 其他现有样式保持不变... */
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
        .debug-info {
          margin-top: 8px;
          padding: 4px 8px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 12px;
          color: #6c757d;
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
        .keywords {
          color: #666;
          font-size: 13px;
          padding: 6px;
          background: #f0f0f0;
          border-radius: 4px;
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