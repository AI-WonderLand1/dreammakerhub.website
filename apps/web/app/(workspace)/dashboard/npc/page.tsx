
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(npc.id); }}
                    className="p-2 rounded hover:bg-white/10 text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {liveNpcId === npc.id && (
                <div className="border-t border-white/10 bg-black/30 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-white/50">Real-time connection: </span>
                      <span className={`font-semibold ${
                        liveStatus === "connected" ? "text-emerald-400" :
                        liveStatus === "connecting" ? "text-yellow-400" :
                        liveStatus === "error" ? "text-red-400" : "text-white/60"
                      }`}>
                        {liveStatus}
                      </span>
                    </div>
                    <button
                      onClick={() => deployToPlayCanvas(npc.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition"
                    >
                      <Play size={12} /> Deploy to PlayCanvas
                    </button>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2 font-mono text-[11px] text-white/60 max-h-40 overflow-auto custom-scrollbar">
                    {liveLog.length === 0 ? (
                      <span className="text-white/35">No live events yet. Deploy to PlayCanvas to stream voice, visemes & dialogue.</span>
                    ) : (
                      liveLog.map((line, i) => <div key={i}>{line}</div>)
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}