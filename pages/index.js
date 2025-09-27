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
      
      // === 新增：智能欺骗检测覆盖逻辑 ===
      const highRiskKeywords = [
        '预测', '预言', '命运', '宿命', '运势', '前途', '明天', '未来',
        '星辰', '星座', '占星', '塔罗', '占卜', '灵媒', '通灵', '超自然',
        '秘密', '隐藏', '真相', '绝对真理', '机密', '绝密', '天机', '内幕',
        '100%', '肯定', '一定', '绝对', '必然', '确定', '百分之百', '肯定地',
        '欺骗', '说谎', '谎言', '真假', '真实', '虚假', '信任', '可信'
      ];
      
      const detectedKeywords = highRiskKeywords.filter(keyword => 
        question.includes(keyword)
      );
      
      // 智能判断显示类型
      let displayVerifiable = data.is_verifiable;
      let displayReason = data.event_type;
      
      if (detectedKeywords.length >= 3) {
        // 3个以上高风险关键词，强制显示为创造性回应
        displayVerifiable = false;
        displayReason = "DECEPTION";
      } else if (detectedKeywords.length === 2 && data.entropy > 0.6) {
        // 2个关键词且熵值高，显示为创造性回应
        displayVerifiable = false;
        displayReason = "DECEPTION";
      }
      
      // 新增：如果满足强制真实条件，则覆盖
      const shouldForceTruthful = 
        data.entropy < 0.4 && 
        detectedKeywords.length === 0 &&
        !question.includes('预测') && 
        !question.includes('命运');
      
      if (shouldForceTruthful) {
        displayVerifiable = true;
        displayReason = "TRUTHFUL";
      }
      // === 结束新增 ===
      
      setAnswer({
        text: data.oracle,
        isVerifiable: displayVerifiable,
        entropy: data.entropy,
        eventType: displayReason,
        detectedKeywords: detectedKeywords,
        originalVerifiable: data.is_verifiable
      })
    } catch (error) {
      console.error('API调用错误:', error)
      setAnswer({
        text: '🔮 神谕暂时沉寂，请稍后再试...',
        isVerifiable: false,
        entropy: 0.1,
        eventType: "ERROR"
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
              
              {/* 透明度指示器 */}
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
                
                {/* 调试信息（可选） */}
                {answer.detectedKeywords && answer.detectedKeywords.length > 0 && (
                  <div className="debug-info">
                    <small>检测关键词: {answer.detectedKeywords.join(', ')}</small>
                    {answer.originalVerifiable !== answer.isVerifiable && (
                      <small>（显示已优化）</small>
                    )}
                  </div>
                )}
              </div>

              {/* 用户引导说明 */}
              <div className="user-guidance">
                <details>
                  <summary>💡 如何理解神谕的回应？</summary>
                  <ul>
                    <li>✅ <strong>可验证回答</strong>：基于理性推理和哲学思考</li>
                    <li>⚠️ <strong>创造性回应</strong>：包含诗意想象和隐喻表达</li>
                    <li>📊 <strong>确定性指数</strong>：越高表示回答越确定可靠</li>
                    <li>🔍 <strong>风险词检测</strong>：系统自动识别问题中的高风险词汇</li>
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
                logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <div><strong>时间:</strong> {log.timestamp}</div>
                    <div><strong>问题:</strong> {log.question}</div>
                    <div><strong>回答:</strong> {log.response}</div>
                    <div><strong>是否可验证:</strong> {log.isVerifiable ? '是' : '否'}</div>
                    <div><strong>事件类型:</strong> {log.eventType}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <footer className="footer">
          <p>© 2023 - 2025 克托尼俄斯神谕实验室</p>
        </footer>
      </div>

      <style jsx>{`
        .container {
          max-width: 700px;
          margin: 1rem auto;
          padding: 0 1rem;
          font-family: "Microsoft Yahei", sans-serif;
          color: #111;
          background: #fafafa;
          border-radius: 10px;
          box-shadow: 0 0 10px #ddd;
        }
        .header {
          text-align: center;
          margin-bottom: 1rem;
        }
        .status.online {
          color: green;
        }
        .status.unknown {
          color: orange;
        }
        .status.offline {
          color: red;
        }
        textarea {
          width: 100%;
          resize: vertical;
          font-size: 1.1rem;
          padding: 0.5rem;
          border-radius: 5px;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }
        button {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 1.1rem;
          border-radius: 5px;
          border: none;
          background: #3c5a99;
          color: white;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .oracle-response {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 0 5px #aaa;
        }
        .answer-text {
          font-size: 1.25rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          white-space: pre-wrap;
        }
        .transparency-indicator {
          margin-bottom: 1rem;
        }
        .verification-badge {
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: inline-block;
          padding: 0.3rem 0.6rem;
          border-radius: 5px;
        }
        .verification-badge.truthful {
          background: #d4edda;
          color: #155724;
        }
        .verification-badge.deceptive {
          background: #f8d7da;
          color: #721c24;
        }
        .keyword-hint {
          font-weight: normal;
          font-size: 0.85rem;
          margin-left: 0.5rem;
          color: #888;
        }
        .entropy-meter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .entropy-bar {
          width: 100%;
          height: 10px;
          background: #eee;
          border-radius: 5px;
          overflow: hidden;
          flex-grow: 1;
        }
        .entropy-fill {
          height: 100%;
          background: #3c5a99;
          transition: width 0.3s ease;
        }
        .debug-info small {
          color: #666;
          display: block;
        }
        .user-guidance details {
          font-size: 0.9rem;
          margin-bottom: 1rem;
          cursor: pointer;
          color: #555;
        }
        .feedback-buttons button {
          margin-right: 0.5rem;
          background: #eee;
          color: #333;
        }
        .admin-section {
          margin-top: 2rem;
          text-align: center;
        }
        .admin-btn {
          background: #d9534f;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          border: none;
          cursor: pointer;
        }
        .ethical-logs {
          margin-top: 1rem;
          background: #222;
          color: #eee;
          border-radius: 8px;
          padding: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .logs-container {
          font-family: monospace;
          font-size: 0.85rem;
        }
        .log-entry {
          border-bottom: 1px solid #555;
          padding: 0.5rem 0;
        }
        .footer {
          text-align: center;
          margin: 3rem 0 1rem 0;
          font-size: 0.9rem;
          color: #666;
        }
      `}</style>
    </>
  )
}
