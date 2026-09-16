import { useState } from 'react';
import { Modal } from './ui';
import { useGame } from '../state/game';
import { activityOf } from '../data/lesson';

export function FlightHelp() {
  const [open,setOpen] = useState(false);
  const {state} = useGame();
  return <><button className="btn btn--ghost btn--sm" onClick={()=>setOpen(true)}>❔ Help</button><Modal open={open} onClose={()=>setOpen(false)} title="Flight guide · Как играть">
    <p><b>Сейчас: {activityOf(state.activity).title}.</b> {activityOf(state.activity).sub}</p>
    <ol><li>Начните с разминки. Потом посмотрите слова, историю и примеры.</li><li>В заданиях выберите ответ. Прочитайте объяснение и произнесите фразу вслух.</li><li>Кнопка Continue / Next ведёт дальше. Планеты наверху позволяют вернуться к любому этапу.</li><li>В Galaxy Run бросьте кубик и выполните задание клетки. На My planet придумайте свой мир и пригласите гостя.</li></ol>
    <div className="tile-card"><b>Can you repeat that, please?</b><p>Can you help me, please? · What does it mean? · Let me think.</p><p>Попросить помощь можно в любой момент. За ошибки и русский язык штрафов нет.</p></div>
    <p>⭐ Stars — игровые награды за участие и задания. 🎯 Accuracy — первые ответы в тренировке. Место в гонке не определяет уровень английского.</p>
    <p className="hint">Прогресс сохраняется в этом браузере. Открывайте Teacher для плана и ключей. Solo означает индивидуальное занятие с учителем.</p>
  </Modal></>;
}
