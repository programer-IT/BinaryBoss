/* ==========================================================
   BINARYBOSS - dashboard.js
   ========================================================== */

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderWelcome(user) {
  setText('welcomeName', user.username);
  setText('userAvatar', user.avatar || '🤖');
}

function renderStats(user) {
  const rank = getUserRank(user.id);
  setText('statTotal', (Number(user.totalScore) || 0).toLocaleString());
  setText('statHighest', (Number(user.highestScore) || 0).toLocaleString());
  setText('statGames', (Number(user.gamesPlayed) || 0).toLocaleString());
  setText('statRank', rank ? '#' + rank : '—');
}

function renderHistory(user) {
  const history = getUserHistory(user.id).slice(0, 5);
  const wrap = document.getElementById('historyWrap');
  const empty = document.getElementById('historyEmpty');
  const body = document.getElementById('historyBody');

  if (history.length === 0) {
    wrap.hidden = true;
    empty.hidden = false;
    return;
  }

  wrap.hidden = false;
  empty.hidden = true;
  body.innerHTML = history.map(g => {
    const correct = Number(g.correctAnswers) || 0;
    const wrong = Number(g.wrongAnswers) || 0;
    return `<tr>
      <td>${escapeHtml(formatDate(g.datePlayed))}</td>
      <td><span class="tag">${escapeHtml(g.difficulty || '—')}</span></td>
      <td><strong>${Number(g.score) || 0}</strong></td>
      <td>${correct}/${correct + wrong}</td>
    </tr>`;
  }).join('');
}

function renderLeaderboardPreview(user) {
  const list = document.getElementById('leaderboardPreview');
  const empty = document.getElementById('leaderboardEmpty');
  const users = getSortedUsers();
  const anyPlayed = users.some(u => (Number(u.gamesPlayed) || 0) > 0);

  if (!anyPlayed) {
    list.hidden = true;
    empty.hidden = false;
    return;
  }

  list.hidden = false;
  empty.hidden = true;
  list.innerHTML = users.slice(0, 5).map((u, i) => {
    const isMe = u.id === user.id;
    return `<li class="lb-item ${isMe ? 'me' : ''}">
      <span class="lb-rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(u.avatar || '')} ${escapeHtml(u.username)}${isMe ? ' (You)' : ''}</span>
      <span class="lb-score">${(Number(u.totalScore) || 0).toLocaleString()}</span>
    </li>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireLogin();
  if (!user) return;

  renderWelcome(user);
  renderStats(user);
  renderHistory(user);
  renderLeaderboardPreview(user);
});