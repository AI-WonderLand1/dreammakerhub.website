import type { BlockRenderer } from './types';

export const formsRenderers: Record<string, BlockRenderer> = {
  'button': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <a {...baseProps} href={el.props.url || '#'} style={{ ...style, textDecoration: 'none' }}>{el.props.label || 'Button'}{children}</a>;
  },
  'buttons': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <div {...baseProps}>
          {(el.props.buttons as any[])?.map((btn: any, i: number) => (
            <span key={i} style={{
              backgroundColor: btn.variant === 'primary' ? '#7c3aed' : btn.variant === 'secondary' ? 'transparent' : 'transparent',
              color: btn.variant === 'outline' ? '#7c3aed' : '#fff',
              border: btn.variant === 'outline' ? '1px solid #7c3aed' : 'none',
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
            }}>{btn.label}</span>
          ))}
          {children}
        </div>
      );
  },
  'input': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><input type={el.props.type || 'text'} placeholder={el.props.placeholder} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /></div>;
  },
  'checkbox': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={el.props.checked || false} readOnly /><span className="text-xs text-white/70">{el.props.label}</span>{children}</div>;
  },
  'radio': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><p className="text-xs text-white/50 mb-1">{el.props.label}</p>{(el.props.options as string[] || []).map((o: string, i: number) => <label key={i} className="flex items-center gap-2 text-xs text-white/60"><input type="radio" name={el.id} defaultChecked={i === 0} />{o}</label>)}{children}</div>;
  },
  'search': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" placeholder={el.props.placeholder || 'Search...'} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText || '🔍'}</button>{children}</div>;
  },
  'product-search': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" placeholder={el.props.placeholder || 'Search...'} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText || '🔍'}</button>{children}</div>;
  },

  'form-multi-step': ({ el, baseProps, style, children }) => {
    const steps: string[] = el.props.steps || [];
    const cur = Math.min(el.props.currentStep || 1, steps.length);
    return (
      <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
        {el.props.showProgress !== false && (
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
            {steps.map((s: string, i: number) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: i < cur ? '#a855f7' : 'rgba(255,255,255,0.12)' }} title={s} />
            ))}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.75rem' }}>Step {cur} of {steps.length} — {steps[cur - 1]}</div>
        {children}
      </form>
    );
  },
  'survey-nps': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <p style={{ fontWeight: 600 }}>{el.props.question}</p>
      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', margin: '0.75rem 0' }}>
        {Array.from({ length: 11 }, (_, i) => (
          <button key={i} type="button" style={{ width: 34, height: 34, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: i <= 6 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: '#fff', cursor: 'pointer' }}>{i}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.55 }}><span>{el.props.lowLabel}</span><span>{el.props.highLabel}</span></div>
    </div>
  ),
  'quiz-form': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={style}>
      <strong>{el.props.question}</strong>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
        {(el.props.options || []).map((o: any, i: number) => (
          <label key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
            <input type="radio" name="quiz" /> {o.text}
          </label>
        ))}
      </div>
      {children}
    </div>
  ),
  'booking-form': ({ el, baseProps, style }) => (
    <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
      <strong>🗓️ {el.props.service}</strong>
      <input type="date" aria-label="Pick a date" style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff' }} />
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {(el.props.timeSlots || []).map((t: string) => (
          <button key={t} type="button" style={{ padding: '0.35rem 0.7rem', borderRadius: 999, border: '1px solid rgba(34,197,94,0.5)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>{t}</button>
        ))}
      </div>
      <span style={{ fontSize: '0.7rem', opacity: 0.55 }}>Times shown in {el.props.timezone}</span>
      <button type="submit" style={{ padding: '0.6rem', borderRadius: 8, border: 0, background: '#22c55e', color: '#052e16', fontWeight: 700, cursor: 'pointer' }}>{el.props.cta}</button>
    </form>
  ),
  'login-form': ({ el, baseProps, style, children }) => (
    <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
      <h3 style={{ margin: 0 }}>{el.props.heading}</h3>
      <input type="email" placeholder={el.props.emailPlaceholder || 'Email'} required style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      <input type="password" placeholder="Password" required style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      <button type="submit" style={{ padding: '0.6rem', borderRadius: 8, border: 0, background: '#7c3aed', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{el.props.buttonLabel}</button>
      {el.props.showForgot !== false && <a href="#" style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.6 }}>Forgot password?</a>}
      {children}
    </form>
  ),
  'register-form': ({ el, baseProps, style }) => (
    <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
      <h3 style={{ margin: 0 }}>{el.props.heading}</h3>
      <input type="email" placeholder="Email" required style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      <input type="password" placeholder="Password" required minLength={8} title={el.props.passwordHint} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      {el.props.requireTerms !== false && <label style={{ fontSize: '0.75rem', opacity: 0.75, display: 'flex', gap: '0.4rem' }}><input type="checkbox" required /> {el.props.termsLabel}</label>}
      <button type="submit" style={{ padding: '0.6rem', borderRadius: 8, border: 0, background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create account</button>
      <small style={{ opacity: 0.5 }}>{el.props.passwordHint}</small>
    </form>
  ),
  'otp-input': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style} role="group" aria-label="One-time code">
      {Array.from({ length: el.props.digits || 6 }, (_, i) => (
        <input key={i} maxLength={1} inputMode="numeric" type={el.props.masked ? 'password' : 'text'} style={{ width: 42, height: 50, textAlign: 'center', fontSize: '1.2rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      ))}
      <small style={{ width: '100%', textAlign: 'center', opacity: 0.5 }}>Resend available in {el.props.resendAfter}s</small>
    </div>
  ),
  'profile-edit-form': ({ el, baseProps, style, children }) => (
    <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: el.props.avatarUrl ? `url(${el.props.avatarUrl}) center/cover` : 'rgba(168,85,247,0.25)', border: '2px solid rgba(168,85,247,0.5)' }} aria-hidden="true" />
      <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
        {(el.props.fields || []).map((f: any) => (
          <input key={f.key} placeholder={f.label} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#fff' }} />
        ))}
        <button type="submit" style={{ justifySelf: 'start', padding: '0.45rem 1rem', borderRadius: 6, border: 0, background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{el.props.saveLabel}</button>
      </div>
      {children}
    </form>
  ),
  'filter-panel': ({ el, baseProps, style }) => (
    <aside {...baseProps} style={style} aria-label="Filters">
      {(el.props.filters || []).map((f: any) => (
        <fieldset key={f.label} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>{f.label}</legend>
          {f.type === 'range' && <input type="range" style={{ width: '100%' }} />}
          {(f.options || []).map((o: string) => (
            <label key={o} style={{ display: 'flex', gap: '0.35rem', fontSize: '0.8rem', opacity: 0.85 }}><input type="checkbox" /> {o}</label>
          ))}
        </fieldset>
      ))}
      <button style={{ padding: '0.45rem', borderRadius: 6, border: 0, background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{el.props.applyLabel}</button>
    </aside>
  ),
  'rating-feedback': ({ el, baseProps, style }) => (
    <div {...baseProps} style={style}>
      <div role="img" aria-label="Rate us">
        {Array.from({ length: el.props.maxStars || 5 }, (_, i) => (
          <button key={i} type="button" aria-label={`${i + 1} stars`} style={{ background: 'none', border: 0, fontSize: '1.6rem', cursor: 'pointer', color: '#facc15' }}>☆</button>
        ))}
      </div>
      {el.props.askComment && <textarea placeholder={el.props.commentPlaceholder} rows={2} style={{ width: '100%', marginTop: '0.6rem', padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#fff' }} />}
      <button style={{ marginTop: '0.6rem', padding: '0.45rem 1.1rem', borderRadius: 6, border: 0, background: '#facc15', color: '#422006', fontWeight: 700, cursor: 'pointer' }}>{el.props.submitLabel}</button>
    </div>
  ),
  'file-upload-form': ({ el, baseProps, style }) => (
    <label {...baseProps} style={style}>
      <input type="file" multiple accept={el.props.accept} hidden onChange={() => {}} />
      <div style={{ fontSize: '1.8rem' }}>📤</div>
      <div>{el.props.dropText}</div>
      <small style={{ opacity: 0.5 }}>Up to {el.props.maxFiles} files · {el.props.maxSizeMb}MB each</small>
    </label>
  ),
  'newsletter-inline': ({ el, baseProps, style, children }) => (
    <form {...baseProps} style={style} onSubmit={(e: any) => e.preventDefault()}>
      <input type="email" placeholder={el.props.placeholder} required style={{ flex: 1, minWidth: 180, padding: '0.55rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
      <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: 6, border: 0, background: '#06b6d4', color: '#083344', fontWeight: 700, cursor: 'pointer' }}>{el.props.buttonLabel}</button>
      <small style={{ width: '100%', opacity: 0.45, fontSize: '0.65rem' }}>{el.props.disclaimer}</small>
      {children}
    </form>
  ),
};
