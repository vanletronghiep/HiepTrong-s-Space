export function getDailyClock(now: Date, formatter: Intl.DateTimeFormat) {
  const [hour = '00', minute = '00', second = '00'] = formatter.format(now).split(':');
  const elapsed = Number(hour) * 3600 + Number(minute) * 60 + Number(second);
  const remaining = Math.max(0, 86_400 - elapsed);
  const remH = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const remM = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const remS = String(remaining % 60).padStart(2, '0');

  return {
    time: `${hour}:${minute}`,
    timeSeconds: `${hour}:${minute}:${second}`,
    countdown: `-${remH}:${remM}:${remS} until 00:00`,
    progress: elapsed / 86_400,
  };
}
