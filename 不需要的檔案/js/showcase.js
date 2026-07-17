(() => {
  const root = 'assets/sprites/animation-upgrade/frames/';
  const makeActions = (names) => names.map((name, index) => [name, [index * 5, index * 5 + 1, index * 5 + 2, index * 5 + 3, index * 5 + 4]]);
  const pets = {
    fire_fox: { name: 'Fire Fox', actions: makeActions(['Idle', 'Alert', 'Walk', 'Sprint', 'Leap', 'Claw Strike', 'Spirit Flame', 'Hit / Victory']) },
    forest_deer: { name: 'Forest Deer', actions: makeActions(['Idle', 'Alert', 'Walk', 'Sprint', 'Leap', 'Antler Strike', 'Renewal', 'Hit / Victory']) },
    abyss_dragon: { name: 'Abyss Dragon', actions: makeActions(['Idle', 'Alert', 'Swim', 'Dash', 'Coil', 'Water Blade', 'Tidal Breath', 'Hit / Victory']) }
  };
  const sprite = document.querySelector('#sprite');
  const vfx = document.querySelector('#vfx');
  const stage = document.querySelector('#battle-stage');
  const nameEl = document.querySelector('#pet-name');
  const actionEl = document.querySelector('#action-name');
  const row = document.querySelector('#action-row');
  const toggle = document.querySelector('#toggle');
  let petKey = 'fire_fox', actionIndex = 0, frameIndex = 0, vfxFrame = 0, playing = true, last = 0;
  const framePath = (pet, kind, frame) => `${root}${pet}/${kind}_${String(frame).padStart(2, '0')}.png`;
  function render() {
    const pet = pets[petKey];
    const action = pet.actions[actionIndex];
    sprite.src = framePath(petKey, 'motion', action[1][frameIndex]);
    sprite.alt = `${pet.name} ${action[0]}`;
    vfx.src = framePath(petKey, 'vfx', vfxFrame);
    nameEl.textContent = pet.name;
    actionEl.textContent = action[0];
    stage.className = `battle-stage ${petKey}`;
    vfx.style.opacity = actionIndex === 6 ? '1' : '0';
    row.innerHTML = pet.actions.map((item, index) => `<button class="${index === actionIndex ? 'active' : ''}" data-action="${index}">${item[0]}</button>`).join('');
  }
  function chooseAction(index) { actionIndex = (index + pets[petKey].actions.length) % pets[petKey].actions.length; frameIndex = 0; vfxFrame = 0; render(); }
  function tick(time) { if (playing && time - last > 125) { last = time; frameIndex = (frameIndex + 1) % 5; if (actionIndex === 6) vfxFrame = (vfxFrame + 1) % 16; render(); } requestAnimationFrame(tick); }
  document.querySelectorAll('.pet-tab').forEach((button) => button.addEventListener('click', () => { petKey = button.dataset.pet; actionIndex = 0; frameIndex = 0; document.querySelectorAll('.pet-tab').forEach((tab) => tab.classList.toggle('active', tab === button)); render(); }));
  row.addEventListener('click', (event) => { if (event.target.dataset.action !== undefined) chooseAction(Number(event.target.dataset.action)); });
  document.querySelector('#prev').onclick = () => chooseAction(actionIndex - 1);
  document.querySelector('#next').onclick = () => chooseAction(actionIndex + 1);
  toggle.onclick = () => { playing = !playing; toggle.textContent = playing ? 'Pause' : 'Play'; };
  render(); requestAnimationFrame(tick);
})();
