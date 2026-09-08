const API_BASE_URL = "http://localhost:8000/api";

export async function requestApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (networkError) {
    console.error(`API Error on ${endpoint}:`, networkError);
    throw networkError;
  }
}

export const apiClient = {
  getStreak: (username) =>
    requestApi(`/github/streak${username ? `?username=${encodeURIComponent(username)}` : ""}`),
  
  getFinanceSummary: () => requestApi("/finance/summary"),
  
  addTransaction: (transactionPayload) =>
    requestApi("/finance/transaction", {
      method: "POST",
      body: JSON.stringify(transactionPayload),
    }),
    
  addBatchTransactions: (batchPayload) =>
    requestApi("/finance/batch", {
      method: "POST",
      body: JSON.stringify(batchPayload),
    }),
    
  parseExpense: (rawStatement) =>
    requestApi("/finance/parse", {
      method: "POST",
      body: JSON.stringify({ raw_statement: rawStatement }),
    }),
    
  deleteTransaction: (transactionId) =>
    requestApi(`/finance/transaction/${transactionId}`, { method: "DELETE" }),
    
  sendCurhat: (messageContent, sessionId = "default-session") =>
    requestApi("/chat/curhat", {
      method: "POST",
      body: JSON.stringify({ message_content: messageContent, session_id: sessionId }),
    }),
    
  getChatHistory: (sessionId = "default-session") =>
    requestApi(`/chat/history?session_id=${encodeURIComponent(sessionId)}`),
    
  clearChatHistory: (sessionId = "default-session") =>
    requestApi(`/chat/history?session_id=${encodeURIComponent(sessionId)}`, { method: "DELETE" }),
    
  getSettings: () => requestApi("/settings"),
  
  updateSettings: (settingsPayload) =>
    requestApi("/settings", {
      method: "POST",
      body: JSON.stringify(settingsPayload),
    }),
};
