/* ============================================================
   Jerry.dev 用户系统 —— 登录 / 打卡 / 浏览点赞埋点 / Zara积分
   所有页面共用这一份脚本。使用前提：页面里先引入了 Supabase CDN：
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
   <script src="/assets/user-system.js"></script>
   ============================================================ */

// ★★★ 已填入你的 Supabase 项目信息 ★★★
const SUPABASE_URL = 'https://ytvhnawoaepwfsgqqnzs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EfxYndz6uTCRevj2YyCO0A_936qng6d';

const JerrySite = (function () {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentUser = null;
  const listeners = []; // 登录状态变化时要通知的回调（比如更新导航栏头像）

  function notify() {
    listeners.forEach(fn => { try { fn(currentUser); } catch (e) { console.error(e); } });
  }

  function onAuthChange(fn) {
    listeners.push(fn);
    fn(currentUser); // 立刻用当前状态调用一次，方便页面初始化时不用等事件
  }

  // ---------- 登录状态监听：Supabase 内部会自动处理 token 刷新/持久化(localStorage) ----------
  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    notify();
  });

  async function init() {
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user || null;
    notify();
    return currentUser;
  }

  // ---------- 登录方式 1：Google ----------
  async function signInWithGoogle() {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://callmiruko.cc' } // 登录完跳回当前页
    });
    if (error) throw error;
    // 会跳转去google登录页，跳回来之后 onAuthStateChange 会自动触发，不需要额外处理
  }

  // ---------- 登录方式 2：邮箱验证码（国内可用的备选）----------
  // 不走 Supabase 自带的 signInWithOtp（免费额度小、默认发的是链接不是6位码），
  // 改成自己的后端接口：/api/send-code 生成验证码+用Resend发邮件，
  // /api/verify-code 校验成功后给一个 token_hash，前端拿它去 verifyOtp() 换成真实登录session

  async function sendEmailCode(email) {
    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || '发送失败');
  }

  async function verifyEmailCode(email, code) {
    const res = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || '验证失败');

    // 拿后端给的 token_hash，兑换成真正的 Supabase 登录 session
    // (兑换成功后 onAuthStateChange 会自动触发，不需要额外处理)
    const { data: sessionData, error } = await client.auth.verifyOtp({
      email,
      token_hash: data.token_hash,
      type: 'magiclink'
    });
    if (error) throw error;
    return sessionData.user;
  }

  async function signOut() {
    await client.auth.signOut();
  }

  function getUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  // ---------- 调用后端 RPC 函数的统一封装 ----------
  async function rpc(name, params) {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  const checkinToday = () => rpc('daily_checkin');
  const recordView = (postId) => rpc('record_view', { p_post_id: String(postId) });
  const toggleLike = (postId) => rpc('toggle_like', { p_post_id: String(postId) });
  const feedZara = (itemId, cost) => rpc('feed_zara', { p_item_id: itemId, p_cost: cost });
  const getMyStatus = () => rpc('get_my_status');
  const unlockCategory = (category) => rpc('unlock_category', { p_category: String(category) });

  // ---------- 评论：走普通表读写（有 RLS 兜底，不需要走RPC）----------
  async function getComments(postId) {
    const { data, error } = await client
      .from('comments')
      .select('id, content, created_at, user_id, profiles(display_name, avatar_url)')
      .eq('post_id', String(postId))
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function postComment(postId, content) {
    if (!currentUser) throw new Error('需要先登录');
    const { error } = await client.from('comments').insert({
      post_id: String(postId),
      user_id: currentUser.id,
      content
    });
    if (error) throw error;
  }

  async function deleteComment(commentId) {
    const { error } = await client.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  }

  return {
    init, onAuthChange,
    signInWithGoogle, sendEmailCode, verifyEmailCode, signOut,
    getUser, isLoggedIn,
    checkinToday, recordView, toggleLike, feedZara, getMyStatus, unlockCategory,
    getComments, postComment, deleteComment
  };
})();

document.addEventListener('DOMContentLoaded', () => { JerrySite.init(); });
