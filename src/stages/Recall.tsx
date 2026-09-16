import { useState } from 'react';
import { RECALL, PRACTICE } from '../data/bridge';
import { useGame } from '../state/game';
import { Stage, NextButton } from '../components/Shell';
import { SayIt, Verdict, StarBurst } from '../components/ui';
import { artUrl } from '../lib/art';
import { sfx } from '../lib/audio';

export function Recall() {
  const [at, setAt] = useState(0);
  const [choice, setChoice] = useState('');
  const card = RECALL[at];
  return <Stage title="Memory reboot" step={`${at + 1} / ${RECALL.length}`} hint="Read the example. Say it together. Then answer the little question — no scores here."
    footer={<div className="btn-row"><button className="btn btn--ghost" disabled={!at} onClick={() => {setAt(at - 1); setChoice('');}}>← Back</button>{at < RECALL.length - 1 ? <button className="btn" disabled={choice !== card.answer} onClick={() => {setAt(at + 1);setChoice('');}}>Next example →</button> : <NextButton disabled={choice !== card.answer} label="Practise together" />}</div>}>
    <div className="bridge-grid">
      <div className="center"><img className="word-art float bridge-art" src={artUrl(card.image)} alt="" /><span className="pill">GoGetter 2 → ready for 3</span></div>
      <div className="col">
        <span className="card-label">Remember · {card.title}</span>
        <h2 className="bridge-model">{card.model}</h2><SayIt text={card.model} label="Listen and repeat" />
        <div className="tile-card"><b>{card.meaning}</b><p>{card.rule}</p><details><summary>🇷🇺 Подсказка</summary><p>{card.ru}</p></details></div>
        <b>{card.question}</b><div className="btn-row">{card.options.map(o => <button className={`btn ${choice === o ? '' : 'btn--ghost'}`} key={o} onClick={() => setChoice(o)}>{o}</button>)}</div>
        {choice && <Verdict ok={choice === card.answer} text={choice === card.answer ? 'Yes! Ready for the next example.' : 'Look at the example again. You can try another answer.'} />}
      </div>
    </div>
  </Stage>;
}

export function BridgePractice() {
  const { state, record, passTurn, finish, goto } = useGame();
  const [queue, setQueue] = useState(() => PRACTICE.map((_,i) => i));
  const [at, setAt] = useState(0);
  const [choice, setChoice] = useState('');
  const [hint, setHint] = useState(false);
  const [missed, setMissed] = useState<number[]>([]);
  const [right, setRight] = useState(0);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState(false);
  const item = PRACTICE[queue[at]];
  const lesson = RECALL.find(r => r.id === item.topic)!;
  const answer = (value: string) => {
    if (choice) return;
    setChoice(value);
    const ok = value === item.answer;
    if (ok) sfx.right(); else sfx.tap();
    if (!review) {
      record(ok, {skill:'grammar', rule:lesson.title});
      if (ok) setRight(n => n + 1); else setMissed(m => [...m, queue[at]]);
    }
  };
  const next = () => {
    if (at === queue.length - 1) { setDone(true); if (!review) finish('reboot', {right, total:PRACTICE.length}); }
    else {setAt(at + 1); setChoice(''); setHint(false); passTurn();}
  };
  return <Stage title={review ? 'Repair the memory cells' : 'Power up the spaceship'} step={done ? 'Checkpoint complete' : `${at + 1} / ${queue.length}`} turn
    hint="Think → choose → read the explanation → say the whole sentence. Mistakes tell us what to practise."
    footer={done ? <div className="btn-row"><button className="btn btn--ghost" onClick={() => goto('speed')}>Optional word boost</button><button className="btn" onClick={() => goto('run')}>Play Galaxy Run →</button></div> : <button className="btn" disabled={!choice} onClick={next}>Continue →</button>}>
    {done ? <div className="center bridge-summary"><StarBurst fire={1} /><h2 className="q">{review ? 'Good work, crew!' : 'The engine is ready!'}</h2><p>{review ? 'You revisited the tricky examples. Try a new sentence of your own.' : `${right} / ${PRACTICE.length} first answers correct across the crew. This is practice, not a level test.`}</p>
      {!review && missed.length > 0 && <button className="btn" onClick={() => {setQueue(missed);setAt(0);setChoice('');setHint(false);setReview(true);setDone(false);}}>↺ Practise {missed.length} tricky examples</button>}
      <button className="btn btn--ghost" onClick={() => goto('recall')}>Look at the examples again</button><p className="hint">{state.pilots.length > 1 ? 'Each pilot’s own answers are saved in the report.' : 'Your first answers are saved in the report.'}</p></div>
    : <div className="center" style={{width:'min(900px,100%)'}}><span className="pill">⚡ Memory cell · {lesson.title}</span><h2 className="q">{item.text}</h2><div className="opts">{item.options.map(o => <button className="opt" key={o} disabled={!!choice} onClick={() => answer(o)} data-state={choice && o === item.answer ? 'right' : choice === o ? 'wrong' : undefined}>{o}</button>)}</div>
      {!choice && <button className="btn btn--ghost btn--sm" onClick={() => setHint(!hint)}>💡 Show an example</button>}{hint && <p className="tile-card">{lesson.model}</p>}
      {choice && <Verdict ok={choice === item.answer} text={`${choice === item.answer ? 'You got it!' : `Good try. Answer: ${item.answer}.`} ${item.why}`} />}</div>}
  </Stage>;
}
