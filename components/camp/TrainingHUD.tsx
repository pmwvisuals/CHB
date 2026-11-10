import type {TrainingHUD as TrainingState} from '@/lib/game/training-combat';
export default function TrainingHUD({state}:{state:TrainingState}){
 return <aside className="training-hud" aria-label="Training ground practice">
  <span className="training-eyebrow">THE TRAINING GROUNDS · PRACTICE PvE</span>
  <h3>{state.title}</h3><p>{state.hint}</p>
  <div className="training-weapons"><span className={state.weapon==='sword'?'selected':''}>1 · SWORD</span><span className={state.weapon==='bow'?'selected':''}>2 · BOW</span></div>
  <div className="training-stat"><span>Stamina</span><b>{Math.round(state.stamina)}%</b></div><div className="training-meter"><i style={{width:state.stamina+'%'}}/></div>
  {state.weapon==='bow'?<><div className="training-stat"><span>Bow draw</span><b>{Math.round(state.charge*100)}%</b></div><div className="training-meter bow"><i style={{width:state.charge*100+'%'}}/></div><small>Hold left mouse to draw · Release to shoot<br/>Aim above distant targets to account for arrow drop.</small></>:<small>Left mouse: light strike · F: heavy strike<br/>Right mouse: guard · Chain light hits within one second.</small>}
  <div className="training-progress"><b>{state.complete?'DRILL COMPLETE':state.progress}</b><span>{state.score} points{state.best>0?` · Best ${state.best}`:''}</span></div>
  {state.combo>1&&<strong className="training-combo">{state.combo} HIT CHAIN</strong>}
  <p className={`training-feedback ${state.incoming?'incoming':''}`} role="status">{state.incoming?'INCOMING STRIKE · FACE DUMMY & GUARD':state.message||'Practice weapons are free. No damage to your camp progress.'}</p>
  <footer><kbd>R</kbd> {state.complete?'Next technique':'Next drill / free practice'}{state.sessionOnly&&<small>Personal best is available for this session only.</small>}</footer>
 </aside>;
}
