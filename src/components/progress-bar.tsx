export function ProgressBar({value,label=true}:{value:number;label?:boolean}){
  const safe=Math.max(0,Math.min(100,value));
  return <div className="progress-stack">{label&&<div className="progress-label"><span>Progress</span><strong>{safe}%</strong></div>}<div className="progress-track" aria-label={`${safe}% complete`}><div className="progress-fill" style={{width:`${safe}%`}}/></div></div>
}
