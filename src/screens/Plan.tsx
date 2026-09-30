import { useApp } from '../state/useApp'
import { myBooking } from '../state/store'
import { buildSpots, spotById } from '../domain/layout'
import { freeCount, spotState, suggestAlternatives } from '../domain/availability'
import { dayInText, fmtDayLong, fmtRange, fmtTime, spotsWord } from '../domain/format'
import { bookingEnd, canCancel, canRelease, entryOpen, stage } from '../domain/lifecycle'
import { EARLY_ENTRY } from '../domain/time'
import { LAST_BOOKING, PLATE } from '../domain/data'
import { FloorPlan, planGeometry, type SpotLook } from '../ui/FloorPlan'
import { Button, FloorChips, FloorSwitch, Hint, PlanSkeleton, StatusBar } from '../ui/controls'
import { SpotSheet, type MineProps } from '../ui/SpotSheet'
import { AllInSheet } from '../ui/AltSheet'
import { ChevronLeft, CloudOff } from '../ui/icons'
import { dayShort, floorLabel, fmtDuration, onDay, useSize } from './helpers'

/** Назад на главную приложения БЦ: модуль открыт с карточки «Парковка» */
function BackButton({ float = false, onBack }: { float?: boolean; onBack: () => void }) {
  return (
    <button type="button" className={`plan-back ${float ? 'float' : ''}`} onClick={onBack} aria-label="На главную">
      <ChevronLeft size={20} />
    </button>
  )
}

/**
 * План — корень модуля. Без брони это выбор места; с бронью — карта к своему месту:
 * своё место зелёное, остальные приглушены, шторка рассказывает о брони
 */
export function PlanScreen() {
  const { s, d } = useApp()
  const [areaRef, area] = useSize<HTMLDivElement>()
  const ready = s.load === 'ready'
  const mine = myBooking(s)

  const looks: Record<string, SpotLook> = {}
  for (const sp of buildSpots(s.floor)) {
    if (mine) looks[sp.id] = sp.id === mine.spotId ? 'mine' : 'muted'
    else if (sp.id === s.selectedId && s.sheet !== 'conflict') looks[sp.id] = 'selected'
    else if (s.conflict?.takenId === sp.id) looks[sp.id] = 'taken'
    else if (s.sheet === 'conflict' && s.conflict?.altId === sp.id) looks[sp.id] = 'suggested'
    else {
      const st = spotState(sp, s.date, s.range, s.world)
      looks[sp.id] = st === 'free' ? 'free' : st === 'closed' ? 'closed' : 'unavailable'
    }
  }

  const counts = {
    '-1': ready ? freeCount(-1, s.date, s.range, s.world) : null,
    '-2': ready ? freeCount(-2, s.date, s.range, s.world) : null,
  }

  const sel = s.selectedId ? spotById(s.selectedId) : null
  const alt = s.conflict?.altId ? spotById(s.conflict.altId) : null
  const taken = s.conflict ? spotById(s.conflict.takenId) : null
  const alts = !mine && s.sheet === 'none' ? suggestAlternatives(s.date, s.range, s.now, s.world) : {}

  // Этажи внизу: под ними полоса 48 px, план выше неё. Высота плана одна и та же с бронью и без
  const bottom = s.floorsAt !== 'top'
  const planH = bottom ? Math.max(0, area.h - 48) : area.h

  let hint = null
  if (s.hint && area.w > 0) {
    const sp = spotById(s.hint.spotId)
    if (sp.floor === s.floor) {
      const g = planGeometry(area.w, planH)
      hint = <Hint text={s.hint.text} left={g.colX[sp.col] + g.COL / 2} top={g.TOP + sp.row * g.rowH} bound={area.w} />
    }
  }

  let mineProps: MineProps | undefined
  if (mine) {
    const spot = spotById(mine.spotId)
    const st = stage(mine, s.now)
    mineProps = {
      spotNum: spot.num,
      floorLabel: floorLabel(spot.floor),
      dayLong: fmtDayLong(mine.date, s.now),
      range: fmtRange(mine.range),
      stage: st === 'active' ? 'active' : entryOpen(mine, s.now) ? 'open' : 'locked',
      endTime: fmtTime(mine.range.end),
      left: fmtDuration(bookingEnd(mine).getTime() - s.now.getTime()),
      opensAt: fmtTime(mine.range.start - EARLY_ENTRY),
      cancelNote: canCancel(mine, s.now) ? `Отменить можно до ${fmtTime(mine.range.start)} ${dayInText(mine.date, s.now)}` : undefined,
      onTicket: () => d({ type: 'OPEN_TICKET' }),
      onCancel: () => d({ type: 'OPEN_CANCEL' }),
      onRelease: canRelease(mine, s.now) ? () => d({ type: 'OPEN_RELEASE' }) : undefined,
      onMenu: () => d({ type: 'OPEN_MENU' }),
    }
  }

  return (
    <div className={`screen plan-screen ${mine ? 'is-mine' : ''} ${bottom ? 'floors-bottom' : ''}`}>
      <StatusBar />
      {/* С бронью выбирать нечего: этаж — в шторке, плану отдаём всю высоту. Время брони — в шторке рядом с кнопкой */}
      {bottom && <BackButton float onBack={() => d({ type: 'GO_HOST' })} />}
      {!bottom && (
        <div className="plan-top">
          <BackButton onBack={() => d({ type: 'GO_HOST' })} />
          {!mine && <FloorSwitch floor={s.floor} counts={counts} onChange={(floor) => d({ type: 'SET_FLOOR', floor })} />}
        </div>
      )}
      <div className="plan-area" ref={areaRef}>
        {s.load === 'error' && (
          <div className="load-error">
            <CloudOff size={44} />
            <b>Не удалось загрузить места</b>
            <p>Проверьте интернет и попробуйте ещё раз. Дата и время сохранятся.</p>
            <Button variant="secondary" full={false} onClick={() => d({ type: 'RETRY_LOAD' })}>Повторить</Button>
          </div>
        )}
        {s.load === 'loading' && area.w > 0 && <PlanSkeleton width={area.w} height={planH} />}
        {ready && area.w > 0 && <FloorPlan floor={s.floor} looks={looks} width={area.w} height={planH} slant={s.slant} onTap={(id) => d({ type: 'TAP_SPOT', spotId: id })} />}
        {ready && hint}
        {/* Нет мест — нуль на обоих этажах, переключать нечего: выход из ситуации — другое время в шторке */}
        {bottom && !mine && s.load !== 'error' && s.sheet !== 'none' && (
          <div className={`plan-floors ${s.floorsAt === 'bottom-left' ? 'left' : 'center'}`}>
            <FloorChips floor={s.floor} counts={counts} onChange={(floor) => d({ type: 'SET_FLOOR', floor })} />
          </div>
        )}
      </div>
      {/* Пробовали: всё о брони в шторке — оставлено только для сравнения */}
      {ready && mineProps && s.allInSheet && (
        <AllInSheet
          {...mineProps}
          entry={s.entry}
          plate={PLATE}
          onBarrier={() => d({ type: 'SHOW_TOAST', kind: 'success', text: 'Шлагбаум открывается' })}
          onRoute={() => d({ type: 'OPEN_ROUTE' })}
        />
      )}
      {ready && !(mineProps && s.allInSheet) && (
        <SpotSheet
          mode={mine ? 'mine' : s.sheet}
          mine={mineProps}
          spotNum={s.sheet === 'conflict' ? taken?.num : sel?.num}
          floorLabel={sel ? floorLabel(sel.floor) : ''}
          reason={s.reason}
          lastNum={spotById(LAST_BOOKING.spotId).num}
          dayLong={fmtDayLong(s.date, s.now)}
          range={fmtRange(s.range)}
          altNum={alt?.num}
          noneTitle={`${onDay(s.date, s.now)[0].toUpperCase()}${onDay(s.date, s.now).slice(1)} ${fmtRange(s.range)} мест нет`}
          alternatives={[
            ...(alts.later ? [{ label: `С ${fmtTime(alts.later.range.start)} — ${alts.later.count} ${spotsWord(alts.later.count)}`, onPick: () => d({ type: 'APPLY_TIME', date: s.date, range: alts.later!.range }) }] : []),
            ...(alts.day ? [{ label: `${dayShort(alts.day.date)[0].toUpperCase()}${dayShort(alts.day.date).slice(1)} — ${alts.day.count} ${spotsWord(alts.day.count)}`, onPick: () => d({ type: 'APPLY_TIME', date: alts.day!.date, range: s.range }) }] : []),
          ]}
          onSubmit={() => d({ type: 'SUBMIT' })}
          onAcceptAlt={() => d({ type: 'ACCEPT_ALT' })}
          onPickOnPlan={() => d({ type: 'PICK_ON_PLAN' })}
          onNotify={() => d({ type: 'NOTIFY_ME' })}
          onTime={() => d({ type: 'OPEN_TIME' })}
        />
      )}
    </div>
  )
}
