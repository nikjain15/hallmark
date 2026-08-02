import { ImageResponse } from 'next/og';
import { runAssay } from '@/lib/assay';
import type { Mark, MarkId } from '@/lib/types';

export const alt = 'Hallmark certificate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Punch glyphs are DRAWN, not typed.
 *
 * The site uses unicode geometric shapes (⬢ ◉ ▤ ◈), but Satori's bundled font has no
 * glyphs for them and renders tofu. Shapes built from divs have no font dependency at all.
 */
function Glyph({ id, color }: { id: MarkId; color: string }) {
  if (id === 'live') {
    return <div style={{ display: 'flex', width: 22, height: 22, borderRadius: 22, border: `4px solid ${color}` }} />;
  }
  if (id === 'ship') {
    return <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 3, background: color }} />;
  }
  if (id === 'open') {
    return (
      <div style={{ display: 'flex', width: 18, height: 18, background: color, transform: 'rotate(45deg)' }} />
    );
  }
  // docs — three stacked rules
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 22 }}>
      <div style={{ display: 'flex', height: 4, background: color, marginBottom: 4 }} />
      <div style={{ display: 'flex', height: 4, background: color, marginBottom: 4 }} />
      <div style={{ display: 'flex', height: 4, background: color, width: 14 }} />
    </div>
  );
}

// Option C · split — identity left, 2×2 punch seal right. Dark ground.
// Satori supports a flexbox subset only: no grid, no gap shorthand quirks, every
// multi-child node needs an explicit display:flex.
const INK = '#F4EFE6';
const SOFT = '#A99F90';
const MARK = '#D8B45A';
const WASH = '#241D0F';
const RULE = '#3A342C';
const GROUND = '#12100D';

function Punch({ mark }: { mark: Mark }) {
  const struck = mark.state === 'struck';
  const unknown = mark.state === 'unknown';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 96,
        height: 96,
        borderRadius: 4,
        border: `3px ${unknown ? 'dashed' : 'solid'} ${struck ? MARK : RULE}`,
        background: struck ? WASH : 'transparent',
        color: struck ? MARK : SOFT,
      }}
    >
      <div style={{ display: 'flex', height: 24, alignItems: 'center', fontSize: 24, lineHeight: 1 }}>
        {unknown ? '?' : <Glyph id={mark.id} color={struck ? MARK : SOFT} />}
      </div>
      <div style={{ fontSize: 13, letterSpacing: 2, marginTop: 8, textTransform: 'uppercase' }}>
        {mark.id}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { builders } = await runAssay();
  const builder = builders.find((b) => b.handle.toLowerCase() === handle.toLowerCase());

  const marks: Mark[] =
    builder?.marks ??
    (['ship', 'live', 'docs', 'open'] as MarkId[]).map((id) => ({
      id,
      state: 'not-yet' as const,
      detail: '',
      remedy: null,
    }));

  const prod = builder?.ships[0]?.productionUrl ?? null;
  const prodHost = prod ? new URL(prod).hostname : 'no production url';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: GROUND }}>
        {/* left — identity */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1.15,
            padding: 64,
            borderRight: `1px solid ${RULE}`,
          }}
        >
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: MARK }}>
            ASSAYED · 2026
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {builder && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={builder.avatarUrl}
                width={96}
                height={96}
                alt=""
                style={{ borderRadius: 96, border: `3px solid ${MARK}`, marginBottom: 24 }}
              />
            )}
            <div style={{ display: 'flex', fontSize: 56, color: INK, lineHeight: 1.1 }}>
              {builder?.name ?? handle}
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: SOFT, marginTop: 8 }}>
              @{builder?.handle ?? handle}
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 22, color: MARK }}>{prodHost}</div>
        </div>

        {/* right — the seal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flex: 1,
            padding: 64,
          }}
        >
          <div style={{ display: 'flex', marginBottom: 16 }}>
            <div style={{ display: 'flex', marginRight: 16 }}><Punch mark={marks[0]} /></div>
            <Punch mark={marks[1]} />
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', marginRight: 16 }}><Punch mark={marks[2]} /></div>
            <Punch mark={marks[3]} />
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: INK, marginTop: 36, fontWeight: 700 }}>
            Hall<span style={{ color: MARK }}>mark</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
