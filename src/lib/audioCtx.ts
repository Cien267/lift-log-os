let audioCtx: AudioContext | null = null;

export const getAudioCtx = () => {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

export const unlockAudio = async () => {
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
};
