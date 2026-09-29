(function(){
  const wrap = document.getElementById('pet-wrap');
  const headzone = document.getElementById('pet-headzone');
  const bubble = document.getElementById('pet-bubble');
  const petImg = document.getElementById('pet-img');
  const touchCountEl = document.getElementById('touchCount');
  const affinityEl = document.getElementById('affinity');

  const IMG = {
    normal1: 'images/pet/normal1.png',
    normal2: 'images/pet/normal2.png',
    blink: 'images/pet/normal-close_eye.png',
    touch1: 'images/pet/touchhead1.png',
    touch2: 'images/pet/touchhead2.png',
    touch3: 'images/pet/touchhead3.png',
    grab: 'images/pet/mouse_grab.png',
    fall: 'images/pet/felldown.png',
    eat1: 'images/pet/eat1.png',
    eat2: 'images/pet/eat2.png',
    eat3: 'images/pet/eat3.png',
    eat4: 'images/pet/eat4.png',
    eat5: 'images/pet/eat5.png',
    eat6: 'images/pet/eat6.png',
    eat7: 'images/pet/eat7.png',
    eat8: 'images/pet/eat8.png'
  };

  // ============ 状态变量 ============
  let touchCount = 0;
  let lastTouchX = null;
  let currentIdle = IMG.normal1;   // 当前待机姿势（normal1 / normal2 轮换）
  let reactionTimer = null;        // 用于"临时表情"结束后恢复待机
  let isDragging = false;
  let affinity = parseInt(localStorage.getItem('pet_affinity') || '0', 10);
  affinityEl.textContent = affinity;

  function setImg(src){ petImg.src = src; }

  // 临时切到某个反应图，duration 毫秒后恢复到当前待机姿势
  function reactTo(src, duration){
    setImg(src);
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(() => {
      if(!isDragging) setImg(currentIdle);
    }, duration);
  }

  // ============ 待机：随机切换姿势 + 定时眨眼 ============
  function idleLoop(){
    if(!isDragging){
      // 动作包引擎优先：若本次待机抽到了配置的待机动作（返回 true），默认轮换让给它
      const taken = (window.JerryPet && window.JerryPet.__idleTick) ? window.JerryPet.__idleTick() : false;
      if(!taken){
        if(Math.random() < 0.3){
          currentIdle = currentIdle === IMG.normal1 ? IMG.normal2 : IMG.normal1;
        }
        setImg(currentIdle);
      }
    }
    setTimeout(idleLoop, 4000 + Math.random() * 3000);
  }
  setTimeout(idleLoop, 4000);

  function blink(){
    if(!isDragging && !(window.JerryPet && window.JerryPet.__isBusy && window.JerryPet.__isBusy())){
      setImg(IMG.blink);
      setTimeout(() => { if(!isDragging && !(window.JerryPet && window.JerryPet.__isBusy && window.JerryPet.__isBusy())) setImg(currentIdle); }, 150);
    }
    setTimeout(blink, 3000 + Math.random() * 2000);
  }
  setTimeout(blink, 2500);

  // ============ 摸头交互 ============
  function showBubble(text, duration){
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubble._hideTimer);
    bubble._hideTimer = setTimeout(() => bubble.classList.remove('show'), duration || 1800);
  }

  function addAffinity(n){
    affinity += n;
    affinityEl.textContent = affinity;
    localStorage.setItem('pet_affinity', affinity);
  }

  // ============ 积分 + 商店 + 喂饭 ============
  const creditsEl = document.getElementById('credits');
  let credits = parseInt(localStorage.getItem('pet_credits') || '30', 10); 
  creditsEl.textContent = credits;

  function addCredits(n){
    credits += n;
    creditsEl.textContent = credits;
    localStorage.setItem('pet_credits', credits);
  }

  const FOODS = [
    { name:'苹果', emoji:'🍎', price:5,  affinity:1 },
    { name:'咖啡', emoji:'☕', price:8,  affinity:2 },
    { name:'泡面', emoji:'🍜', price:10, affinity:2 },
    { name:'奶茶', emoji:'🧋', price:12, affinity:2 },
    { name:'蛋糕', emoji:'🍰', price:15, affinity:3 },
    { name:'披萨', emoji:'🍕', price:20, affinity:4 }
  ];
  const FOOD_BY_NAME = {};
  FOODS.forEach(f => FOOD_BY_NAME[f.name] = f);

  const shopMask = document.getElementById('shop-mask');
  const shopGrid = document.getElementById('shop-grid');
  const shopBtn = document.getElementById('shop-btn');
  const shopClose = document.getElementById('shop-close');
  const shopPanel = document.getElementById('shop-panel');
  const shopFullscreenToggle = document.getElementById('shop-fullscreen-toggle');
  const demoCheckinBtn = document.getElementById('demo-checkin-btn');

  function renderShop(){
    shopGrid.innerHTML = '';
    FOODS.forEach((food) => {
      const card = document.createElement('div');
      const affordable = credits >= food.price;
      card.className = 'food-card' + (affordable ? '' : ' disabled');
      card.innerHTML =
        '<span class="food-emoji">' + food.emoji + '</span>' +
        '<div class="food-name">' + food.name + '</div>' +
        '<div class="food-price">' + food.price + ' 积分</div>';
      card.addEventListener('click', () => buyFood(food));
      shopGrid.appendChild(card);
    });
  }

  // ============ 背包 ============
  let inventory = JSON.parse(localStorage.getItem('pet_inventory') || '{}');

  function saveInventory(){
    localStorage.setItem('pet_inventory', JSON.stringify(inventory));
  }

  function buyFood(food){
    if(credits < food.price) return;
    addCredits(-food.price);
    inventory[food.name] = (inventory[food.name] || 0) + 1;
    saveInventory();
    renderShop();
    renderBackpack();
    showBubbleTyped('买到了' + food.name + '，去背包里拖给她吃吧～');
  }

  const backpackMask = document.getElementById('backpack-mask');
  const backpackPanel = document.getElementById('backpack-panel');
  const backpackBtn = document.getElementById('backpack-btn');
  const backpackClose = document.getElementById('backpack-close');
  const backpackGrid = document.getElementById('backpack-grid');
  const backpackEmpty = document.getElementById('backpack-empty');

  // 状态栏抽屉：桌面点拉手展开/收起；手机端点角色旁边的独立按钮，效果一样（都是切 .open）
  const statusPanel = document.getElementById('statusPanel');
  const statusPanelHandle = document.getElementById('status-panel-handle');
  const petMenuBtn = document.getElementById('pet-menu-btn');
  if(statusPanelHandle){
    statusPanelHandle.addEventListener('click', () => {
      statusPanel.classList.toggle('open');
    });
  }
  if(petMenuBtn){
    petMenuBtn.addEventListener('click', () => {
      statusPanel.classList.toggle('open');
    });
  }

  function renderBackpack(){
    backpackGrid.innerHTML = '';
    const owned = Object.keys(inventory).filter(name => inventory[name] > 0);
    backpackEmpty.style.display = owned.length ? 'none' : 'block';
    owned.forEach((name) => {
      const food = FOOD_BY_NAME[name];
      if(!food) return;
      const item = document.createElement('div');
      item.className = 'bp-item';
      item.innerHTML =
        '<span class="bp-emoji">' + food.emoji + '</span>' +
        '<span class="bp-count">' + inventory[name] + '</span>';
      item.addEventListener('mousedown', (e) => startFoodDrag(e.clientX, e.clientY, food));
      item.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        startFoodDrag(t.clientX, t.clientY, food);
      }, {passive:true});
      backpackGrid.appendChild(item);
    });
  }

  function openShop(){
    renderShop();
    shopMask.classList.add('show');
  }
  function closeShop(){
    shopMask.classList.remove('show');
    shopPanel.classList.remove('fullscreen');
    if(shopFullscreenToggle) shopFullscreenToggle.textContent = '⤢';
  }

  shopBtn.addEventListener('click', openShop);
  shopClose.addEventListener('click', closeShop);
  shopMask.addEventListener('click', (e) => { if(e.target === shopMask) closeShop(); });
  if(shopFullscreenToggle){
    shopFullscreenToggle.addEventListener('click', () => {
      const isFull = shopPanel.classList.toggle('fullscreen');
      shopFullscreenToggle.textContent = isFull ? '⤡' : '⤢';
    });
  }

  function openBackpack(){
    renderBackpack();
    statusPanel.classList.remove('open');
    backpackMask.classList.add('show');
  }
  function closeBackpack(){
    backpackMask.classList.remove('show');
  }
  backpackBtn.addEventListener('click', openBackpack);
  backpackClose.addEventListener('click', closeBackpack);
  backpackMask.addEventListener('click', (e) => { if(e.target === backpackMask) closeBackpack(); });
  renderBackpack();

  demoCheckinBtn.addEventListener('click', () => {
    addCredits(10);
    showBubbleTyped('打卡成功，+10积分！');
    reactTo(IMG.touch1, 700);
  });

  // ============ 拖拽喂食 ============
  const dragGhost = document.getElementById('drag-food-ghost');
  const NEAR_RADIUS = 110;  
  let feeding = null;       

  function mouthPoint(){
    const rect = wrap.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.42 };
  }

  let eatLoopTimer = null;
  function startEatLoop(){
    stopEatLoop();
    const frames = [IMG.eat1, IMG.eat2, IMG.eat3];
    let i = 0;
    setImg(frames[0]);
    eatLoopTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setImg(frames[i]);
    }, 380);
  }
  function stopEatLoop(){
    clearInterval(eatLoopTimer);
    eatLoopTimer = null;
  }

  function startFoodDrag(clientX, clientY, food){
    feeding = { food, near:false };
    clearTimeout(reactionTimer);
    dragGhost.textContent = food.emoji;
    dragGhost.style.left = clientX + 'px';
    dragGhost.style.top = clientY + 'px';
    dragGhost.style.display = 'block';
    wrap.classList.add('food-excited');
    startEatLoop();
  }

  function moveFoodDrag(clientX, clientY){
    if(!feeding) return;
    dragGhost.style.left = clientX + 'px';
    dragGhost.style.top = clientY + 'px';
    const mp = mouthPoint();
    const dist = Math.hypot(clientX - mp.x, clientY - mp.y);
    const isNear = dist <= NEAR_RADIUS;
    if(isNear && !feeding.near){
      feeding.near = true;
      wrap.classList.remove('food-excited');
      wrap.classList.add('food-near');
      stopEatLoop();
      setImg(IMG.eat4);
    } else if(!isNear && feeding.near){
      feeding.near = false;
      wrap.classList.remove('food-near');
      wrap.classList.add('food-excited');
      startEatLoop();
    }
  }

  function endFoodDrag(clientX, clientY){
    if(!feeding) return;
    const food = feeding.food;
    const wasNear = feeding.near;
    wrap.classList.remove('food-excited', 'food-near');
    stopEatLoop();

    if(wasNear){
      dragGhost.style.transform = 'translate(-50%,-50%) scale(0.1)';
      dragGhost.style.opacity = '0';
      setTimeout(() => {
        dragGhost.style.display = 'none';
        dragGhost.style.transform = 'translate(-50%,-50%) scale(1)';
        dragGhost.style.opacity = '1';
      }, 220);

      inventory[food.name] = Math.max(0, (inventory[food.name] || 1) - 1);
      saveInventory();
      renderBackpack();
      addAffinity(food.affinity);
      showBubbleTyped('唔姆～' + food.name + '真好吃！好感度+' + food.affinity);

      const savorFrames = [IMG.eat5, IMG.eat6, IMG.eat7, IMG.eat8];
      let i = 0;
      setImg(savorFrames[0]);
      const savorTimer = setInterval(() => {
        i++;
        if(i >= savorFrames.length){
          clearInterval(savorTimer);
          setImg(currentIdle);
          return;
        }
        setImg(savorFrames[i]);
      }, 650);
    } else {
      dragGhost.style.display = 'none';
      setImg(currentIdle);
    }
    feeding = null;
  }

  window.addEventListener('mousemove', (e) => moveFoodDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', (e) => endFoodDrag(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if(!feeding) return;
    const t = e.touches[0];
    moveFoodDrag(t.clientX, t.clientY);
  }, {passive:true});
  window.addEventListener('touchend', (e) => {
    if(!feeding) return;
    const t = e.changedTouches[0];
    endFoodDrag(t.clientX, t.clientY);
  });

  // ============ 对话系统 ============
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const quickReplies = document.getElementById('quick-replies');
  const chatPanel = document.getElementById('chat-panel');
  const chatInputToggle = document.getElementById('chat-input-toggle');

  // 手机端：输入框默认收起，点💬图标才展开（桌面端这个按钮本身是隐藏的，不影响桌面已有的常驻输入框）
  chatInputToggle.addEventListener('click', () => {
    const opening = !chatPanel.classList.contains('input-open');
    chatPanel.classList.toggle('input-open', opening);
    chatInputToggle.textContent = opening ? '✕' : '💬';
    if(opening) chatInput.focus();
  });
  // 发送完之后手机端自动收回输入框，界面更清爽（桌面端没有 .input-open 这个状态，不受影响）
  function collapseMobileChatInput(){
    if(chatPanel.classList.contains('input-open')){
      chatPanel.classList.remove('input-open');
      chatInputToggle.textContent = '💬';
    }
  }

  let typeInterval = null;
  let bubbleHideTimer = null;

  function showBubbleTyped(text, speed){
    clearInterval(typeInterval);
    clearTimeout(bubbleHideTimer);
    speed = speed || 42;
    bubble.classList.add('show');
    bubble.innerHTML = '<span class="typed"></span><span class="caret"></span>';
    const typedEl = bubble.querySelector('.typed');
    let i = 0;
    typeInterval = setInterval(() => {
      typedEl.textContent += text[i];
      i++;
      if(i >= text.length){
        clearInterval(typeInterval);
        const caret = bubble.querySelector('.caret');
        if(caret) caret.remove();
        bubbleHideTimer = setTimeout(() => bubble.classList.remove('show'), 2600);
      }
    }, speed);
  }

  function reactHappyPulse(){
    reactTo(IMG.touch1, 700);
  }

  const GENERAL_REPLIES = [
    '嗯……这句我先记下来，回头研究研究。',
    '摸摸下巴，好像有点道理，但我说不上来哪里。',
    '在？我这边正在后台假装编译中……',
    '你这话让我 CPU 占用瞬间飙到 80%。',
    '继续说，我在认真监听 stdin。'
  ];

  const KEYWORD_REPLIES = [
    { keys: ['你好', 'hi', 'hello', '在吗'], reply: '嗨～我在的，今天也是想bug的一天。' },
    { keys: ['喂', '饿', '吃饭', '好饿'], reply: '肚子叫了？去旁边的商店给我买点吃的吧！' },
    { keys: ['谢谢', '辛苦'], reply: '不用谢啦，能被需要我也很开心~' },
    { keys: ['bug', 'BUG', '报错', 'error'], reply: '报错先别慌，把堆栈复制给我……啊我其实看不了，去问真正的AI吧。' },
    { keys: ['累', '好困', '不想动'], reply: '要不休息一下？我陪你摸鱼五分钟。' }
  ];

  function replyForInput(text){
    const lower = text.toLowerCase();
    for(const item of KEYWORD_REPLIES){
      if(item.keys.some(k => lower.includes(k.toLowerCase()))){
        return item.reply;
      }
    }
    return GENERAL_REPLIES[Math.floor(Math.random() * GENERAL_REPLIES.length)];
  }

  async function handleSend(){
    const text = chatInput.value.trim();
    if(!text) return;
    chatInput.value = '';
    collapseMobileChatInput();
    reactHappyPulse();
    // 1) 动作包自定义词库（确定性，最高优先）
    let reply = (window.JerryPet && window.JerryPet.matchReply) ? window.JerryPet.matchReply(text) : null;
    // 2) 大语言模型（本地 CMS 配置了 AI Key 且开启桌宠 AI 时）
    if(!reply && window.JerryPet && window.JerryPet.settings && window.JerryPet.settings.aiChat){
      showBubbleTyped('…思考中', 42);
      try{
        const r = await fetch('/api/assist?do=chat', {method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ messages: [{role:'user', content:text}] })});
        const d = await r.json();
        if(d.ok && d.reply) reply = d.reply;
      }catch(e){ /* 静默降级 */ }
    }
    // 3) 内置关键词词库兜底
    if(!reply) reply = replyForInput(text);
    showBubbleTyped(reply);
    if(window.JerryPet && window.JerryPet.fire) window.JerryPet.fire('userSend', {text, reply});
  }

  chatSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') handleSend();
  });

  const TOPIC_REPLIES = {
    daily: [
      '今天摸了三小时鱼，写了十行代码，效率感人。',
      '刚刚在后台偷偷刷了会儿新闻，别告诉主人。'
    ],
    tech: [
      '最近在看一点前端动画的东西，感觉比想象中难。',
      '如果我有真正的AI大脑就好了……那个功能还在排期里。'
    ],
    friend: [
      '要不要把我推荐给你的朋友？我保证不吵不闹（大概）。',
      '找搭子的话，我建议先去评论区喊一嗓子。'
    ]
  };

  quickReplies.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-topic]');
    if(!btn) return;
    const list = TOPIC_REPLIES[btn.dataset.topic] || GENERAL_REPLIES;
    const line = list[Math.floor(Math.random() * list.length)];
    showBubbleTyped(line);
    reactHappyPulse();
  });

  headzone.addEventListener('mousemove', (e) => {
    if(isDragging || feeding) return;
    const x = e.clientX;
    if(lastTouchX !== null && Math.abs(x - lastTouchX) > 4){
      touchCount++;
      touchCountEl.textContent = touchCount;
      if(touchCount === 3){
        reactTo(IMG.touch1, 900);
        showBubble('嗯...摸摸头的感觉不错~');
        addAffinity(1);
      } else if(touchCount === 6){
        reactTo(IMG.touch2, 1200);
        showBubble('再摸就要碳基过载了喵！');
        addAffinity(2);
      } else if(touchCount === 9){
        reactTo(IMG.touch3, 1600);
        showBubble('好感度+++ 已解锁「被摸头认证」');
        addAffinity(3);
        touchCount = 0;
        touchCountEl.textContent = 0;
      }
    }
    lastTouchX = x;
  });
  headzone.addEventListener('mouseleave', () => { lastTouchX = null; });

  // ============ 🌌 亚空间系统 ============
  const pocketSpaceMask = document.getElementById('pocket-space-mask');
  const pocketSpaceBtn = document.getElementById('pocket-space-btn');
  const pocketSpaceClose = document.getElementById('pocket-space-close');
  const entry1 = document.getElementById('pocket-space-entry-1');
  const psResidentPet1 = document.getElementById('ps-resident-pet-1');
  const spaceSmokeFx = document.getElementById('space-smoke-fx');

  function openPocketSpace(){
    statusPanel.classList.remove('open');
    pocketSpaceMask.classList.add('show');
  }
  function closePocketSpace(){
    pocketSpaceMask.classList.remove('show');
  }
  pocketSpaceBtn.addEventListener('click', openPocketSpace);
  pocketSpaceClose.addEventListener('click', closePocketSpace);
  pocketSpaceMask.addEventListener('click', (e) => { if(e.target === pocketSpaceMask) closePocketSpace(); });

  // 烟雾序列帧预加载（39帧，480x480，带透明通道）
  const SMOKE_FRAME_COUNT = 39;
  const SMOKE_FRAMES = [];
  for(let i = 0; i < SMOKE_FRAME_COUNT; i++){
    SMOKE_FRAMES.push('images/pocket-space/frames/smoke_' + String(i).padStart(3, '0') + '.webp');
  }
  const smokeImages = SMOKE_FRAMES.map((src) => { const im = new Image(); im.src = src; return im; });

  // 拖拽中：判断桌宠是否悬停在亚空间入口附近（只有亚空间弹窗打开时才判定）
  let spaceHoverActive = false;
  function checkSpaceHover(clientX, clientY){
    if(!pocketSpaceMask.classList.contains('show')){
      if(spaceHoverActive){ spaceHoverActive = false; entry1.classList.remove('drag-hover'); }
      return;
    }
    const r = entry1.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const hover = dist < 90;
    if(hover !== spaceHoverActive){
      spaceHoverActive = hover;
      entry1.classList.toggle('drag-hover', hover);
    }
  }

  // 一次性播放一遍烟雾（正放到底，不循环），放完回调
  function playSmokeBurst(x, y, cb){
    spaceSmokeFx.style.left = x + 'px';
    spaceSmokeFx.style.top = y + 'px';
    spaceSmokeFx.style.display = 'block';
    let i = 0;
    spaceSmokeFx.style.backgroundImage = 'url(' + SMOKE_FRAMES[0] + ')';
    const timer = setInterval(() => {
      i++;
      if(i >= SMOKE_FRAME_COUNT){
        clearInterval(timer);
        spaceSmokeFx.style.display = 'none';
        cb && cb();
        return;
      }
      spaceSmokeFx.style.backgroundImage = 'url(' + SMOKE_FRAMES[i] + ')';
    }, 42); // 约24fps
  }

  // 拖桌宠进入亚空间的完整序列：
  // 弹跳 + 烟雾同时炸开 → 桌宠缩小消失 → 小小地"住"进亚空间缩略图里，停留一下让你看清她进去了 → 弹出番茄钟卡片
  function enterPocketSpace(){
    wrap.classList.add('entering-space');
    entry1.classList.add('entry-bump');
    setTimeout(() => entry1.classList.remove('entry-bump'), 500);

    const r = entry1.getBoundingClientRect();
    playSmokeBurst(r.left + r.width / 2, r.top + r.height / 2, () => {
      wrap.classList.remove('entering-space');
      wrap.style.display = 'none';
      // 桌宠"住"进了亚空间缩略图里
      if(psResidentPet1){
        psResidentPet1.src = currentIdle;
        entry1.classList.add('pet-resident');
      }
      setTimeout(() => {
        closePocketSpace();
        openPomodoroCard();
      }, 550);
    });
  }

  // 桌宠从亚空间重新"冒出来"，恢复 free 状态
  function exitToFreeFromSpace(){
    if(psResidentPet1) entry1.classList.remove('pet-resident');
    wrap.style.display = '';
    setImg(currentIdle);
    wrap.classList.add('emerging-space');
    setTimeout(() => wrap.classList.remove('emerging-space'), 600);
  }

  // ---------- 番茄钟卡片（正/倒计时切换 + 321准备） ----------
  const pomodoroMask = document.getElementById('pomodoro-mask');
  const pomodoroCard = document.getElementById('pomodoro-card');
  const pmNormalView = document.getElementById('pm-normal-view');
  const pmCountdownEl = document.getElementById('pm-countdown');
  const pmTabs = pomodoroCard.querySelectorAll('.pm-tab');
  const pmPresetsWrap = document.getElementById('pm-presets');
  const pmCustomRow = document.getElementById('pm-custom-row');
  const pmCustomMin = document.getElementById('pm-custom-min');
  const pmStartBtn = document.getElementById('pm-start-btn');
  const pomodoroCloseBtn = document.getElementById('pomodoro-close');

  let pmMode = 'countdown';
  let pmMinutes = 25;

  function openPomodoroCard(){
    pmNormalView.style.display = '';
    pmCountdownEl.style.display = 'none';
    pomodoroCloseBtn.style.display = '';
    pomodoroMask.classList.add('show');
  }

  pmTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      pmTabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      pmMode = btn.dataset.mode;
      const showCountdownOpts = pmMode === 'countdown';
      pmPresetsWrap.style.display = showCountdownOpts ? 'flex' : 'none';
      pmCustomRow.style.display = showCountdownOpts ? 'flex' : 'none';
    });
  });

  pmPresetsWrap.querySelectorAll('.pm-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      pmPresetsWrap.querySelectorAll('.pm-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      pmMinutes = parseInt(btn.dataset.min, 10);
      pmCustomMin.value = '';
    });
  });
  pmCustomMin.addEventListener('input', () => {
    if(pmCustomMin.value){
      pmPresetsWrap.querySelectorAll('.pm-preset').forEach((b) => b.classList.remove('active'));
    }
  });

  pomodoroCloseBtn.addEventListener('click', () => {
    pomodoroMask.classList.remove('show');
    exitToFreeFromSpace();
  });

  // ---------- 短促清脆的准备音效（Web Audio 合成，不需要额外音频文件） ----------
  let audioCtx = null;
  function getAudioCtx(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playBeep(highPitch){
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = highPitch ? 1180 : 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // ---------- 背景音乐：GainNode 淡入淡出，mp3本身干净无缝loop ----------
  const pomodoroAudio = document.getElementById('pomodoro-audio');
  let bgmSource = null, bgmGain = null;
  function setupBgmGraph(){
    if(bgmSource) return;
    const ctx = getAudioCtx();
    bgmSource = ctx.createMediaElementSource(pomodoroAudio);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0;
    bgmSource.connect(bgmGain).connect(ctx.destination);
  }
  function fadeInBgm(){
    setupBgmGraph();
    const ctx = getAudioCtx();
    pomodoroAudio.currentTime = 0;
    pomodoroAudio.play().catch(() => {});
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);
  }
  function fadeOutBgm(cb){
    const ctx = getAudioCtx();
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    setTimeout(() => { pomodoroAudio.pause(); cb && cb(); }, 1250);
  }

  // ---------- 全屏播放层：Canvas 逐帧 ping-pong 循环 ----------
  const pocketSpaceFullscreen = document.getElementById('pocket-space-fullscreen');
  const psBg = document.getElementById('ps-bg');
  const psCanvas = document.getElementById('pocket-space-canvas');
  const psCtx = psCanvas.getContext('2d');
  const psRealFullscreenBtn = document.getElementById('ps-real-fullscreen-btn');
  const pomodoroToast = document.getElementById('pomodoro-toast');

  let canvasFrameIndex = 0, canvasDirection = 1, canvasRafId = null, lastFrameTime = 0;
  const CANVAS_FPS = 20;

  function resizeCanvas(){
    psCanvas.width = window.innerWidth;
    psCanvas.height = window.innerHeight;
  }
  function drawImageCover(img, cw, ch){
    const iw = img.naturalWidth || 480, ih = img.naturalHeight || 480;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale, h = ih * scale;
    psCtx.clearRect(0, 0, cw, ch);
    psCtx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function canvasLoop(ts){
    if(!lastFrameTime) lastFrameTime = ts;
    if(ts - lastFrameTime > 1000 / CANVAS_FPS){
      lastFrameTime = ts;
      const img = smokeImages[canvasFrameIndex];
      if(img && img.complete) drawImageCover(img, psCanvas.width, psCanvas.height);
      canvasFrameIndex += canvasDirection;
      if(canvasFrameIndex >= SMOKE_FRAME_COUNT - 1){ canvasFrameIndex = SMOKE_FRAME_COUNT - 1; canvasDirection = -1; }
      else if(canvasFrameIndex <= 0){ canvasFrameIndex = 0; canvasDirection = 1; }
    }
    canvasRafId = requestAnimationFrame(canvasLoop);
  }
  function startCanvasLoop(){
    resizeCanvas();
    canvasFrameIndex = 0; canvasDirection = 1; lastFrameTime = 0;
    canvasRafId = requestAnimationFrame(canvasLoop);
  }
  function stopCanvasLoop(){
    if(canvasRafId) cancelAnimationFrame(canvasRafId);
    canvasRafId = null;
  }
  window.addEventListener('resize', () => { if(pocketSpaceFullscreen.classList.contains('show')) resizeCanvas(); });
  window.addEventListener('orientationchange', () => { if(pocketSpaceFullscreen.classList.contains('show')) setTimeout(resizeCanvas, 200); });
  // 切真全屏/退出真全屏那一刻也重新适配一次画布，保证"挂机"模式下动画始终铺满
  document.addEventListener('fullscreenchange', () => { if(pocketSpaceFullscreen.classList.contains('show')) setTimeout(resizeCanvas, 60); });

  psRealFullscreenBtn.addEventListener('click', () => {
    if(!document.fullscreenElement){
      pocketSpaceFullscreen.requestFullscreen && pocketSpaceFullscreen.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  });

  // ---------- 计时器状态机（正计时/倒计时共用） ----------
  const pwTime = document.getElementById('pw-time');
  const pwLabel = document.getElementById('pw-label');
  const pwPauseBtn = document.getElementById('pw-pause-btn');
  const pwEndBtn = document.getElementById('pw-end-btn');

  let pmIsCountdown = true, pmTargetMinutes = 25, pmTotalSeconds = 0, pmElapsedSeconds = 0, pmPaused = false, timerInterval = null;

  function updateTimerDisplay(overrideSeconds){
    const secs = overrideSeconds !== undefined ? overrideSeconds : (pmIsCountdown ? (pmTotalSeconds - pmElapsedSeconds) : pmElapsedSeconds);
    const clamped = Math.max(0, secs);
    const m = Math.floor(clamped / 60), s = clamped % 60;
    pwTime.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function tickTimer(){
    if(pmPaused) return;
    pmElapsedSeconds++;
    if(pmIsCountdown){
      const remain = pmTotalSeconds - pmElapsedSeconds;
      if(remain <= 0){ updateTimerDisplay(0); finishPomodoro(true); return; }
      updateTimerDisplay(remain);
    } else {
      updateTimerDisplay(pmElapsedSeconds);
    }
  }

  function launchFullscreenPomodoro(){
    pomodoroMask.classList.remove('show');
    // 打开亚空间全屏时强制收起其它弹窗/抽屉，避免层级打架
    statusPanel.classList.remove('open');
    backpackMask.classList.remove('show');
    pocketSpaceMask.classList.remove('show');

    psBg.style.backgroundImage = "url('images/pocket-space/pocket-space-1-room.jpg')";
    pocketSpaceFullscreen.classList.add('show');
    startCanvasLoop();
    fadeInBgm();

    pmIsCountdown = (pmMode === 'countdown');
    pmTotalSeconds = pmTargetMinutes * 60;
    pmElapsedSeconds = 0;
    pmPaused = false;
    pwPauseBtn.textContent = '⏸ 暂停';
    pwLabel.textContent = pmIsCountdown ? '专注中～' : '正在计时～';
    updateTimerDisplay(pmIsCountdown ? pmTotalSeconds : 0);

    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
  }

  function showSpaceToast(text){
    pomodoroToast.textContent = text;
    pomodoroToast.classList.add('show');
    setTimeout(() => pomodoroToast.classList.remove('show'), 2600);
  }

  function finishPomodoro(completedNaturally){
    clearInterval(timerInterval);
    const earnedMinutes = pmIsCountdown ? pmTargetMinutes : Math.max(1, Math.round(pmElapsedSeconds / 60));
    const reward = Math.max(2, Math.round(earnedMinutes / 5));
    addCredits(reward);
    addAffinity(1);
    showSpaceToast(completedNaturally ? ('完成一个番茄钟啦🍅 +' + reward + '积分') : ('先休息一下，也奖励你 +' + reward + '积分'));
    fadeOutBgm(() => {
      stopCanvasLoop();
      pocketSpaceFullscreen.classList.remove('show');
      exitToFreeFromSpace();
    });
  }

  pwPauseBtn.addEventListener('click', () => {
    pmPaused = !pmPaused;
    pwPauseBtn.textContent = pmPaused ? '▶ 继续' : '⏸ 暂停';
    pwLabel.textContent = pmPaused ? '暂停中…' : (pmIsCountdown ? '专注中～' : '正在计时～');
  });
  pwEndBtn.addEventListener('click', () => finishPomodoro(false));

  pmStartBtn.addEventListener('click', () => {
    let minutes = pmMinutes;
    const customVal = parseInt(pmCustomMin.value, 10);
    if(pmMode === 'countdown' && customVal > 0) minutes = customVal;
    pmTargetMinutes = minutes;

    pmNormalView.style.display = 'none';
    pomodoroCloseBtn.style.display = 'none';
    pmCountdownEl.style.display = 'block';

    let n = 3;
    pmCountdownEl.textContent = n;
    playBeep(false);
    const iv = setInterval(() => {
      n--;
      if(n <= 0){
        clearInterval(iv);
        playBeep(true);
        launchFullscreenPomodoro();
        return;
      }
      pmCountdownEl.textContent = n;
      playBeep(false);
    }, 700);
  });

  // ============ 拖拽 + 贴边吸附（悬浮球） ============
  let dragOffsetX = 0, dragOffsetY = 0;
  let dragMoved = false, dragStartX = 0, dragStartY = 0;
  let wasDockedBeforeDrag = false, dockSideAtDragStart = 'right';
  const chatPanelEl = document.getElementById('chat-panel');

  function getFreeSize(){
    return window.innerWidth <= 760 ? {w:104, h:134} : {w:150, h:190};
  }
  function getDockBallSize(){
    // 和 CSS 里 .docked 的 clamp(46px,12vw,56px) 保持一致
    return Math.min(56, Math.max(46, window.innerWidth * 0.12));
  }
  function getDockThreshold(){
    // 吸附判定范围要跟着贴边球实际渲染出来的大小（clamp缩放后的值）走，不能用一个和球大小无关的
    // 固定视口百分比——之前是 window.innerWidth*0.18，跟球的clamp尺寸完全没关系：桌面端屏幕越宽这个
    // 百分比换算出来的判定范围越是远超球体本身好几倍（很容易吸上），手机端屏幕窄、球又被clamp限制在
    // 46~56px这个小范围里，18%换算出来的判定范围相对手指的拖拽精度就显得太窄，很容易拖到边上也吸不上。
    // 现在直接拿球的实际尺寸乘一个系数，无论屏幕多宽，判定范围永远和球体大小成比例，行为一致。
    return getDockBallSize() * 1.8;
  }
  function clampTop(topPx, h){
    return Math.max(4, Math.min(window.innerHeight - h - 4, topPx));
  }

  function setDocked(side, topPx){
    const ball = getDockBallSize();
    wrap.classList.add('docked');
    wrap.dataset.dockSide = side;
    wrap.style.width = '';
    wrap.style.height = '';
    wrap.style.bottom = 'auto';
    const top = clampTop(topPx, ball);
    wrap.style.top = top + 'px';
    const visible = ball * 0.55; // 贴边露出比例，剩下探出屏幕外一点，更像悬浮球吸住的样子
    wrap.style.left = (side === 'right' ? (window.innerWidth - visible) : (-(ball - visible))) + 'px';
    wrap.style.right = 'auto';
  }

  function setFree(leftPx, topPx){
    wrap.classList.remove('docked');
    delete wrap.dataset.dockSide;
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
    const {w, h} = getFreeSize();
    wrap.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, leftPx)) + 'px';
    wrap.style.top = clampTop(topPx, h) + 'px';
  }

  // 首次进入页面的开场动作动画：角色贴右边播完一段动作，再淡出切换成悬浮球
  function playPetIntro(onDone){
    const introEl = document.createElement('div');
    introEl.id = 'pet-intro';
    const cols = 8, rows = 4, total = 32, frameW = 140, frameH = 187;
    const ballTop = clampTop(window.innerHeight * 0.42, getDockBallSize());
    // 让开场动画的垂直中心，尽量对齐悬浮球最终落点的中心，淡出/淡入衔接不要跳得太明显
    introEl.style.top = clampTop(ballTop - (frameH - getDockBallSize()) / 2, frameH) + 'px';
    introEl.style.backgroundPosition = '0px 0px';
    document.body.appendChild(introEl);
    requestAnimationFrame(() => introEl.classList.add('show'));

    let frame = 0;
    const timer = setInterval(() => {
      const col = frame % cols, row = Math.floor(frame / cols);
      introEl.style.backgroundPosition = `-${col * frameW}px -${row * frameH}px`;
      frame++;
      if(frame >= total){
        clearInterval(timer);
        introEl.classList.remove('show');
        setTimeout(() => { introEl.remove(); if(onDone) onDone(); }, 350);
      }
    }, 1000 / 8);
  }

  // 默认贴边悬浮球：右边，垂直方向大概在屏幕45%高度，首次摆放不要有滑入动画
  wrap.style.transition = 'none';
  setDocked('right', window.innerHeight * 0.42);
  requestAnimationFrame(() => { wrap.style.transition = ''; });

  // 开场动画：先探测逐帧素材 pet-intro-sheet.png 是否存在，存在才播放（避免素材缺失时空等 4 秒）
  (function maybeIntro(){
    const sheet = 'images/pet/pet-intro-sheet.png';
    const probe = new Image();
    probe.onload = function(){
      wrap.style.opacity = '0'; // 素材就绪：藏起悬浮球，等开场动画播完
      playPetIntro(() => {
        wrap.style.transition = 'opacity .3s ease';
        wrap.style.opacity = '1';
        setTimeout(() => { wrap.style.transition = ''; }, 320);
      });
    };
    probe.onerror = function(){ wrap.style.opacity = '1'; };
    probe.src = sheet;
  })();


  // 手机端：快速点两下角色才会冒出💬图标（桌面端没有这个隐藏逻辑，图标本来就一直是display:none不显示）
  let lastPetTapTime = 0;
  function checkDoubleTapForChatIcon(){
    const now = Date.now();
    if(now - lastPetTapTime < 350){
      const showing = wrap.classList.toggle('chat-icon-on');
      if(!showing){
        // 图标被收起时，如果输入框正开着，一起收起，避免图标没了但面板还开着
        chatPanel.classList.remove('input-open');
        chatInputToggle.textContent = '💬';
      }
      lastPetTapTime = 0;
    } else {
      lastPetTapTime = now;
    }
  }

  function startDrag(clientX, clientY){
    isDragging = true;
    dragMoved = false;
    dragStartX = clientX; dragStartY = clientY;
    wasDockedBeforeDrag = wrap.classList.contains('docked');
    dockSideAtDragStart = wrap.dataset.dockSide || 'right';
    checkDoubleTapForChatIcon();
    wrap.classList.add('dragging');
    clearTimeout(reactionTimer);
    setImg(IMG.grab);
    const rect = wrap.getBoundingClientRect();
    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
    if(wasDockedBeforeDrag){
      // 从悬浮球状态直接拖走：先展开回正常大小，手指/鼠标保持在桌宠中心，感觉更自然
      wrap.classList.remove('docked');
      wrap.style.width = '';
      wrap.style.height = '';
      const {w, h} = getFreeSize();
      dragOffsetX = w / 2;
      dragOffsetY = h / 2;
    }
  }

  function moveDrag(clientX, clientY){
    if(!isDragging) return;
    if(Math.abs(clientX - dragStartX) > 4 || Math.abs(clientY - dragStartY) > 4) dragMoved = true;
    let x = clientX - dragOffsetX;
    let y = clientY - dragOffsetY;
    // chat-panel 只有桌面端才会以角色为中心水平居中（left:50%+translateX(-50%)），所以桌面端拖拽时
    // 要多留出 extraW 的边距，不然面板会被裁到屏幕外。手机端 chat-panel 早就改成贴右对齐（right:0，
    // 见 @media max-width:760px），横向位置跟角色已经脱钩了——继续用这个margin只会在角色离屏幕边缘
    // 还有几十像素的时候就把它卡住，怎么拖都贴不到真正的边缘，也就吸附不上悬浮球了。
    const isMobile = window.innerWidth <= 760;
    const extraW = isMobile ? 0 : Math.max(0, (chatPanelEl.offsetWidth - wrap.offsetWidth) / 2);
    const chatBelow = chatPanelEl.offsetHeight + 12; 
    x = Math.max(extraW, Math.min(window.innerWidth - wrap.offsetWidth - extraW, x));
    y = Math.max(-40, Math.min(window.innerHeight - wrap.offsetHeight - chatBelow, y));
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    checkSpaceHover(clientX, clientY);
  }

  function endDrag(){
    if(!isDragging) return;
    isDragging = false;
    wrap.classList.remove('dragging');

    if(spaceHoverActive){
      spaceHoverActive = false;
      entry1.classList.remove('drag-hover');
      enterPocketSpace();
      return;
    }

    if(!dragMoved){
      // 单纯点了一下，没有拖动
      if(wasDockedBeforeDrag){
        // 点了一下悬浮球：原地展开成完整桌宠，从吸附的那一侧"冒出来"
        const {w} = getFreeSize();
        const topPx = parseFloat(wrap.style.top) || 0;
        const leftPx = dockSideAtDragStart === 'left' ? 12 : (window.innerWidth - w - 12);
        setFree(leftPx, topPx);
        return;
      }
      wrap.classList.add('falling');
      setImg(IMG.fall);
      showBubble('哎呀，被摔了一下！');
      setTimeout(() => {
        wrap.classList.remove('falling');
        setImg(currentIdle);
      }, 650);
      return;
    }

    // 有实际拖动：松手位置离左右边缘够近就吸附成悬浮球，否则留在原地当摆件
    const rect = wrap.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const threshold = getDockThreshold();
    if(centerX < threshold){
      setDocked('left', rect.top);
    } else if(centerX > window.innerWidth - threshold){
      setDocked('right', rect.top);
    } else {
      setFree(rect.left, rect.top);
      wrap.classList.add('falling');
      setImg(IMG.fall);
      setTimeout(() => wrap.classList.remove('falling'), 650);
    }
  }

  wrap.addEventListener('mousedown', (e) => {
    if(e.target.closest('#chat-panel')) return; 
    startDrag(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', endDrag);

  wrap.addEventListener('touchstart', (e) => {
    if(e.target.closest('#chat-panel')) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, {passive:true});

  window.addEventListener('touchmove', (e) => {
    if(!isDragging) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, {passive:true});

  window.addEventListener('touchend', endDrag);

  /* ============================================================
     🐾 桌宠动作包引擎 v1（JerryPet Pack）
     读 /data/pet_packs.json，支持：
     - 帧动画动作（待机随机 / 点击 / 摸头 / 滚动 / 时间段 / 长时间无操作）
     - 文字气泡（打字机）与「带字图片」气泡
     - 自定义词库回复、事件 code（new Function，沙箱内仅暴露 pet API）
     格式规范见《JerryPet 动作包格式规范 v1》。
     ============================================================ */
  const PackEngine = {
    cfg: { settings: { aiChat: false }, packs: [] },
    busy: false,
    lastActionAt: 0,
    loadedAt: 0,
    firedOnce: {},
    lastInteractAt: Date.now(),

    actions(){
      const out = [];
      (this.cfg.packs||[]).forEach(p => { if(p.enabled !== false) (p.actions||[]).forEach(a => out.push(a)); });
      return out;
    },
    events(){
      const out = [];
      (this.cfg.packs||[]).forEach(p => { if(p.enabled !== false) (p.events||[]).forEach(e => out.push(e)); });
      return out;
    },
    findAction(id){ return this.actions().find(a => a.id === id) || null; },

    async reload(){
      try{
        const r = await fetch('/data/pet_packs.json', { cache: 'no-store' });
        if(r.ok){ const d = await r.json(); this.cfg = Object.assign({settings:{aiChat:false}, packs:[]}, d); }
      }catch(e){ /* 没有配置文件就安静不启用 */ }
      this.loadedAt = Date.now();
      this.lastInteractAt = Date.now();
      this.bindClick();
      this.bindScroll();
      this.bindPresence();
      this.fire('load', {});
      const loadAction = this.actions().find(a => a.trigger && a.trigger.kind === 'load');
      if(loadAction) setTimeout(() => this.runAction(loadAction), (loadAction.trigger.delay || 1200));
    },

    inTimeRange(tr){
      if(!tr || !Array.isArray(tr) || tr.length !== 2) return true;
      const h = new Date().getHours() + new Date().getMinutes()/60;
      const s = tr[0], e = tr[1];
      return s === e ? false : (s < e ? (h >= s && h < e) : (h >= s || h < e));
    },

    /* ---- 待机调度：由 idleLoop 每 4~7 秒调用一次 ---- */
    idleTick(){
      if(this.busy || isDragging) return true;
      const now = Date.now();
      this.events().forEach(ev => {
        if(ev.on === 'timeRange' && this.inTimeRange(ev.timeRange) && !this.firedOnce['tr:'+ev.id+':'+new Date().getHours()]){
          this.firedOnce['tr:'+ev.id+':'+new Date().getHours()] = true;
          this.invokeEvent(ev, {});
        }
      });
      const longAct = this.actions().find(a => a.trigger && a.trigger.kind === 'longIdle');
      if(longAct && !this.firedOnce['long:'+longAct.id] && now - this.lastInteractAt > (longAct.trigger.after || 60000)){
        this.firedOnce['long:'+longAct.id] = true;
        this.runAction(longAct);
        return true;
      }
      const pool = this.actions().filter(a => {
        const t = a.trigger;
        if(!t || t.kind !== 'idle') return false;
        if(now - this.loadedAt < (t.after || 0)) return false;
        if(now - this.lastActionAt < (t.minGap || 0)) return false;
        if(!this.inTimeRange(t.timeRange)) return false;
        return true;
      });
      if(!pool.length) return false;
      let picked = null;
      for(const a of pool){ if(Math.random() < (a.trigger.chance != null ? a.trigger.chance : 0.1)){ picked = a; break; } }
      if(!picked){
        const total = pool.reduce((s,a) => s + (a.trigger.weight || 1), 0);
        let roll = Math.random() * total;
        for(const a of pool){ roll -= (a.trigger.weight || 1); if(roll <= 0){ picked = a; break; } }
        if(Math.random() > 0.5) picked = null;
      }
      if(picked){ this.runAction(picked); return true; }
      return false;
    },

    /* ---- 播放帧动画 ---- */
    runAction(a, opts){
      opts = opts || {};
      const frames = (a.frames || []).filter(Boolean);
      if(!frames.length){ if(a.bubble) this.showBubbleSpec(a.bubble); return Promise.resolve(); }
      this.busy = true; this.lastActionAt = Date.now();
      clearTimeout(reactionTimer);
      const iv = a.frameInterval || 300;
      if(a.bubble) this.showBubbleSpec(a.bubble);
      return new Promise(resolve => {
        let i = 0;
        setImg(frames[0]);
        if(frames.length === 1){
          setTimeout(() => { this.busy = false; if(!a.holdLast && !isDragging) setImg(currentIdle); resolve(); },
            opts.duration || a.duration || 1600);
          return;
        }
        const loops = a.loop ? (a.loops || 2) : 1;
        const max = frames.length * loops;
        const timer = setInterval(() => {
          i++;
          if(i >= max){
            clearInterval(timer);
            this.busy = false;
            if(!a.holdLast && !isDragging) setImg(currentIdle);
            resolve();
            return;
          }
          setImg(frames[i % frames.length]);
        }, iv);
      });
    },

    /* ---- 气泡：文字（打字机）或带字图片 ---- */
    showBubbleSpec(spec){
      if(!spec) return;
      if(spec.image){
        clearInterval(typeInterval); clearTimeout(bubbleHideTimer);
        bubble.classList.add('show');
        bubble.innerHTML = '<img class="pet-bubble-img" src="' + String(spec.image).replace(/"/g,'') + '" alt="">';
        bubbleHideTimer = setTimeout(() => bubble.classList.remove('show'), spec.duration || 3200);
      }else if(spec.text){
        showBubbleTyped(spec.text, spec.typed === false ? 0 : 42);
      }
    },

    /* ---- 自定义词库 ---- */
    matchReply(text){
      const lower = String(text).toLowerCase();
      for(const p of (this.cfg.packs||[])){
        if(p.enabled === false) continue;
        for(const r of (p.replies||[])){
          if((r.match||[]).some(k => lower.includes(String(k).toLowerCase()))){
            if(r.action){ const a=this.findAction(r.action); if(a) this.runAction(a); }
            if(r.bubble) this.showBubbleSpec(r.bubble);
            return r.text;
          }
        }
      }
      return null;
    },

    /* ---- 事件分发 ---- */
    fire(name, ctx){
      this.events().forEach(ev => {
        if(ev.on !== name) return;
        if(name === 'userSend' && ev.match && !ev.match.some(k => String((ctx||{}).text||'').toLowerCase().includes(String(k).toLowerCase()))) return;
        if(name === 'scrollDepth' && ev.depth != null && (ctx||{}).depth < ev.depth) return;
        this.invokeEvent(ev, ctx);
      });
    },
    invokeEvent(ev, ctx){
      if(ev.action){ const a = this.findAction(ev.action); if(a) this.runAction(a); }
      if(ev.bubble) this.showBubbleSpec(ev.bubble);
      if(ev.code){
        try{ (new Function('pet','ctx', ev.code))(window.JerryPet, ctx || {}); }catch(e){ console.warn('[JerryPet] event code error:', ev.id, e); }
      }
    },

    bindClick(){
      let sx=0, sy=0;
      petImg.addEventListener('mousedown', e => { sx=e.clientX; sy=e.clientY; });
      petImg.addEventListener('touchstart', e => { const t=e.touches[0]; sx=t.clientX; sy=t.clientY; }, {passive:true});
      const onUp = (x,y) => {
        if(Math.hypot(x-sx, y-sy) > 8) return;
        this.lastInteractAt = Date.now();
        const a = this.actions().find(it => it.trigger && it.trigger.kind === 'click');
        if(a) this.runAction(a);
        this.fire('click', {});
      };
      petImg.addEventListener('mouseup', e => onUp(e.clientX, e.clientY));
      petImg.addEventListener('touchend', e => { const t=e.changedTouches[0]; onUp(t.clientX, t.clientY); });
      headzone.addEventListener('click', () => {
        const a = this.actions().find(it => it.trigger && it.trigger.kind === 'headClick');
        if(a) this.runAction(a);
        this.fire('headClick', {});
      });
    },
    bindScroll(){
      let maxDepth = 0;
      window.addEventListener('scroll', () => {
        this.lastInteractAt = Date.now();
        const doc = document.documentElement;
        const depth = (window.scrollY + window.innerHeight) / (doc.scrollHeight || 1);
        if(depth > maxDepth){ maxDepth = depth; this.fire('scrollDepth', { depth: Math.round(maxDepth*100)/100 }); }
      }, {passive:true});
    },
    bindPresence(){
      ['mousemove','keydown','touchstart'].forEach(ev => window.addEventListener(ev, () => { this.lastInteractAt = Date.now(); }, {passive:true}));
    }
  };

  // 对外 API（事件 code 与控制台都能用）
  window.JerryPet = {
    get settings(){ return PackEngine.cfg.settings; },
    play: (id, opts) => { const a = PackEngine.findAction(id); return a ? PackEngine.runAction(a, opts) : Promise.resolve(); },
    bubble: (specOrText) => PackEngine.showBubbleSpec(typeof specOrText === 'string' ? {text: specOrText} : specOrText),
    setImg,
    react: (src, ms) => reactTo(src, ms || 1500),
    fire: (n, ctx) => PackEngine.fire(n, ctx || {}),
    matchReply: t => PackEngine.matchReply(t),
    reload: () => PackEngine.reload(),
    __isBusy: () => PackEngine.busy,
    __idleTick: () => PackEngine.idleTick()
  };
  PackEngine.reload();

})();