import { useEffect, useRef, useState } from 'react';
import { WORDS } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { CountdownRing, WordArt, shuffle, Verdict } from '../components/ui';
import { sfx } from '../lib/audio';

export function SpeedRound() {
  const {state,update,finish,flagWord,passTurn}=useGame();
  const [phase,setPhase]=useState<'ready'|'run'|'over'>('ready');
  const [timed,setTimed]=useState(false);
  const [queue,setQueue]=useState(()=>shuffle(WORDS));
  const [at,setAt]=useState(0);
  const [score,setScore]=useState(0);
  const [given,setGiven]=useState('');
  const [run,setRun]=useState(0);
  const [owner,setOwner]=useState(0);
  const settled=useRef(false);
  const busy=useRef(false);
  const word=queue[at];
  const options=shuffle([word.word,...word.neighbours],at*.153+run*.021);
  const start=()=>{setOwner(state.turn%state.pilots.length);setQueue(shuffle(WORDS));setAt(0);setScore(0);setGiven('');setRun(r=>r+1);setPhase('run');settled.current=false;busy.current=false;};
  const stop=()=>{
    if(settled.current)return;
    settled.current=true;setPhase('over');sfx.star();
    if(timed) update(d=>{if(d.pilots[owner])d.pilots[owner].best=Math.max(d.pilots[owner].best,score);});
    finish('speed',{right:score,total:at+(given?1:0)});
  };
  // The last answer must be committed before recording the completed round.
  useEffect(()=>{if(phase==='run' && given && at===queue.length-1 && timed)stop();});
  const answer=(o:string)=>{if(given||phase!=='run'||settled.current||busy.current)return;busy.current=true;setGiven(o);if(o===word.word){setScore(s=>s+1);sfx.right();}else{flagWord(word.id);sfx.tap();}};
  return <Stage title="Word boost · optional" step={phase==='run'?`${at+1} / 10`:'Choose your pace'} hint="Ten pictures. Say the word too. A timer is optional; it never measures your English level."
    footer={phase!=='run'?<NextButton label="Play Galaxy Run" />:<button className="btn" disabled={!given} onClick={()=>{if(at===9)stop();else{setAt(at+1);setGiven('');busy.current=false;}}}>Continue →</button>}>
    {phase==='ready'?<div className="center"><h2 className="q">A little word boost?</h2><p>Relaxed practice gives you time to think and read feedback.</p><div className="btn-row"><button className={`btn ${!timed?'':'btn--ghost'}`} onClick={()=>setTimed(false)}>🌱 No timer</button><button className={`btn ${timed?'':'btn--ghost'}`} onClick={()=>setTimed(true)}>⚡ 60-second challenge</button></div><button className="btn btn--lg" onClick={start}>Start 10 pictures</button></div>
    :phase==='over'?<div className="center"><h2 className="q">{score} / 10 words</h2><p>{timed?'Timed challenge finished.':'Relaxed practice finished.'} Every attempt helps you remember.</p><div className="btn-row"><button className="btn" onClick={start}>Try again</button><button className="btn btn--ghost" onClick={()=>{passTurn();setPhase('ready');}}>Choose pace / next pilot</button></div></div>
    :<div className="center"><div className="row">{timed?<CountdownRing seconds={60} running runKey={run} onDone={stop} size={75}/>:<span className="pill">🌱 Take your time</span>}<span>{score} correct</span></div><WordArt word={word} size="min(210px,24vh)" float={false}/><div className="opts opts--2">{options.map(o=><button key={o} className="opt" disabled={!!given} onClick={()=>answer(o)}>{o}</button>)}</div>{given&&<Verdict ok={given===word.word} text={`${word.word} — ${word.definition}. Say it once, then continue.`}/>}</div>}
  </Stage>;
}
