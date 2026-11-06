export function getDailyClock(now: Date, formatter: Intl.DateTimeFormat) {
  const [hour = '00', minute = '00', second = '00'] = formatter.format(now).split(':');
  return {
    time: `${hour}:${minute}`,
    progress: (Number(hour) * 3600 + Number(minute) * 60 + Number(second)) / 86_400,
  };
}
