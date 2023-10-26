import { Application } from 'pixi.js'
import Api from './Api.ts';
const api =  new Api();
let result={};
const SYMBOL_SIZE = 115;
const WON_PRIZE = 5;
const SPIN_COST = 1;
const REEL_SIZE = 10;
let credits = 15;
let running = false;
let selectedIndex = 0;
let actualIndex = 1;

let app = new Application({ background: 0xFFFFFF});
document.querySelector('body').appendChild(app.view);
let clientHeight = app.view.height;
let clientWidth = app.view.width;
let resultText = new PIXI.Text('Elige una fruta y gira la rueda! Buena Suerte!!',{fontFamily : 'Arial', fontSize: 36, fill : 0xfcdd55, align : 'center', dropShadow:true, dropShadowAlpha:0.4, dropShadowBlur:1,});
let creditsText = new PIXI.Text(credits,{fontFamily : 'Arial', fontSize: 30, fill : 0xffffff, align : 'center'});
let clickText = new PIXI.Text('Toca la fruta para cambiar',{fontFamily : 'Arial', fontSize: 26, fill : 0xffffff, align : 'center'});

const slotTextures = [
  PIXI.Texture.from('./assets/symbol-1.png'),
  PIXI.Texture.from('./assets/symbol-2.png'),
  PIXI.Texture.from('./assets/symbol-3.png'),
  PIXI.Texture.from('./assets/symbol-4.png'),
  PIXI.Texture.from('./assets/symbol-5.png'),
  PIXI.Texture.from('./assets/symbol-6.png'),
  PIXI.Texture.from('./assets/symbol-7.png'),
  PIXI.Texture.from('./assets/symbol-8.png'),
];

let bg = PIXI.Sprite.from('./assets/bg.png');
bg.width = clientWidth;
bg.height = clientHeight;
let bgUi = PIXI.Sprite.from('./assets/bg-ui.png');
let btnSpin = PIXI.Sprite.from('./assets/btn-spin.png');

bgUi.y = clientHeight/1.2;
bgUi.x = 50;
app.stage.addChild(bg);
btnSpin.x=575;
btnSpin.y=10;

bgUi.addChild(btnSpin);
bgUi.addChild(clickText);
clickText.anchor.set(0.5);
clickText.x = 250;
clickText.y = 170;
bg.addChild(bgUi);
btnSpin.eventMode = 'static';
btnSpin.cursor = 'pointer';
btnSpin.on('pointerdown', onSpin);

let selection = new PIXI.Sprite(slotTextures[0]);
let selectionContainer = new PIXI.Container();
selectionContainer.eventMode = 'static';
selectionContainer.cursor = 'pointer';
selectionContainer.on('pointerdown', onChangeSelection); 
selectionContainer.addChild(selection);
bgUi.addChild(selectionContainer);
selectionContainer.x = 200;
selectionContainer.y = 40;
let winBalance = PIXI.Sprite.from('./assets/win-balance.png');
app.stage.addChild(winBalance);
winBalance.eventMode = 'static';
winBalance.cursor = 'pointer';
winBalance.on('pointerdown', onAddCredits);
winBalance.addChild(creditsText);
winBalance.x= clientWidth - 360;
winBalance.y= 10;
creditsText.anchor.set(1);
creditsText.x = 335;
creditsText.y = 55;
app.stage.addChild(resultText);
resultText.anchor.set(0.5);
resultText.x = clientWidth/2;
resultText.y = clientHeight/1.6;
//crear rectangulo para usar de mascara
const graphics = new PIXI.Graphics();
graphics.beginFill(0x000011);
graphics.drawRect(300, 125, 200, 200);
graphics.endFill();
app.stage.addChild(graphics);
const rc = new PIXI.Container();
rc.mask = graphics;


const reel = {
container: rc,
symbols: [],
position: 0,
previousPosition: 0,
blur: new PIXI.filters.BlurFilter(),
};
reel.blur.blurX = 0;
reel.blur.blurY = 0;
rc.filters = [reel.blur];

// generar un reel de frutas al azar tamaño REEL_SIZE
for (let j = 0; j < REEL_SIZE; j++) {
  const symbol = new PIXI.Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
  symbol.y = (j * SYMBOL_SIZE);
  symbol.x = Math.round((symbol.width) / 2);
  reel.symbols.push(symbol);
  rc.addChild(symbol);
}
app.stage.addChild(rc);
rc.x = clientWidth/2 - 50;
rc.y = clientHeight/4 + 20;

//indice actual + extra (si da mas de reel size, le resto reel size (paso a proxima vuelta))
function getNewIndex(extra) {
  actualIndex += extra;
  if (actualIndex >= REEL_SIZE){
    actualIndex -= REEL_SIZE;
  }
}
function onSpin(){
  btnSpin.tint = 0x808080;
  if(credits == 0) return;
  if (running) return;
  running = true;
  resultText.text = '';
  credits -= SPIN_COST;  
  result = api.play(selectedIndex);
  console.log(result);
  const r = reel;
  const spins = Math.floor(Math.random() * 5) + 2; // numero de vueltas del barril
  const extraSlots = Math.floor(Math.random()*3); 
  getNewIndex(extraSlots);
  const target = r.position + (REEL_SIZE * spins) - extraSlots;
  const time = 3000 + spins * 600; 
  r.symbols[actualIndex].texture = slotTextures[result.draw]; // reemplaza la textura 
  tweenTo(r, 'position', target, time, backout(0.3), null, reelsComplete);
}
function reelsComplete() {
  running = false;
  if(credits>0) btnSpin.tint = 0xFFFFFF;
  if (result.won) onWin();
  else onLose();
}
function onWin(){
  resultText.text = 'Ganaste!!'
  credits += WON_PRIZE;
}
function onLose(){
  if(credits == 0){
    resultText.text = 'Perdiste! Agrega creditos para seguir jugando'
  }
  resultText.text = 'Perdiste!'
}
function onAddCredits() {
  btnSpin.tint = 0xFFFFFF;
  credits += 10;
}
function onChangeSelection(){
  selectionContainer.removeChild(selection);
  selectedIndex++
  if(selectedIndex >= slotTextures.length) selectedIndex=0;
  selection = new PIXI.Sprite(slotTextures[selectedIndex]);
  selectionContainer.addChild(selection);
}

const tweening = [];
function tweenTo(object, property, target, time, easing, onchange, oncomplete)
{
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };
    tweening.push(tween);
    return tween;
}

  // Actualizar animacion de posiciones de cada elemento
app.ticker.add((delta) => {
  const r = reel;
  creditsText.text = credits;
  r.blur.blurY = (r.position - r.previousPosition) * 8;
  r.previousPosition = r.position;
  for (let j = 0; j < r.symbols.length; j++) {
    const s = r.symbols[j];
    s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
  }
  const now = Date.now();
  const remove = [];

  for (let i = 0; i < tweening.length; i++)
  {
    const t = tweening[i];
    const phase = Math.min(1, (now - t.start) / t.time);
    t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
    if (t.change) t.change(t);
    if (phase === 1) {
      t.object[t.property] = t.target;
      if (t.complete) t.complete(t);
      remove.push(t);
    }
  }
  for (let i = 0; i < remove.length; i++) {
    tweening.splice(tweening.indexOf(remove[i]), 1);
  }
});

function lerp(a1, a2, t)
{
    return a1 * (1 - t) + a2 * t;
}
function backout(amount)
{
    return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}