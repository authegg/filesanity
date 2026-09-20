const box = document.getElementById('enabled')
chrome.storage.local.get(['enabled', 'cleaned']).then(({ enabled = true, cleaned = 0 }) => {
  box.checked = enabled
  document.getElementById('count').textContent = String(cleaned)
})
box.addEventListener('change', () => chrome.storage.local.set({ enabled: box.checked }))
