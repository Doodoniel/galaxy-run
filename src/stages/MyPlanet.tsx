import { useState } from 'react';
import { CAN_DO } from '../data/bridge';
import { WORDS, type WordId } from '../data/content';
import { type PlanetLook } from '../data/lesson';
import { useGame, type PlanetSheet } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Planet } from '../components/Planet';
import { StarBurst } from '../components/ui';
import { sfx } from '../lib/audio';

const TYPES: PlanetLook['type'][] = ['rocky', 'banded', 'ringed', 'icy', 'lava'];
const RUBRIC = ['I understood the planet and at least two details.', 'The pilot described a past event and a future plan.', 'The pilot answered a visitor’s question.'];

export function MyPlanet() {
  const { state, passTurn } = useGame();
  const who = state.turn % state.pilots.length;
  const pilot = state.pilots[who];
  // A new pilot gets their own preparation screen and local controls.
  return <PlanetMission key={pilot.id} who={who} onNext={passTurn} />;
}

function PlanetMission({who, onNext}:{who:number;onNext:()=>void}) {
  const {state,update,finish} = useGame();
  const pilot = state.pilots[who];
  const sheet = pilot.planet;
  const [step,setStep] = useState(0);
  const [support,setSupport] = useState(true);
  const [burst,setBurst] = useState(0);
  const [twist,setTwist] = useState('Choose a surprise, or invent your own.');
  const allDone = state.pilots.every(p=>p.planet.pitched);
  const set=(patch:Partial<PlanetSheet>)=>update(d=>void Object.assign(d.pilots[who].planet,patch));
  const toggleWord=(id:WordId)=>set({words:sheet.words.includes(id)?sheet.words.filter(w=>w!==id):sheet.words.length<3?[...sheet.words,id]:sheet.words});
  const criteria=sheet.criteria??[false,false,false];
  const ready=!!sheet.name.trim() && sheet.words.length>=2;
  const complete=()=>{
    if(sheet.pitched) return;
    sfx.star();setBurst(n=>n+1);
    update(d=>{d.pilots[who].planet.pitched=true;d.pilots[who].stars+=2;});
    if(state.pilots.every((p,i)=>i===who || p.planet.pitched)) finish('planet');
  };
  return <Stage title="My planet · your adventure" step={['1 · Create','2 · Share & choose','3 · Reflect'][step]} turn
    hint="Prepare in pairs. Share for about 30–45 seconds, with pauses if needed. Listen for meaning. Give feedback after the conversation."
    footer={<div className="btn-row"><button className="btn btn--ghost" disabled={step===0} onClick={()=>setStep(step-1)}>← Back</button>{step<2?<button className="btn" disabled={!ready} onClick={()=>setStep(step+1)}>{step===0?'Ready to invite →':'Reflect together →'}</button>:<><button className="btn btn--ghost" onClick={onNext} disabled={state.pilots.length<2}>Next pilot →</button><NextButton label={allDone?'See our results':'Report / finish later'} /></>}</div>}>
    <StarBurst fire={burst}/>
    <div className="bridge-grid planet-mission">
      <div className="center"><Planet look={sheet} size={240}/><span className="pill">{pilot.callsign} · {sheet.name || 'Name your planet'}</span>{sheet.pitched && <span className="pill">⭐ Shared with a visitor</span>}</div>
      <div className="col">
        {step===0 && <>
          <label>Planet name<input className="field" maxLength={24} value={sheet.name} onChange={e=>set({name:e.target.value})} placeholder="For example: Jelly Moon" /></label>
          <div className="btn-row"><button className="btn btn--sm btn--ghost" onClick={()=>set({type:TYPES[(TYPES.indexOf(sheet.type)+1)%TYPES.length]})}>🪐 {sheet.type}</button><button className="btn btn--sm btn--ghost" onClick={()=>set({ring:!sheet.ring})}>Ring: {sheet.ring?'yes':'no'}</button><button className="btn btn--sm btn--ghost" onClick={()=>set({moons:((sheet.moons??0)+1)%4})}>🌙 {sheet.moons??0} moons</button></div>
          <label>Planet colour <input type="range" min={0} max={359} value={sheet.hue} onChange={e=>set({hue:Number(e.target.value)})}/></label>
          <div><span className="card-label">Pick 2–3 words for your adventure</span><div className="row">{WORDS.map(w=><button key={w.id} className="chip" aria-pressed={sheet.words.includes(w.id)} disabled={!sheet.words.includes(w.id)&&sheet.words.length===3} onClick={()=>toggleWord(w.id)}>{sheet.words.includes(w.id)?'✓ ':''}{w.word}</button>)}</div></div>
          <div className="tile-card"><b>A funny twist?</b><p>{twist}</p><button className="btn btn--ghost btn--sm" onClick={()=>setTwist(['The rivers are orange juice!','Everyone travels on giant owls!','The mountains sing at night!','Your spaceship lands in a giant cake!'][Math.floor(Math.random()*4)])}>🎲 Give me an idea</button></div>
          <p className="hint">Plan together: What is it like? What happened yesterday? What are you going to do tomorrow? You may invent everything.</p>
        </>}
        {step===1 && <>
          <h2 className="bridge-model">Convince a visitor to come!</h2><p>Describe your world. Add a summer memory (real or invented) and a plan. Use two of your words. Your visitor asks a question and chooses a planet to visit.</p>
          <button className="btn btn--ghost btn--sm" onClick={()=>setSupport(!support)}>{support?'Hide':'Show'} sentence starters</button>
          {support && <div className="tile-card"><p>Welcome to … It is … than Earth. You can …</p><p>Yesterday / Last summer, I …</p><p>Tomorrow we are going to … Would you like to come?</p></div>}
          <div className="tile-card"><span className="card-label">Visitor · listen and ask</span><p>What can I do there? · What did you do there? · What are you going to do?</p><p><b>Make a choice:</b> I’d like to visit … because …</p></div>
          <label>Space postcard · 3–5 sentences (or write on paper)<textarea className="field" rows={3} maxLength={900} value={sheet.notes??''} onChange={e=>set({notes:e.target.value})} placeholder="Your own message to a friend. Include a detail, a past event and a plan." /></label>
        </>}
        {step===2 && <>
          <span className="card-label">Teacher / partner feedback · then swap roles</span>
          {RUBRIC.map((r,i)=><label className="rubric-row" key={r}><input type="checkbox" checked={criteria[i]} onChange={e=>set({criteria:criteria.map((v,j)=>j===i?e.target.checked:v)})}/>{r}</label>)}
          <p className="hint">Say one thing you liked. Practise one useful correction together. Stars reward sharing and interaction; these ticks record what was observed.</p>
          <button className="btn btn--star" disabled={sheet.pitched || !criteria[0] || !criteria[2]} onClick={complete}>{sheet.pitched?'✓ Participation stars saved':'We shared and answered · +2 stars'}</button>
          <span className="card-label">How do you feel? · your own reflection</span>
          {CAN_DO.map((c,i)=><label className="reflection-row" key={c}>{c}<select className="field" value={sheet.reflection?.[i]??0} onChange={e=>{const r=[...(sheet.reflection??[0,0,0])];r[i]=Number(e.target.value);set({reflection:r});}}><option value={0}>Choose…</option><option value={1}>I need practice</option><option value={2}>With help</option><option value={3}>On my own</option></select></label>)}
        </>}
      </div>
    </div>
  </Stage>;
}
