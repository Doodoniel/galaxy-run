import { useState } from 'react';
import { Stage, NextButton } from '../components/Shell';
import { SayIt } from '../components/ui';
import { artUrl } from '../lib/art';

const CARDS = [
  {title:'Hello again!', ask:'Hi! How are you today?', reply:'I’m fine / tired / happy, thank you. And you?', task:'Ask the pilot next to you. They answer and ask you back.', ru:'Поздоровайтесь. Спросите соседа, как он себя чувствует. Не забудьте And you?'},
  {title:'Meet your crew', ask:'What’s your name? What do you like doing?', reply:'My name’s … I like playing games / swimming / drawing.', task:'Choose a space nickname. Tell your partner one thing you like.', ru:'Назовите своё игровое имя и одно любимое занятие.'},
  {title:'Your superpower: ask for help', ask:'Can you repeat that, please?', reply:'Can you help me, please? What does “wise” mean? How do you say «лето» in English?', task:'One pilot speaks quietly. The other asks them to repeat. Swap roles.', ru:'Попросить помощь — это хороший английский. Повторите фразу и разыграйте её вдвоём.'},
  {title:'A tiny summer memory', ask:'Did you have a good summer?', reply:'Yes, I did. / Not really. I stayed at home / played games / went swimming.', task:'Say one true thing or invent a funny summer for Richie. Ask: What about you?', ru:'Одного предложения достаточно. Можно придумать лето Ричи, если не хочется говорить о своём.'},
];
export function Warmup() {
  const [at,setAt] = useState(0);
  const c = CARDS[at];
  return <Stage title="Radio check · say hello!" step={`${at+1} / 4`} hint="No marks. Think for a moment. Try it with a partner or your teacher."
    footer={<div className="btn-row"><button className="btn btn--ghost" disabled={!at} onClick={()=>setAt(at-1)}>← Back</button>{at<3 ? <button className="btn" onClick={()=>setAt(at+1)}>We tried it →</button> : <NextButton label="Meet Richie’s words" />}</div>}>
    <div className="bridge-grid"><div className="center"><img className="word-art float bridge-art" src={artUrl('chameleon')} alt="Richie the chameleon" /><span className="pill">Mistakes welcome. Help welcome.</span></div><div className="col"><span className="card-label">{c.title}</span><h2 className="bridge-model">{c.ask}</h2><SayIt text={c.ask} label="Listen" /><div className="tile-card"><span className="card-label">You can say</span><p className="bridge-model">{c.reply}</p></div><p>{c.task}</p><details><summary>🇷🇺 Подсказка</summary><p>{c.ru}</p></details></div></div>
  </Stage>;
}
