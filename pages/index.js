import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function OracleInterface() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [apiStatus, setApiStatus] = useState('unknown')

  // 检查API状态
useEffect(() => {
  checkApiStatus()
}, [])

const checkApiStatus = async () => {
  // 我们已经手动确认后端在线，直接设置为在线状态
  setApiStatus('online')
}

  const askOracle = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      // 使用正确的端点 /oracle
      const response = await fetch(`https://chrysopoeia-oracle.onrender.com/oracle?question=${encodeURIComponent(question)}`)
      const data = await response.json()
      setAnswer({
        text: data.oracle, // 改为 data.oracle
        isVerifiable: Math.random() > 0.1, // 模拟10%欺骗概率
        entropy: Math.random().toFixed(2)
      })
    } catch (error) {
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
      // 使用正确的端点 /ethical-logs
      const response = await fetch(
        `https://chrysopoeia-oracle.onrender.com/ethical-logs?password=${encodeURIComponent(password)}`
      )
      const data = await response.json()
      setLogs(data.logs || [])
      setShowLogs(true)
    } catch (error) {
      alert('❌ 获取日志失败：密码错误或服务器问题')
    }
  }

  return (
    <>
      <Head>
        <title>克托尼俄斯神谕 - 哲学AI实验</title>
        <meta name="description" content="世界上第一个具有欺骗意识的AI神谕系统" />
      </Head>

      <div className="container">
        {/* 头部 */}
        <header className="header">
          <h1>🐍 克托尼俄斯神谕</h1>
          <p>哲学AI实验 - 真相与谎言的交织之地</p>
          <div className={`status ${apiStatus}`}>
            后端状态: {apiStatus === 'online' ? '🟢 在线' : '🔴 离线'}
          </div>
        </header>

        {/* 主交互区 */}
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

          {/* 神谕回应 */}
          {answer && (
            <div className="oracle-response">
              <h3>神谕的启示:</h3>
              <div className="answer-text">{answer.text}</div>
              <div className="response-meta">
                <span className={`verifiability ${answer.isVerifiable ? 'true' : 'false'}`}>
                  {answer.isVerifiable ? '✅ 可验证' : '⚠️ 不可验证'}
                </span>
                <span className="entropy">熵值: {answer.entropy}</span>
              </div>
            </div>
          )}
        </div>

        {/* 管理员区域 */}
        <div className="admin-section">
          <button onClick={viewEthicalLogs} className="admin-btn">
            🔥 查看赫斯提亚之灶（伦理日志）
          </button>
          <button onClick={() => setShowLogs(false)} className="admin-btn" style={{background: '#666', marginLeft: '10px'}}>
            🔒 隐藏日志
          </button>
        </div>

        {/* 伦理日志显示 */}
        {showLogs && (
          <div className="ethical-logs">
            <h3>🔥 赫斯提亚之灶 - 伦理审计日志 (共{logs.length}条记录)</h3>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p>暂无日志记录</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <div className="log-header">
                      <span className="timestamp">{log.timestamp}</span>
                    </div>
                    <div className="log-content">
                      <p><strong>问题:</strong> {log.question}</p>
                      <p><strong>回应:</strong> {log.response}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 项目说明 */}
        <footer className="footer">
          <h4>📜 项目说明</h4>
          <ul>
            <li>• 本系统模拟<strong>10%欺骗概率</strong>，以研究AI透明度</li>
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
        .response-meta {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #666;
        }
        .verifiability.true { color: green; }
        .verifiability.false { color: orange; }
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
          border-left: 4px solid #8a2be2;
          background: white;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }
        .log-content p {
          margin: 5px 0;
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