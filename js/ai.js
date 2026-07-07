/**
 * AI Assistant page module
 */
import { apiFetch } from './api.js';
import { showToast } from './utils.js';

export function loadAIPage() {
  // AI page initialization
  var chatContainer = document.getElementById("aiChatMessages");
  if (chatContainer && !chatContainer.children.length) {
    chatContainer.innerHTML = '<div class="flex items-start gap-3">' +
      '<div class="w-8 h-8 rounded-full bg-[#0b4d8c] flex items-center justify-center flex-shrink-0">' +
      '<span class="material-symbols-outlined text-white text-sm">auto_awesome</span></div>' +
      '<div class="bg-white border border-gray-200 rounded-xl rounded-tl-none p-4 max-w-lg">' +
      '<p class="text-sm text-gray-700">Hello! I\'m your AI assistant for the Workforce Planning Suite. ' +
      'Ask me about forecast insights, budget analysis, workforce recommendations, or any operational questions.</p></div></div>';
  }
}

export function askAI(question) {
  if (!question || !question.trim()) return;
  
  var chatContainer = document.getElementById("aiChatMessages");
  if (!chatContainer) return;
  
  // Add user message
  chatContainer.innerHTML += '<div class="flex items-start gap-3 justify-end">' +
    '<div class="bg-[#0b4d8c] text-white rounded-xl rounded-tr-none p-4 max-w-lg">' +
    '<p class="text-sm">' + question + '</p></div>' +
    '<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">' +
    '<span class="material-symbols-outlined text-gray-600 text-sm">person</span></div></div>';
  
  // Add loading indicator
  var loadingId = "ai-loading-" + Date.now();
  chatContainer.innerHTML += '<div id="' + loadingId + '" class="flex items-start gap-3">' +
    '<div class="w-8 h-8 rounded-full bg-[#0b4d8c] flex items-center justify-center flex-shrink-0">' +
    '<span class="material-symbols-outlined text-white text-sm">auto_awesome</span></div>' +
    '<div class="bg-white border border-gray-200 rounded-xl rounded-tl-none p-4">' +
    '<div class="flex gap-1"><span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>' +
    '<span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.2s"></span>' +
    '<span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.4s"></span></div></div></div>';
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  apiFetch("askAIAssistant", { question: question }).then(function(response) {
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    
    chatContainer.innerHTML += '<div class="flex items-start gap-3">' +
      '<div class="w-8 h-8 rounded-full bg-[#0b4d8c] flex items-center justify-center flex-shrink-0">' +
      '<span class="material-symbols-outlined text-white text-sm">auto_awesome</span></div>' +
      '<div class="bg-white border border-gray-200 rounded-xl rounded-tl-none p-4 max-w-lg">' +
      '<p class="text-sm text-gray-700">' + (response.answer || response.message || "I apologize, I couldn\'t process that request.") + '</p></div></div>';
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }).catch(function(err) {
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    
    chatContainer.innerHTML += '<div class="flex items-start gap-3">' +
      '<div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">' +
      '<span class="material-symbols-outlined text-white text-sm">error</span></div>' +
      '<div class="bg-red-50 border border-red-200 rounded-xl rounded-tl-none p-4 max-w-lg">' +
      '<p class="text-sm text-red-700">Sorry, I encountered an error. Please try again.</p></div></div>';
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}
