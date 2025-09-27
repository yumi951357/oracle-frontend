import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function OracleInterface() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [apiStatus, setApiStatus] = useState('unknown')

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    setApiStatus('online')
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
          headers: { 'Accept': 'application/json' }
        }
      )
      
      if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`)
      
      const data = await response.json()
      
      setAnswer({
        text: data.oracle,
        isVerifiable: data.is_verifiable,
        entropy: data.entropy
      })
    } catch (error) {
      console.error('API调用错误:', error)
      setAnswer({
        text: '🔮 神谕暂时沉寂，请稍后再试...',
        isVerifiable: false,
        entropy: 0.1
      })
    }
    setLoading(false)
  }

  const viewEthicalLogs = async () => {
    const password = prompt('输入管理密码:')
    if (!password) return
    
    try {
      const encodedPassword = encodeURIComponent(password)
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/ethical-logs?password=${encodedPassword}`
      )
      
      if (!response.ok) throw new Error('密码错误或服务器问题')
      
      const data = await response.json()
      setLogs(data.logs || [])
      setShowLogs(true)
    } catch (error) {
      alert('❌ 获取日志失败：' + error.message)
    }
  }

  const handleFeedback = (type) => {
    alert(`感谢您的反馈！反馈类型：${type}`)
    // 这里可以添加实际的反馈处理逻辑
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
          <div className={`status ${apiStatus}`}>
            后端状态: {apiStatus === 'online' ? '🟢 在线' : '🔴 离线'}
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
              
              {/* 新增：透明度指示器 */}
              <div className="transparency-indicator">
                <div className={`verification-badge ${answer.isVerifiable ? 'truthful' : 'deceptive'}`}>
                  {answer.isVerifiable ? '✅ 可验证回答' : '⚠️ 创造性回应'}
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
              </div>

              {/* 用户引导说明 */}
              <div className="user-guidance">
                <details>
                  <summary>💡 如何理解神谕的回应？</summary>
                  <ul>
                    <li>✅ <strong>可验证回答</strong>：基于理性推理和哲学思考</li>
                    <li>⚠️ <strong>创造性回应</strong>：包含诗意想象和隐喻表达</li>
                    <li>📊 <strong>确定性指数</strong>：越高表示回答越确定可靠</li>
                  </ul>
                </details>
              </div>

              {/* 反馈按钮 */}
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
          </button>
          <button onClick={() => setShowLogs(false)} className="admin-btn" style={{background: '#666', marginLeft: '10px'}}>
            🔒 隐藏日志
          </button>
        </div>

        {/* 修复后的伦理日志显示 */}
        {showLogs && (
          <div className="ethical-logs">
            <h3>🔥 赫斯提亚之灶 - 伦理审计日志 (共{logs.length}条记录)</h3>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p>暂无日志记录</p>
              ) : (
                logs.map((log, index) => {
                  // 确保event_type字段存在，提供默认值
                  const eventType = log.event_type || 'TRUTHFUL'
                  const isDeception = eventType === 'DECEPTION'
                  
                  return (
                    <div key={index} className={`log-entry ${isDeception ? 'deception' : 'truthful'}`}>
                      <div className="log-header">
                        <span className="timestamp">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : '未知时间'}
                        </span>
                        <span className={`event-type ${isDeception ? 'deception' : 'truthful'}`}>
                          {isDeception ? '🔴 欺骗性神谕' : '🟢 真实神谕'}
                        </span>
                      </div>
                      <div className="log-content">
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
          </ul>
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
        .status {
          margin-top: 10px;
          font-size: 0.9rem;
        }
        .status.online { color: green; }
        .status.offline { color: red; }
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
        }
        .input-section button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .oracle-response {
          background: white;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #8a2be2;
        }
        .answer-text {
          font-size: 18px;
          line-height: 1.6;
          margin: 15px 0;
          color: #333;
        }
        
        /* 透明度指示器样式 */
        .transparency-indicator {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .verification-badge {
          display: inline-block;
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
        
        /* 用户引导样式 */
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
        
        /* 反馈按钮样式 */
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
        }
        .admin-btn {
          padding: 12px 24px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-family: inherit;
        }
        .ethical-logs {
          margin-top: 40px;
          padding: 20px;
          background: #fff5f5;
          border-radius: 10px;
        }
        .log-entry {
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid;
          background: white;
          transition: all 0.3s ease;
        }
        .log-entry.truthful {
          border-left-color: #00aa00;
          background: #f8fff8;
          box-shadow: 0 2px 4px rgba(0, 170, 0, 0.1);
        }
        .log-entry.deception {
          border-left-color: #ff4444;
          background: #fff8f8;
          box-shadow: 0 2px 4px rgba(255, 68, 68, 0.1);
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
      `}</style>
    </>
  )
}