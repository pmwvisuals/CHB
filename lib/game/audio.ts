// Small synthesized soundscape: no external audio requests or autoplay.
export class CampAudio {
  ctx: AudioContext | null=null; master: GainNode | null=null; wind: GainNode | null=null; lake: GainNode | null=null; fire: GainNode | null=null;
  nextBird=0; nextStep=0;
  start(volume:number) { if(this.ctx){void this.ctx.resume();return;} const ctx=this.ctx=new AudioContext();this.master=ctx.createGain();this.master.gain.value=volume*.45;this.master.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let b=0;for(let i=0;i<data.length;i++){b=(b+Math.random()*.04-.02)/1.02;data[i]=b*8;}
    const noise=(frequency:number,gain:number)=>{const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=frequency;const g=ctx.createGain();g.gain.value=gain;src.connect(filter).connect(g).connect(this.master!);src.start();return g;};
    this.wind=noise(350,.18);this.lake=noise(900,0);this.fire=noise(1800,0);
  }
  volume(v:number){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(v*.45,this.ctx.currentTime,.1);}
  pause(){if(this.ctx)void this.ctx.suspend();}
  tone(freq:number,duration:number,volume:number,type:OscillatorType='sine'){if(!this.ctx||!this.master)return;const ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.65,ctx.currentTime+duration);g.gain.setValueAtTime(volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g).connect(this.master);o.start();o.stop(ctx.currentTime+duration);}
  update(x:number,z:number,moving:boolean,sprinting:boolean){if(!this.ctx)return;const t=this.ctx.currentTime;this.lake!.gain.setTargetAtTime(.23*Math.max(0,1-Math.hypot(x-80,z)/45),t,.4);this.fire!.gain.setTargetAtTime(.35*Math.max(0,1-Math.hypot(x,z+62)/20),t,.3);
    if(moving&&t>this.nextStep){this.tone(95+Math.random()*25,.075,.19,'triangle');this.nextStep=t+(sprinting?.29:.43);}if(t>this.nextBird){this.tone(1900+Math.random()*1300,.2,.05);this.nextBird=t+5+Math.random()*6;}}
  dispose(){void this.ctx?.close();}
}
