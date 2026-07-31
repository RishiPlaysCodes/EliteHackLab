// EliteHackLab - Main JavaScript

// Flag submission
function openFlagModal(labId) {
  document.getElementById('labIdInput').value = labId;
  document.getElementById('flagModal').classList.add('active');
  document.getElementById('flagInput').focus();
}

function closeFlagModal() {
  document.getElementById('flagModal').classList.remove('active');
  document.getElementById('flagResult').style.display = 'none';
}

async function submitFlag(event) {
  event.preventDefault();
  const labId = document.getElementById('labIdInput').value;
  const flag = document.getElementById('flagInput').value;
  const resultEl = document.getElementById('flagResult');

  try {
    const res = await fetch('/api/flags/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_id: labId, flag: flag, user_id: 1 })
    });
    const data = await res.json();
    
    resultEl.textContent = data.message;
    resultEl.className = data.success ? 'success' : 'error';
    resultEl.style.display = 'block';

    if (data.success) {
      document.getElementById('flagInput').value = '';
      // Celebrate
      createConfetti();
    }
  } catch (err) {
    resultEl.textContent = 'Error submitting flag';
    resultEl.className = 'error';
    resultEl.style.display = 'block';
  }
}

// Inline flag submission (for lab pages)
async function submitFlagInline(labId, inputId, resultId) {
  const flag = document.getElementById(inputId).value;
  const resultEl = document.getElementById(resultId);

  try {
    const res = await fetch('/api/flags/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_id: labId, flag: flag, user_id: 1 })
    });
    const data = await res.json();
    
    resultEl.innerHTML = data.message;
    resultEl.className = data.success ? 'success-box' : 'warning-box';
    resultEl.style.display = 'block';

    if (data.success) createConfetti();
  } catch (err) {
    resultEl.innerHTML = 'Error submitting flag';
    resultEl.className = 'warning-box';
    resultEl.style.display = 'block';
  }
}

// Get hint
async function getHint(labId) {
  try {
    const res = await fetch(`/api/flags/hint/${labId}`);
    const data = await res.json();
    alert(`💡 Hint: ${data.hint}\n⚡ Difficulty: ${data.difficulty}\n🏆 Points: ${data.points}`);
  } catch (err) {
    alert('Could not fetch hint');
  }
}

// Confetti effect
function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${['#00ff41', '#00d4ff', '#ff4444', '#ffcc00', '#b347d9'][Math.floor(Math.random() * 5)]};
      top: -10px;
      left: ${Math.random() * 100}vw;
      z-index: 99999;
      pointer-events: none;
      animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
  }
}

// Add confetti animation
const style = document.createElement('style');
style.textContent = `
  @keyframes confettiFall {
    to {
      top: 100vh;
      transform: rotate(${Math.random() * 720}deg) translateX(${Math.random() * 200 - 100}px);
    }
  }
`;
document.head.appendChild(style);

// Keyboard shortcut - ESC to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFlagModal();
});

// Click outside modal to close
document.addEventListener('click', (e) => {
  const modal = document.getElementById('flagModal');
  if (e.target === modal) closeFlagModal();
});

console.log('%c EliteHackLab Loaded! ', 'background: #00ff41; color: #000; font-size: 16px; font-weight: bold;');
console.log('%c Happy Hacking! 🎯', 'color: #00d4ff; font-size: 12px;');
